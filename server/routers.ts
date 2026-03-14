import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { notifyOwner } from "./_core/notification";
import { generatePasswordResetToken, hashResetToken, normalizeAuthEmail, hashPassword, toLocalOpenId, verifyPassword } from "./_core/localAuth";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { listings, categories, cities, plans, listingImages, boosters, favorites, users, passwordResetTokens } from "../drizzle/schema";
import { eq, desc, and, like, gte, lte, or, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getMockListingById,
  mockCategories,
  mockCities,
  mockListings,
  mockPlans,
} from "./mockData";

async function attachImagesToListings<T extends { id: number }>(
  db: Awaited<ReturnType<typeof getDb>>,
  items: T[]
): Promise<Array<T & { images: Array<(typeof listingImages.$inferSelect)> }>> {
  if (!db || items.length === 0) {
    return items.map(item => ({ ...item, images: [] }));
  }

  const ids = items.map(item => item.id);
  const images = await db
    .select()
    .from(listingImages)
    .where(inArray(listingImages.listingId, ids))
    .orderBy(listingImages.listingId, listingImages.sortOrder, desc(listingImages.isPrimary));

  const imagesByListingId = new Map<number, Array<(typeof listingImages.$inferSelect)>>();
  for (const image of images) {
    const existing = imagesByListingId.get(image.listingId) ?? [];
    existing.push(image);
    imagesByListingId.set(image.listingId, existing);
  }

  return items.map(item => ({
    ...item,
    images: imagesByListingId.get(item.id) ?? [],
  }));
}

const defaultCategoryCatalog = [
  { name: "Delivery", slug: "delivery", icon: "ShoppingBag", color: "#f97316", sortOrder: 1 },
  { name: "Servicos Gerais", slug: "servicos-gerais", icon: "Wrench", color: "#8b5cf6", sortOrder: 2 },
  { name: "Veiculos", slug: "veiculos", icon: "Car", color: "#2563eb", sortOrder: 3 },
  { name: "Imoveis", slug: "imoveis", icon: "HomeIcon", color: "#0f766e", sortOrder: 4 },
  { name: "Eletronicos", slug: "eletronicos", icon: "Smartphone", color: "#06b6d4", sortOrder: 5 },
];

async function ensureDefaultCategories(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  await db
    .update(categories)
    .set({ isActive: false })
    .where(eq(categories.slug, "onde-comer"));

  for (const category of defaultCategoryCatalog) {
    await db.execute(sql`
      INSERT INTO categories (name, slug, icon, color, isActive, sortOrder, viewCount)
      VALUES (${category.name}, ${category.slug}, ${category.icon}, ${category.color}, true, ${category.sortOrder}, 0)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        icon = VALUES(icon),
        color = VALUES(color),
        isActive = true,
        sortOrder = VALUES(sortOrder)
    `);
  }
}

async function resolveInsertId(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  result: unknown
) {
  const directInsertId =
    (result as any)?.insertId ??
    (Array.isArray(result) ? (result[0] as any)?.insertId : undefined);

  if (typeof directInsertId === "number" && Number.isFinite(directInsertId)) {
    return directInsertId;
  }

  const fallbackRows = await db.execute(sql`select last_insert_id() as id`);
  const fallbackId = Number((fallbackRows as any)?.[0]?.id ?? (fallbackRows as any)?.rows?.[0]?.id);

  if (Number.isFinite(fallbackId) && fallbackId > 0) {
    return fallbackId;
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Nao foi possivel identificar o ID do registro criado.",
  });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => {
      if (!opts.ctx.user) return null;
      const { passwordHash: _passwordHash, ...safeUser } = opts.ctx.user;
      return safeUser;
    }),
    register: publicProcedure.input(z.object({
      name: z.string().min(2).max(120),
      email: z.string().email(),
      password: z.string().min(6).max(100),
      personType: z.enum(["pf", "pj"]).default("pf"),
      whatsapp: z.string().optional(),
      cpfCnpj: z.string().optional(),
      companyName: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const email = normalizeAuthEmail(input.email);
      const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (existingUser) {
        throw new TRPCError({ code: "CONFLICT", message: "Este email ja esta cadastrado." });
      }

      const openId = toLocalOpenId(email);
      const now = new Date();
      const trialStartedAt = new Date();

      const result = await db.insert(users).values({
        openId,
        name: input.name.trim(),
        email,
        passwordHash: hashPassword(input.password),
        loginMethod: "local",
        role: "advertiser",
        personType: input.personType,
        whatsapp: input.whatsapp?.trim() || null,
        cpfCnpj: input.cpfCnpj?.trim() || null,
        companyName: input.personType === "pj" ? input.companyName?.trim() || null : null,
        trialStartedAt,
        trialUsed: false,
        lastSignedIn: now,
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name: input.name.trim(),
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return {
        success: true as const,
        userId: await resolveInsertId(db, result),
      };
    }),
    login: publicProcedure.input(z.object({
      email: z.string().email(),
      password: z.string().min(6).max(100),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const email = normalizeAuthEmail(input.email);
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (!user || !verifyPassword(input.password, user.passwordHash)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou senha invalidos." });
      }

      if (user.isBanned) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sua conta foi bloqueada." });
      }

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "Usuario",
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

      return { success: true as const };
    }),
    requestPasswordReset: publicProcedure.input(z.object({
      email: z.string().email(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const email = normalizeAuthEmail(input.email);
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (user && user.passwordHash) {
        const rawToken = generatePasswordResetToken();
        const tokenHash = hashResetToken(rawToken);
        const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

        await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
        await db.insert(passwordResetTokens).values({
          userId: user.id,
          tokenHash,
          expiresAt,
        });

        const origin = ctx.req.headers.origin;
        const baseUrl =
          (typeof origin === "string" && origin) ||
          ctx.req.headers.referer?.split("/").slice(0, 3).join("/") ||
          "http://localhost:3000";
        const resetLink = `${baseUrl.replace(/\/+$/, "")}/redefinir-senha?token=${rawToken}`;

        try {
          await notifyOwner({
            title: "Pedido de recuperacao de senha",
            content: `Conta: ${email}\nLink temporario: ${resetLink}\nExpira em 30 minutos.`,
          });
        } catch (error) {
          console.warn("[Auth] Failed to notify owner about password reset:", error);
        }

        console.info(`[Auth] Password reset requested for ${email}. Link: ${resetLink}`);
      }

      return {
        success: true as const,
        message: "Se existir uma conta com este email, as instrucoes de recuperacao foram geradas.",
      };
    }),
    resetPassword: publicProcedure.input(z.object({
      token: z.string().min(20),
      password: z.string().min(6).max(100),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const tokenHash = hashResetToken(input.token);
      const now = new Date();
      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.tokenHash, tokenHash))
        .limit(1);

      if (!resetToken || resetToken.usedAt || resetToken.expiresAt < now) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Token de recuperacao invalido ou expirado." });
      }

      await db
        .update(users)
        .set({
          passwordHash: hashPassword(input.password),
          updatedAt: now,
        })
        .where(eq(users.id, resetToken.userId));

      await db
        .update(passwordResetTokens)
        .set({ usedAt: now })
        .where(eq(passwordResetTokens.id, resetToken.id));

      return { success: true as const };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    updateProfile: protectedProcedure.input(z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
      bio: z.string().optional(),
      personType: z.enum(["pf", "pj"]).optional(),
      cpfCnpj: z.string().optional(),
      companyName: z.string().optional(),
      cityId: z.number().optional(),
      neighborhood: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(users).set({ ...input, updatedAt: new Date() }).where(eq(users.id, ctx.user.id));
      return { success: true };
    }),
    uploadAvatar: protectedProcedure.input(z.object({
      base64: z.string(),
      mimeType: z.string().default("image/jpeg"),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { storagePut } = await import("./storage");
      const buffer = Buffer.from(
        input.base64.replace(/^data:[^;]+;base64,/, ""),
        "base64"
      );
      const extension =
        input.mimeType === "image/png"
          ? "png"
          : input.mimeType === "image/webp"
            ? "webp"
            : "jpg";
      const key = `avatars/${ctx.user.id}/profile-${Date.now()}.${extension}`;
      const { url } = await storagePut(key, buffer, input.mimeType);

      await db
        .update(users)
        .set({
          avatar: url,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return { success: true as const, url };
    }),
  }),

  // ─── Public Data ────────────────────────────────────────────────────────────
  public: router({
    cities: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return mockCities;
      return db.select().from(cities).where(eq(cities.isActive, true)).orderBy(cities.name);
    }),
    categories: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return mockCategories;
      await ensureDefaultCategories(db);
      return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder);
    }),
    topCategories: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(20).default(10) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          return [...mockCategories]
            .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0) || a.sortOrder - b.sortOrder)
            .slice(0, input.limit);
        }

        await ensureDefaultCategories(db);

        return db
          .select()
          .from(categories)
          .where(eq(categories.isActive, true))
          .orderBy(desc(categories.viewCount), categories.sortOrder)
          .limit(input.limit);
      }),
    trackCategoryView: publicProcedure
      .input(z.object({ slug: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          const category = mockCategories.find(item => item.slug === input.slug);
          if (category) {
            category.viewCount = (category.viewCount ?? 0) + 1;
          }
          return { success: true } as const;
        }

        await db
          .update(categories)
          .set({ viewCount: sql`${categories.viewCount} + 1` as any })
          .where(eq(categories.slug, input.slug));

        return { success: true } as const;
      }),
    plans: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return mockPlans;
      return db.select().from(plans).where(eq(plans.isActive, true)).orderBy(plans.price);
    }),
    featuredListings: publicProcedure.input(z.object({
      limit: z.number().default(12),
      cityId: z.number().optional(),
    })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return mockListings
          .filter(item => item.status === "active" && item.isBoosted)
          .filter(item => !input.cityId || item.cityId === input.cityId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, input.limit);
      }
      const conditions = [eq(listings.status, "active"), eq(listings.isBoosted, true)];
      if (input.cityId) conditions.push(eq(listings.cityId, input.cityId));
      const items = await db
        .select()
        .from(listings)
        .where(and(...conditions))
        .orderBy(desc(listings.createdAt))
        .limit(input.limit);
      return attachImagesToListings(db, items);
    }),
    recentListings: publicProcedure.input(z.object({
      limit: z.number().default(20),
      cityId: z.number().optional(),
      categoryId: z.number().optional(),
    })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return mockListings
          .filter(item => item.status === "active")
          .filter(item => !input.cityId || item.cityId === input.cityId)
          .filter(item => !input.categoryId || item.categoryId === input.categoryId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, input.limit);
      }
      const conditions: ReturnType<typeof eq>[] = [eq(listings.status, "active")];
      if (input.cityId) conditions.push(eq(listings.cityId, input.cityId));
      if (input.categoryId) conditions.push(eq(listings.categoryId, input.categoryId));
      const items = await db
        .select()
        .from(listings)
        .where(and(...conditions))
        .orderBy(desc(listings.createdAt))
        .limit(input.limit);
      return attachImagesToListings(db, items);
    }),
    searchListings: publicProcedure.input(z.object({
      q: z.string().optional(),
      categoryId: z.number().optional(),
      cityId: z.number().optional(),
      type: z.enum(["product", "service", "vehicle", "property", "food", "job"]).optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        const filtered = mockListings
          .filter(item => item.status === "active")
          .filter(item => !input.q || item.title.toLowerCase().includes(input.q.toLowerCase()))
          .filter(item => !input.categoryId || item.categoryId === input.categoryId)
          .filter(item => !input.cityId || item.cityId === input.cityId)
          .filter(item => !input.type || item.type === input.type)
          .filter(item => !input.minPrice || Number(item.price ?? 0) >= input.minPrice)
          .filter(item => !input.maxPrice || Number(item.price ?? 0) <= input.maxPrice);
        const offset = (input.page - 1) * input.limit;
        return { items: filtered.slice(offset, offset + input.limit), total: filtered.length };
      }
      const conditions: any[] = [eq(listings.status, "active")];
      if (input.q) conditions.push(like(listings.title, `%${input.q}%`));
      if (input.categoryId) conditions.push(eq(listings.categoryId, input.categoryId));
      if (input.cityId) conditions.push(eq(listings.cityId, input.cityId));
      if (input.type) conditions.push(eq(listings.type, input.type));
      if (input.minPrice) conditions.push(gte(listings.price, String(input.minPrice)));
      if (input.maxPrice) conditions.push(lte(listings.price, String(input.maxPrice)));
      const offset = (input.page - 1) * input.limit;
      const items = await db.select().from(listings).where(and(...conditions)).orderBy(desc(listings.isBoosted), desc(listings.createdAt)).limit(input.limit).offset(offset);
      const itemsWithImages = await attachImagesToListings(db, items);
      return { items: itemsWithImages, total: items.length };
    }),
    listingById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return getMockListingById(input.id);
      const [listing] = await db.select().from(listings).where(eq(listings.id, input.id)).limit(1);
      if (!listing) return null;
      const images = await db.select().from(listingImages).where(eq(listingImages.listingId, input.id)).orderBy(listingImages.sortOrder);
      const [seller] = await db
        .select({
          id: users.id,
          name: users.name,
          personType: users.personType,
          companyName: users.companyName,
          avatar: users.avatar,
          whatsapp: users.whatsapp,
          isVerified: users.isVerified,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, listing.userId))
        .limit(1);
      await db.update(listings).set({ viewCount: sql`${listings.viewCount} + 1` }).where(eq(listings.id, input.id));
      return { ...listing, images, seller };
    }),
    listingsByCategory: publicProcedure.input(z.object({ categorySlug: z.string(), limit: z.number().default(12) })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        const category = mockCategories.find(item => item.slug === input.categorySlug);
        if (!category) return [];
        return mockListings
          .filter(item => item.status === "active" && item.categoryId === category.id)
          .sort((a, b) => Number(b.isBoosted) - Number(a.isBoosted) || b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, input.limit);
      }
      const [cat] = await db.select().from(categories).where(eq(categories.slug, input.categorySlug)).limit(1);
      if (!cat) return [];
      const items = await db
        .select()
        .from(listings)
        .where(and(eq(listings.status, "active"), eq(listings.categoryId, cat.id)))
        .orderBy(desc(listings.isBoosted), desc(listings.createdAt))
        .limit(input.limit);
      return attachImagesToListings(db, items);
    }),
  }),

  // ─── Advertiser ─────────────────────────────────────────────────────────────
  advertiser: router({
    myListings: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(listings).where(eq(listings.userId, ctx.user.id)).orderBy(desc(listings.createdAt));
    }),
    listingForEdit: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [listing] = await db
        .select()
        .from(listings)
        .where(and(eq(listings.id, input.id), eq(listings.userId, ctx.user.id)))
        .limit(1);

      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Anuncio nao encontrado." });
      }

      const images = await db
        .select()
        .from(listingImages)
        .where(eq(listingImages.listingId, listing.id))
        .orderBy(listingImages.sortOrder);

      return { ...listing, images };
    }),
    createListing: protectedProcedure.input(z.object({
      title: z.string().min(5).max(200),
      description: z.string().optional(),
      price: z.number().optional(),
      priceType: z.enum(["fixed", "negotiable", "free", "on_request"]).default("fixed"),
      type: z.enum(["product", "service", "vehicle", "property", "food", "job"]).default("product"),
      categoryId: z.number(),
      cityId: z.number().optional(),
      neighborhood: z.string().optional(),
      whatsapp: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      const result = await db.insert(listings).values({
        ...input,
        userId: ctx.user.id,
        price: input.price ? String(input.price) : undefined,
        status: "active",
        expiresAt,
      });
      return { id: await resolveInsertId(db, result) };
    }),
    updateListing: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().min(5).max(200).optional(),
      description: z.string().optional(),
      price: z.number().optional(),
      priceType: z.enum(["fixed", "negotiable", "free", "on_request"]).optional(),
      type: z.enum(["product", "service", "vehicle", "property", "food", "job"]).optional(),
      categoryId: z.number().optional(),
      cityId: z.number().optional(),
      neighborhood: z.string().optional(),
      status: z.enum(["active", "paused", "sold"]).optional(),
      whatsapp: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, price, ...rest } = input;
      await db.update(listings).set({ ...rest, price: price ? String(price) : undefined, updatedAt: new Date() }).where(and(eq(listings.id, id), eq(listings.userId, ctx.user.id)));
      return { success: true };
    }),
    deleteListing: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(listings).where(and(eq(listings.id, input.id), eq(listings.userId, ctx.user.id)));
      return { success: true };
    }),
    addImage: protectedProcedure.input(z.object({
      listingId: z.number(),
      url: z.string(),
      fileKey: z.string().optional(),
      isPrimary: z.boolean().default(false),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [listing] = await db.select().from(listings).where(and(eq(listings.id, input.listingId), eq(listings.userId, ctx.user.id))).limit(1);
      if (!listing) throw new TRPCError({ code: "FORBIDDEN" });
      await db.insert(listingImages).values(input);
      return { success: true };
    }),
    activateBooster: protectedProcedure.input(z.object({
      listingId: z.number(),
      type: z.enum(["featured", "top", "banner"]).default("featured"),
      durationDays: z.number().default(7),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [listing] = await db.select().from(listings).where(and(eq(listings.id, input.listingId), eq(listings.userId, ctx.user.id))).limit(1);
      if (!listing) throw new TRPCError({ code: "FORBIDDEN" });
      const pricesByDuration: Record<number, number> = {
        1: 9.9,
        7: 12.9,
        15: 24.9,
        30: 49.9,
      };
      const pricesByType: Record<string, number> = {
        featured: 12.9,
        top: 24.9,
        banner: 49.9,
      };
      const price =
        pricesByDuration[input.durationDays] ??
        pricesByType[input.type] ??
        12.9;
      const startsAt = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.durationDays);
      await db.insert(boosters).values({ ...input, userId: ctx.user.id, price: String(price), status: "active", startsAt, expiresAt });
      await db.update(listings).set({ isBoosted: true, boostExpiresAt: expiresAt }).where(eq(listings.id, input.listingId));
      return { success: true };
    }),
    stats: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        return {
          totalListings: 0,
          totalViews: 0,
          totalContacts: 0,
          totalFavorites: 0,
          activeBoosters: 0,
          boostedListings: 0,
          statusBreakdown: {
            active: 0,
            paused: 0,
            sold: 0,
            pending: 0,
          },
          topListing: null,
          listings: [],
        };
      }
      const myListings = await db.select().from(listings).where(eq(listings.userId, ctx.user.id));
      const totalViews = myListings.reduce((sum, l) => sum + (l.viewCount || 0), 0);
      const totalContacts = myListings.reduce((sum, l) => sum + (l.contactCount || 0), 0);
      const totalFavorites = myListings.reduce((sum, l) => sum + (l.favoriteCount || 0), 0);
      const activeBoosters = await db.select().from(boosters).where(and(eq(boosters.userId, ctx.user.id), eq(boosters.status, "active")));
      const topListing = [...myListings].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))[0] ?? null;
      const statusBreakdown = {
        active: myListings.filter(item => item.status === "active").length,
        paused: myListings.filter(item => item.status === "paused").length,
        sold: myListings.filter(item => item.status === "sold").length,
        pending: myListings.filter(item => item.status === "pending").length,
      };

      return {
        totalListings: myListings.length,
        totalViews,
        totalContacts,
        totalFavorites,
        activeBoosters: activeBoosters.length,
        boostedListings: myListings.filter(item => item.isBoosted).length,
        statusBreakdown,
        topListing,
        listings: myListings,
      };
    }),
    toggleFavorite: protectedProcedure.input(z.object({ listingId: z.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [existing] = await db.select().from(favorites).where(and(eq(favorites.userId, ctx.user.id), eq(favorites.listingId, input.listingId))).limit(1);
      if (existing) {
        await db.delete(favorites).where(eq(favorites.id, existing.id));
        return { favorited: false };
      } else {
        await db.insert(favorites).values({ userId: ctx.user.id, listingId: input.listingId });
        return { favorited: true };
      }
    }),
    myFavorites: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const favs = await db.select().from(favorites).where(eq(favorites.userId, ctx.user.id));
      if (!favs.length) return [];
      const ids = favs.map(f => f.listingId);
      return db.select().from(listings).where(and(eq(listings.status, "active"), sql`${listings.id} IN (${ids.join(",")})`));
    }),
    uploadImage: protectedProcedure.input(z.object({
      listingId: z.number(),
      base64: z.string(),
      mimeType: z.string().default("image/jpeg"),
    })).mutation(async ({ ctx, input }) => {
      const { storagePut } = await import("./storage");
      const buffer = Buffer.from(input.base64.replace(/^data:[^;]+;base64,/, ""), "base64");
      const key = `listings/${ctx.user.id}/${input.listingId}-${Date.now()}.jpg`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url };
    }),
  }),

  // ─── Admin ──────────────────────────────────────────────────────────────────
  admin: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) {
        return {
          totalUsers: 0,
          totalListings: 0,
          activeListings: 0,
          pendingListings: 0,
          activeBoosters: 0,
          bannedUsers: 0,
          rejectedListings: 0,
        };
      }
      const allUsers = await db.select().from(users);
      const allListings = await db.select().from(listings);
      const allBoosters = await db.select().from(boosters);
      return {
        totalUsers: allUsers.length,
        totalListings: allListings.length,
        activeListings: allListings.filter(l => l.status === "active").length,
        pendingListings: allListings.filter(l => l.status === "pending").length,
        activeBoosters: allBoosters.filter(b => b.status === "active").length,
        bannedUsers: allUsers.filter(user => user.isBanned).length,
        rejectedListings: allListings.filter(listing => listing.status === "rejected").length,
      };
    }),
    allUsers: protectedProcedure.input(z.object({ page: z.number().default(1), limit: z.number().default(20) })).query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) return [];
      return db
        .select({
          id: users.id,
          openId: users.openId,
          name: users.name,
          email: users.email,
          loginMethod: users.loginMethod,
          role: users.role,
          phone: users.phone,
          whatsapp: users.whatsapp,
          avatar: users.avatar,
          bio: users.bio,
          personType: users.personType,
          cpfCnpj: users.cpfCnpj,
          companyName: users.companyName,
          cityId: users.cityId,
          neighborhood: users.neighborhood,
          planId: users.planId,
          planExpiresAt: users.planExpiresAt,
          trialStartedAt: users.trialStartedAt,
          trialUsed: users.trialUsed,
          isVerified: users.isVerified,
          isBanned: users.isBanned,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          lastSignedIn: users.lastSignedIn,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(input.limit)
        .offset((input.page - 1) * input.limit);
    }),
    allListings: protectedProcedure.input(z.object({ page: z.number().default(1), status: z.string().optional() })).query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) return [];
      const conditions: any[] = [];
      if (input.status) conditions.push(eq(listings.status, input.status as any));
      const items = await db.select().from(listings).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(listings.createdAt)).limit(20).offset((input.page - 1) * 20);

      const userIds = Array.from(new Set(items.map(item => item.userId)));
      const cityIds = Array.from(new Set(items.map(item => item.cityId).filter((value): value is number => typeof value === "number")));
      const categoryIds = Array.from(new Set(items.map(item => item.categoryId)));

      const sellerRows = userIds.length
        ? await db.select({ id: users.id, name: users.name }).from(users).where(sql`${users.id} IN (${userIds.join(",")})`)
        : [];
      const cityRows = cityIds.length
        ? await db.select({ id: cities.id, name: cities.name }).from(cities).where(sql`${cities.id} IN (${cityIds.join(",")})`)
        : [];
      const categoryRows = categoryIds.length
        ? await db.select({ id: categories.id, name: categories.name }).from(categories).where(sql`${categories.id} IN (${categoryIds.join(",")})`)
        : [];

      const sellersById = new Map(sellerRows.map(item => [item.id, item.name]));
      const citiesById = new Map(cityRows.map(item => [item.id, item.name]));
      const categoriesById = new Map(categoryRows.map(item => [item.id, item.name]));

      return items.map(item => ({
        ...item,
        sellerName: sellersById.get(item.userId) ?? null,
        cityName: item.cityId ? (citiesById.get(item.cityId) ?? null) : null,
        categoryName: categoriesById.get(item.categoryId) ?? null,
      }));
    }),
    moderateListing: protectedProcedure.input(z.object({ id: z.number(), status: z.enum(["active", "rejected", "paused"]) })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(listings).set({ status: input.status }).where(eq(listings.id, input.id));
      return { success: true };
    }),
    banUser: protectedProcedure.input(z.object({ id: z.number(), banned: z.boolean() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(users).set({ isBanned: input.banned }).where(eq(users.id, input.id));
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
