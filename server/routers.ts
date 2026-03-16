import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { notifyOwner } from "./_core/notification";
import {
  generatePasswordResetToken,
  hashResetToken,
  normalizeAuthEmail,
  hashPassword,
  toLocalOpenId,
  verifyPassword,
} from "./_core/localAuth";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb, getUserByOpenId } from "./db";
import {
  listings,
  categories,
  cities,
  plans,
  listingImages,
  boosters,
  favorites,
  users,
  passwordResetTokens,
} from "../drizzle/schema";
import { eq, desc, and, like, gte, lte, or, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  attachMockSellerPreviewToListings,
  getMockListingById,
  mockCategories,
  mockCities,
  mockListings,
  mockPlans,
  getMockSellerProfile,
} from "./mockData";
import { isOpenNow } from "./_core/openingHours";

async function attachImagesToListings<T extends { id: number }>(
  db: Awaited<ReturnType<typeof getDb>>,
  items: T[]
): Promise<Array<T & { images: Array<typeof listingImages.$inferSelect> }>> {
  if (!db || items.length === 0) {
    return items.map(item => ({ ...item, images: [] }));
  }

  const ids = items.map(item => item.id);
  const images = await db
    .select()
    .from(listingImages)
    .where(inArray(listingImages.listingId, ids))
    .orderBy(
      listingImages.listingId,
      listingImages.sortOrder,
      desc(listingImages.isPrimary)
    );

  const imagesByListingId = new Map<
    number,
    Array<typeof listingImages.$inferSelect>
  >();
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

async function attachSellerPreviewToListings<T extends { userId: number }>(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  items: T[]
) {
  if (items.length === 0) return items.map(item => ({ ...item, seller: null }));

  const userIds = Array.from(new Set(items.map(item => item.userId)));
  const sellerRows = await db
    .select({
      id: users.id,
      name: users.name,
      personType: users.personType,
      companyName: users.companyName,
      avatar: users.avatar,
      bannerUrl: users.bannerUrl,
      whatsapp: users.whatsapp,
      cityId: users.cityId,
      neighborhood: users.neighborhood,
      openingHoursJson: users.openingHoursJson,
      isVerified: users.isVerified,
    })
    .from(users)
    .where(inArray(users.id, userIds));

  const sellersById = new Map(sellerRows.map(item => [item.id, item]));

  return items.map(item => ({
    ...item,
    seller: sellersById.get(item.userId)
      ? {
          ...sellersById.get(item.userId)!,
          isOpenNow: isOpenNow(sellersById.get(item.userId)!.openingHoursJson),
        }
      : null,
  }));
}

const defaultCategoryCatalog = [
  {
    name: "Delivery",
    slug: "delivery",
    icon: "ShoppingBag",
    color: "#f97316",
    sortOrder: 1,
  },
  {
    name: "Servicos Gerais",
    slug: "servicos-gerais",
    icon: "Wrench",
    color: "#8b5cf6",
    sortOrder: 2,
  },
  {
    name: "Veiculos",
    slug: "veiculos",
    icon: "Car",
    color: "#2563eb",
    sortOrder: 3,
  },
  {
    name: "Imoveis",
    slug: "imoveis",
    icon: "HomeIcon",
    color: "#0f766e",
    sortOrder: 4,
  },
  {
    name: "Eletronicos",
    slug: "eletronicos",
    icon: "Smartphone",
    color: "#06b6d4",
    sortOrder: 5,
  },
  {
    name: "Saude",
    slug: "saude",
    icon: "Cross",
    color: "#10b981",
    sortOrder: 6,
  },
  {
    name: "Educacao",
    slug: "educacao",
    icon: "Building2",
    color: "#f97316",
    sortOrder: 7,
  },
  {
    name: "Seguranca",
    slug: "seguranca",
    icon: "Shield",
    color: "#2563eb",
    sortOrder: 8,
  },
  {
    name: "Utilidade Publica",
    slug: "utilidade-publica",
    icon: "MapPin",
    color: "#0f766e",
    sortOrder: 9,
  },
];

async function ensureDefaultCategories(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>
) {
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

const IBAITI_DIRECTORY_OPEN_ID = "directory:ibaiti-public";
const IBAITI_DIRECTORY_NAME = "Guia Publico de Ibaiti";
const IBAITI_DIRECTORY_COMPANY = "Servicos Essenciais de Ibaiti";
const DIRECTORY_LISTING_EXPIRY = new Date("2035-12-31T23:59:59.000Z");

const ibaitiInstitutionCatalog = [
  {
    title: "Hospital Municipal de Ibaiti",
    categorySlug: "saude",
    subcategory: "Hospital",
    neighborhood: "Centro",
    phone: "4335467480",
    description:
      "Fundacao Hospitalar de Saude de Ibaiti. Atendimento hospitalar municipal. Telefones uteis divulgados pela Prefeitura: (43) 3546-7480 e (43) 3546-6145.",
  },
  {
    title: "SAMU de Ibaiti",
    categorySlug: "saude",
    subcategory: "Emergencia",
    neighborhood: "Centro",
    phone: "192",
    description:
      "Servico de Atendimento Movel de Urgencia para emergencias. Acionamento pelo telefone 192.",
  },
  {
    title: "UBS Centro de Ibaiti",
    categorySlug: "saude",
    subcategory: "Posto de saude",
    neighborhood: "Centro",
    phone: "4335467481",
    description:
      "Unidade Basica de Saude da regiao central de Ibaiti. Telefone util divulgado pela Prefeitura: (43) 3546-7481.",
  },
  {
    title: "UBS Cohapar de Ibaiti",
    categorySlug: "saude",
    subcategory: "Posto de saude",
    neighborhood: "Cohapar",
    phone: "4335467482",
    description:
      "Unidade Basica de Saude da Cohapar. Telefone util divulgado pela Prefeitura: (43) 3546-7482.",
  },
  {
    title: "UBS Gralha Azul de Ibaiti",
    categorySlug: "saude",
    subcategory: "Posto de saude",
    neighborhood: "Gralha Azul",
    phone: "4335467483",
    description:
      "Unidade Basica de Saude do bairro Gralha Azul. Telefone util divulgado pela Prefeitura: (43) 3546-7483.",
  },
  {
    title: "UBS Jardim Paineiras de Ibaiti",
    categorySlug: "saude",
    subcategory: "Posto de saude",
    neighborhood: "Jardim Paineiras",
    phone: "4335467485",
    description:
      "Unidade Basica de Saude do Jardim Paineiras. Telefone util divulgado pela Prefeitura: (43) 3546-7485.",
  },
  {
    title: "UBS Vila Guay de Ibaiti",
    categorySlug: "saude",
    subcategory: "Posto de saude",
    neighborhood: "Vila Guay",
    phone: "4335467488",
    description:
      "Unidade Basica de Saude da Vila Guay. Telefone util divulgado pela Prefeitura: (43) 3546-7488.",
  },
  {
    title: "UBS Sao Judas Tadeu de Ibaiti",
    categorySlug: "saude",
    subcategory: "Posto de saude",
    neighborhood: "Sao Judas Tadeu",
    phone: "4335467490",
    description:
      "Unidade Basica de Saude do bairro Sao Judas Tadeu. Telefone util divulgado pela Prefeitura: (43) 3546-7490.",
  },
  {
    title: "Escola Municipal Monteiro Lobato",
    categorySlug: "educacao",
    subcategory: "Escola municipal",
    neighborhood: "Ibaiti",
    phone: "4335467478",
    description:
      "Escola municipal de Ibaiti. Telefone util divulgado pela Prefeitura: (43) 3546-7478.",
  },
  {
    title: "Escola Municipal Jose Goncalves Dias",
    categorySlug: "educacao",
    subcategory: "Escola municipal",
    neighborhood: "Ibaiti",
    phone: "4335467472",
    description:
      "Escola municipal de Ibaiti. Telefone util divulgado pela Prefeitura: (43) 3546-7472.",
  },
  {
    title: "Escola Municipal Clovete Fadel de Melo Bueno",
    categorySlug: "educacao",
    subcategory: "Escola municipal",
    neighborhood: "Ibaiti",
    phone: "4335467468",
    description:
      "Escola municipal de Ibaiti. Telefone util divulgado pela Prefeitura: (43) 3546-7468.",
  },
  {
    title: "Escola Municipal Daigles Aparecida de Carvalho",
    categorySlug: "educacao",
    subcategory: "Escola municipal",
    neighborhood: "Vila Guay",
    phone: "4335467469",
    description:
      "Escola municipal de Ibaiti. Telefone util divulgado pela Prefeitura: (43) 3546-7469.",
  },
  {
    title: "Escola Municipal Dom Pedro I",
    categorySlug: "educacao",
    subcategory: "Escola municipal",
    neighborhood: "Amorinha",
    phone: "4335467470",
    description:
      "Escola municipal de Ibaiti. Telefone util divulgado pela Prefeitura: (43) 3546-7470.",
  },
  {
    title: "Escola Municipal Joao Severino",
    categorySlug: "educacao",
    subcategory: "Escola municipal",
    neighborhood: "Campinho",
    phone: "4335467494",
    description:
      "Escola municipal de Ibaiti. Telefone util divulgado pela Prefeitura: (43) 3546-7494.",
  },
  {
    title: "Polo UAB Ibaiti",
    categorySlug: "educacao",
    subcategory: "Universidade",
    neighborhood: "Centro",
    phone: "4335467460",
    description:
      "Polo de apoio presencial da Universidade Aberta do Brasil em Ibaiti. Vinculado a Secretaria Municipal de Educacao. Telefone: (43) 3546-7460.",
  },
  {
    title: "FEATI - Faculdade de Ibaiti",
    categorySlug: "educacao",
    subcategory: "Universidade",
    neighborhood: "Flamenguinho",
    phone: "4335461263",
    description:
      "Faculdade de Educacao, Administracao e Tecnologia de Ibaiti. Endereco: Av. Tertuliano de Moura Bueno, 1400 - Flamenguinho. Telefones: (43) 3546-1263 e (43) 3141-1101.",
  },
  {
    title: "Policia Civil de Ibaiti",
    categorySlug: "seguranca",
    subcategory: "Policia civil",
    neighborhood: "Centro",
    phone: "4335468450",
    description:
      "Delegacia de Policia Civil de Ibaiti para registro e atendimento policial. Endereco publico em documento estadual: Rua Antonio Moura Bueno, 869 - Centro. Telefone: (43) 3546-8450.",
  },
  {
    title: "Policia Militar de Ibaiti",
    categorySlug: "seguranca",
    subcategory: "Policia militar",
    neighborhood: "Centro",
    phone: "4335462318",
    description:
      "1o Pelotao da 3a Companhia do 2o BPM em Ibaiti. Telefone divulgado pela PMPR: (43) 3546-4441 e (43) 3546-2318.",
  },
  {
    title: "Rodoviaria de Ibaiti",
    categorySlug: "utilidade-publica",
    subcategory: "Rodoviaria",
    neighborhood: "Centro",
    phone: "4335467499",
    description:
      "Terminal rodoviario e informacoes de transporte urbano. Telefone util divulgado pela Prefeitura: (43) 3546-7499.",
  },
] as const;

async function ensureIbaitiInstitutionDirectory(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>
) {
  await ensureDefaultCategories(db);

  await db.execute(sql`
    INSERT INTO cities (name, state, slug, isActive)
    VALUES ('Ibaiti', 'PR', 'ibaiti', true)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      state = VALUES(state),
      isActive = true
  `);

  const [ibaitiCity] = await db
    .select({ id: cities.id })
    .from(cities)
    .where(eq(cities.slug, "ibaiti"))
    .limit(1);

  if (!ibaitiCity) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Nao foi possivel localizar a cidade de Ibaiti.",
    });
  }

  await db.execute(sql`
    INSERT INTO users (
      openId,
      name,
      role,
      personType,
      companyName,
      bio,
      cityId,
      neighborhood,
      isVerified,
      loginMethod,
      createdAt,
      updatedAt,
      lastSignedIn
    )
    VALUES (
      ${IBAITI_DIRECTORY_OPEN_ID},
      ${IBAITI_DIRECTORY_NAME},
      'advertiser',
      'pj',
      ${IBAITI_DIRECTORY_COMPANY},
      'Perfil criado pelo portal para reunir hospitais, escolas, seguranca e servicos essenciais de Ibaiti.',
      ${ibaitiCity.id},
      'Centro',
      true,
      'system',
      now(),
      now(),
      now()
    )
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      role = 'advertiser',
      personType = 'pj',
      companyName = VALUES(companyName),
      bio = VALUES(bio),
      cityId = VALUES(cityId),
      neighborhood = VALUES(neighborhood),
      isVerified = true,
      loginMethod = 'system',
      updatedAt = now(),
      lastSignedIn = now()
  `);

  const directoryUser = await getUserByOpenId(IBAITI_DIRECTORY_OPEN_ID);
  if (!directoryUser) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Nao foi possivel preparar o perfil publico de Ibaiti.",
    });
  }

  const categoryRows = await db
    .select({ id: categories.id, slug: categories.slug })
    .from(categories)
    .where(
      inArray(
        categories.slug,
        ibaitiInstitutionCatalog.map(item => item.categorySlug)
      )
    );

  const categoryIdBySlug = new Map(
    categoryRows.map(item => [item.slug, item.id] as const)
  );

  for (const entry of ibaitiInstitutionCatalog) {
    const categoryId = categoryIdBySlug.get(entry.categorySlug);
    if (!categoryId) continue;

    const [existingListing] = await db
      .select({ id: listings.id })
      .from(listings)
      .where(
        and(
          eq(listings.userId, directoryUser.id),
          eq(listings.title, entry.title)
        )
      )
      .limit(1);

    if (existingListing) {
      await db
        .update(listings)
        .set({
          categoryId,
          subcategory: entry.subcategory,
          cityId: ibaitiCity.id,
          title: entry.title,
          description: entry.description,
          price: null,
          priceType: "on_request",
          type: "service",
          neighborhood: entry.neighborhood,
          whatsapp: null,
          status: "active",
          isBoosted: false,
          isFeatured: false,
          expiresAt: DIRECTORY_LISTING_EXPIRY,
        })
        .where(eq(listings.id, existingListing.id));
      continue;
    }

    await db.insert(listings).values({
      userId: directoryUser.id,
      categoryId,
      subcategory: entry.subcategory,
      cityId: ibaitiCity.id,
      title: entry.title,
      description: entry.description,
      price: null,
      priceType: "on_request",
      type: "service",
      neighborhood: entry.neighborhood,
      whatsapp: null,
      status: "active",
      isBoosted: false,
      isFeatured: false,
      expiresAt: DIRECTORY_LISTING_EXPIRY,
    });
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
  const fallbackId = Number(
    (fallbackRows as any)?.[0]?.id ?? (fallbackRows as any)?.rows?.[0]?.id
  );

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
    me: publicProcedure.query(async opts => {
      if (!opts.ctx.user) return null;
      const db = await getDb();

      if (!db) {
        const { passwordHash: _passwordHash, ...safeUser } = opts.ctx.user;
        return safeUser;
      }

      const [freshUser] = await db
        .select()
        .from(users)
        .where(eq(users.openId, opts.ctx.user.openId))
        .limit(1);

      const sourceUser = freshUser ?? opts.ctx.user;
      const { passwordHash: _passwordHash, ...safeUser } = sourceUser;
      return safeUser;
    }),
    register: publicProcedure
      .input(
        z.object({
          name: z.string().min(2).max(120),
          email: z.string().email(),
          password: z.string().min(6).max(100),
          personType: z.enum(["pf", "pj"]).default("pf"),
          whatsapp: z.string().optional(),
          cpfCnpj: z.string().optional(),
          companyName: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const email = normalizeAuthEmail(input.email);
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Este email ja esta cadastrado.",
          });
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
          companyName:
            input.personType === "pj"
              ? input.companyName?.trim() || null
              : null,
          trialStartedAt,
          trialUsed: false,
          lastSignedIn: now,
        });

        const sessionToken = await sdk.createSessionToken(openId, {
          name: input.name.trim(),
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        return {
          success: true as const,
          userId: await resolveInsertId(db, result),
        };
      }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6).max(100),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const email = normalizeAuthEmail(input.email);
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user || !verifyPassword(input.password, user.passwordHash)) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou senha invalidos.",
          });
        }

        if (user.isBanned) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Sua conta foi bloqueada.",
          });
        }

        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "Usuario",
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        await db
          .update(users)
          .set({ lastSignedIn: new Date() })
          .where(eq(users.id, user.id));

        return { success: true as const };
      }),
    requestPasswordReset: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const email = normalizeAuthEmail(input.email);
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (user && user.passwordHash) {
          const rawToken = generatePasswordResetToken();
          const tokenHash = hashResetToken(rawToken);
          const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

          await db
            .delete(passwordResetTokens)
            .where(eq(passwordResetTokens.userId, user.id));
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
            console.warn(
              "[Auth] Failed to notify owner about password reset:",
              error
            );
          }

          console.info(
            `[Auth] Password reset requested for ${email}. Link: ${resetLink}`
          );
        }

        return {
          success: true as const,
          message:
            "Se existir uma conta com este email, as instrucoes de recuperacao foram geradas.",
        };
      }),
    resetPassword: publicProcedure
      .input(
        z.object({
          token: z.string().min(20),
          password: z.string().min(6).max(100),
        })
      )
      .mutation(async ({ input }) => {
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
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Token de recuperacao invalido ou expirado.",
          });
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
    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          phone: z.string().optional(),
          whatsapp: z.string().optional(),
          bio: z.string().optional(),
          bannerUrl: z.string().optional(),
          openingHoursJson: z.string().optional(),
          personType: z.enum(["pf", "pj"]).optional(),
          cpfCnpj: z.string().optional(),
          companyName: z.string().optional(),
          cityId: z.number().optional(),
          neighborhood: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db
          .update(users)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(users.id, ctx.user.id));
        return { success: true };
      }),
    uploadAvatar: protectedProcedure
      .input(
        z.object({
          base64: z.string(),
          mimeType: z.string().default("image/jpeg"),
        })
      )
      .mutation(async ({ ctx, input }) => {
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

        const [updatedUser] = await db
          .select({ avatar: users.avatar })
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);

        return {
          success: true as const,
          url: updatedUser?.avatar ?? url,
        };
      }),
    uploadBanner: protectedProcedure
      .input(
        z.object({
          base64: z.string(),
          mimeType: z.string().default("image/jpeg"),
        })
      )
      .mutation(async ({ ctx, input }) => {
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
        const key = `banners/${ctx.user.id}/storefront-${Date.now()}.${extension}`;
        const { url } = await storagePut(key, buffer, input.mimeType);

        await db
          .update(users)
          .set({
            bannerUrl: url,
            updatedAt: new Date(),
          })
          .where(eq(users.id, ctx.user.id));

        const [updatedUser] = await db
          .select({ bannerUrl: users.bannerUrl })
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);

        return {
          success: true as const,
          url: updatedUser?.bannerUrl ?? url,
        };
      }),
  }),

  // ─── Public Data ────────────────────────────────────────────────────────────
  public: router({
    cities: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return mockCities;
      return db
        .select()
        .from(cities)
        .where(eq(cities.isActive, true))
        .orderBy(cities.name);
    }),
    categories: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return mockCategories;
      await ensureIbaitiInstitutionDirectory(db);
      return db
        .select()
        .from(categories)
        .where(eq(categories.isActive, true))
        .orderBy(categories.sortOrder);
    }),
    topCategories: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(20).default(10) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          return [...mockCategories]
            .sort(
              (a, b) =>
                (b.viewCount ?? 0) - (a.viewCount ?? 0) ||
                a.sortOrder - b.sortOrder
            )
            .slice(0, input.limit);
        }

        await ensureIbaitiInstitutionDirectory(db);

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
          const category = mockCategories.find(
            item => item.slug === input.slug
          );
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
      return db
        .select()
        .from(plans)
        .where(eq(plans.isActive, true))
        .orderBy(plans.price);
    }),
    featuredListings: publicProcedure
      .input(
        z.object({
          limit: z.number().default(12),
          cityId: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          return attachMockSellerPreviewToListings(
            mockListings
              .filter(item => item.status === "active" && item.isBoosted)
              .filter(item => !input.cityId || item.cityId === input.cityId)
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
              .slice(0, input.limit)
          );
        }
        await ensureIbaitiInstitutionDirectory(db);

        const conditions = [
          eq(listings.status, "active"),
          eq(listings.isBoosted, true),
        ];
        if (input.cityId) conditions.push(eq(listings.cityId, input.cityId));
        const items = await db
          .select()
          .from(listings)
          .where(and(...conditions))
          .orderBy(desc(listings.createdAt))
          .limit(input.limit);
        const itemsWithImages = await attachImagesToListings(db, items);
        return attachSellerPreviewToListings(db, itemsWithImages);
      }),
    recentListings: publicProcedure
      .input(
        z.object({
          limit: z.number().default(20),
          cityId: z.number().optional(),
          categoryId: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          return attachMockSellerPreviewToListings(
            mockListings
              .filter(item => item.status === "active")
              .filter(item => !input.cityId || item.cityId === input.cityId)
              .filter(
                item =>
                  !input.categoryId || item.categoryId === input.categoryId
              )
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
              .slice(0, input.limit)
          );
        }
        await ensureIbaitiInstitutionDirectory(db);

        const conditions: ReturnType<typeof eq>[] = [
          eq(listings.status, "active"),
        ];
        if (input.cityId) conditions.push(eq(listings.cityId, input.cityId));
        if (input.categoryId)
          conditions.push(eq(listings.categoryId, input.categoryId));
        const items = await db
          .select()
          .from(listings)
          .where(and(...conditions))
          .orderBy(desc(listings.createdAt))
          .limit(input.limit);
        const itemsWithImages = await attachImagesToListings(db, items);
        return attachSellerPreviewToListings(db, itemsWithImages);
      }),
    searchListings: publicProcedure
      .input(
        z.object({
          q: z.string().optional(),
          categoryId: z.number().optional(),
          subcategory: z.string().max(80).optional(),
          cityId: z.number().optional(),
          type: z
            .enum(["product", "service", "vehicle", "property", "food", "job"])
            .optional(),
          minPrice: z.number().optional(),
          maxPrice: z.number().optional(),
          page: z.number().default(1),
          limit: z.number().default(20),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          const filtered = mockListings
            .filter(item => item.status === "active")
            .filter(
              item =>
                !input.q ||
                item.title.toLowerCase().includes(input.q.toLowerCase())
            )
            .filter(
              item => !input.categoryId || item.categoryId === input.categoryId
            )
            .filter(
              item =>
                !input.subcategory ||
                ("subcategory" in item
                  ? item.subcategory === input.subcategory
                  : true)
            )
            .filter(item => !input.cityId || item.cityId === input.cityId)
            .filter(item => !input.type || item.type === input.type)
            .filter(
              item =>
                !input.minPrice || Number(item.price ?? 0) >= input.minPrice
            )
            .filter(
              item =>
                !input.maxPrice || Number(item.price ?? 0) <= input.maxPrice
            );
          const offset = (input.page - 1) * input.limit;
          return {
            items: filtered.slice(offset, offset + input.limit),
            total: filtered.length,
          };
        }
        await ensureIbaitiInstitutionDirectory(db);

        const conditions: any[] = [eq(listings.status, "active")];
        if (input.q) conditions.push(like(listings.title, `%${input.q}%`));
        if (input.categoryId)
          conditions.push(eq(listings.categoryId, input.categoryId));
        if (input.subcategory)
          conditions.push(eq(listings.subcategory, input.subcategory));
        if (input.cityId) conditions.push(eq(listings.cityId, input.cityId));
        if (input.type) conditions.push(eq(listings.type, input.type));
        if (input.minPrice)
          conditions.push(gte(listings.price, String(input.minPrice)));
        if (input.maxPrice)
          conditions.push(lte(listings.price, String(input.maxPrice)));
        const offset = (input.page - 1) * input.limit;
        const items = await db
          .select()
          .from(listings)
          .where(and(...conditions))
          .orderBy(desc(listings.isBoosted), desc(listings.createdAt))
          .limit(input.limit)
          .offset(offset);
        const itemsWithImages = await attachImagesToListings(db, items);
        return { items: itemsWithImages, total: items.length };
      }),
    listingById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return getMockListingById(input.id);
        await ensureIbaitiInstitutionDirectory(db);
        const [listing] = await db
          .select()
          .from(listings)
          .where(eq(listings.id, input.id))
          .limit(1);
        if (!listing) return null;
        const images = await db
          .select()
          .from(listingImages)
          .where(eq(listingImages.listingId, input.id))
          .orderBy(listingImages.sortOrder);
        const [seller] = await db
          .select({
            id: users.id,
            name: users.name,
            personType: users.personType,
            companyName: users.companyName,
            avatar: users.avatar,
            bannerUrl: users.bannerUrl,
            whatsapp: users.whatsapp,
            openingHoursJson: users.openingHoursJson,
            isVerified: users.isVerified,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(eq(users.id, listing.userId))
          .limit(1);
        await db
          .update(listings)
          .set({ viewCount: sql`${listings.viewCount} + 1` })
          .where(eq(listings.id, input.id));
        return {
          ...listing,
          images,
          seller: seller
            ? { ...seller, isOpenNow: isOpenNow(seller.openingHoursJson) }
            : null,
        };
      }),
    sellerProfile: publicProcedure
      .input(z.object({ sellerId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          return getMockSellerProfile(input.sellerId);
        }

        await ensureIbaitiInstitutionDirectory(db);

        const [seller] = await db
          .select({
            id: users.id,
            name: users.name,
            personType: users.personType,
            companyName: users.companyName,
            phone: users.phone,
            avatar: users.avatar,
            bannerUrl: users.bannerUrl,
            whatsapp: users.whatsapp,
            bio: users.bio,
            openingHoursJson: users.openingHoursJson,
            isVerified: users.isVerified,
            createdAt: users.createdAt,
            cityId: users.cityId,
            neighborhood: users.neighborhood,
          })
          .from(users)
          .where(eq(users.id, input.sellerId))
          .limit(1);

        if (!seller) return null;

        const sellerItems = await db
          .select()
          .from(listings)
          .where(
            and(
              eq(listings.status, "active"),
              eq(listings.userId, input.sellerId)
            )
          )
          .orderBy(desc(listings.isBoosted), desc(listings.createdAt))
          .limit(24);

        const sellerListings = await attachImagesToListings(db, sellerItems);

        return {
          seller: {
            ...seller,
            isOpenNow: isOpenNow(seller.openingHoursJson),
          },
          listings: sellerListings,
        };
      }),
    sellerListings: publicProcedure
      .input(
        z.object({
          sellerId: z.number(),
          excludeId: z.number().optional(),
          limit: z.number().default(6),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          return mockListings
            .filter(
              item => item.status === "active" && item.userId === input.sellerId
            )
            .filter(item => !input.excludeId || item.id !== input.excludeId)
            .slice(0, input.limit);
        }

        await ensureIbaitiInstitutionDirectory(db);

        const conditions = [
          eq(listings.status, "active"),
          eq(listings.userId, input.sellerId),
        ];
        if (input.excludeId)
          conditions.push(sql`${listings.id} <> ${input.excludeId}` as any);

        const items = await db
          .select()
          .from(listings)
          .where(and(...conditions))
          .orderBy(desc(listings.isBoosted), desc(listings.createdAt))
          .limit(input.limit);

        return attachImagesToListings(db, items);
      }),
    relatedListings: publicProcedure
      .input(
        z.object({
          listingId: z.number(),
          categoryId: z.number(),
          subcategory: z.string().optional(),
          cityId: z.number().optional(),
          limit: z.number().default(8),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          const related = mockListings
            .filter(
              item => item.status === "active" && item.id !== input.listingId
            )
            .filter(item => item.categoryId === input.categoryId)
            .filter(
              item =>
                !input.subcategory ||
                ("subcategory" in item
                  ? item.subcategory === input.subcategory
                  : false)
            )
            .filter(item => !input.cityId || item.cityId === input.cityId);

          if (related.length > 0) {
            return related.slice(0, input.limit);
          }

          return mockListings
            .filter(
              item =>
                item.status === "active" &&
                item.id !== input.listingId &&
                item.categoryId === input.categoryId
            )
            .slice(0, input.limit);
        }

        await ensureIbaitiInstitutionDirectory(db);

        const strictConditions = [
          eq(listings.status, "active"),
          eq(listings.categoryId, input.categoryId),
          sql`${listings.id} <> ${input.listingId}` as any,
        ];

        if (input.subcategory)
          strictConditions.push(eq(listings.subcategory, input.subcategory));
        if (input.cityId)
          strictConditions.push(eq(listings.cityId, input.cityId));

        let items = await db
          .select()
          .from(listings)
          .where(and(...strictConditions))
          .orderBy(desc(listings.isBoosted), desc(listings.createdAt))
          .limit(input.limit);

        if (items.length === 0) {
          items = await db
            .select()
            .from(listings)
            .where(
              and(
                eq(listings.status, "active"),
                eq(listings.categoryId, input.categoryId),
                sql`${listings.id} <> ${input.listingId}` as any
              )
            )
            .orderBy(desc(listings.isBoosted), desc(listings.createdAt))
            .limit(input.limit);
        }

        return attachImagesToListings(db, items);
      }),
    listingsByCategory: publicProcedure
      .input(
        z.object({ categorySlug: z.string(), limit: z.number().default(12) })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          const category = mockCategories.find(
            item => item.slug === input.categorySlug
          );
          if (!category) return [];
          return mockListings
            .filter(
              item =>
                item.status === "active" && item.categoryId === category.id
            )
            .sort(
              (a, b) =>
                Number(b.isBoosted) - Number(a.isBoosted) ||
                b.createdAt.getTime() - a.createdAt.getTime()
            )
            .slice(0, input.limit);
        }
        await ensureIbaitiInstitutionDirectory(db);

        const [cat] = await db
          .select()
          .from(categories)
          .where(eq(categories.slug, input.categorySlug))
          .limit(1);
        if (!cat) return [];
        const items = await db
          .select()
          .from(listings)
          .where(
            and(eq(listings.status, "active"), eq(listings.categoryId, cat.id))
          )
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
      return db
        .select()
        .from(listings)
        .where(eq(listings.userId, ctx.user.id))
        .orderBy(desc(listings.createdAt));
    }),
    listingForEdit: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const [listing] = await db
          .select()
          .from(listings)
          .where(
            and(eq(listings.id, input.id), eq(listings.userId, ctx.user.id))
          )
          .limit(1);

        if (!listing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Anuncio nao encontrado.",
          });
        }

        const images = await db
          .select()
          .from(listingImages)
          .where(eq(listingImages.listingId, listing.id))
          .orderBy(listingImages.sortOrder);

        return { ...listing, images };
      }),
    createListing: protectedProcedure
      .input(
        z.object({
          title: z.string().min(5).max(200),
          description: z.string().optional(),
          price: z.number().optional(),
          priceType: z
            .enum(["fixed", "negotiable", "free", "on_request"])
            .default("fixed"),
          type: z
            .enum(["product", "service", "vehicle", "property", "food", "job"])
            .default("product"),
          categoryId: z.number(),
          subcategory: z.string().max(80).optional(),
          itemCondition: z.string().max(30).optional(),
          cityId: z.number().optional(),
          neighborhood: z.string().optional(),
          whatsapp: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
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
    updateListing: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(5).max(200).optional(),
          description: z.string().optional(),
          price: z.number().optional(),
          priceType: z
            .enum(["fixed", "negotiable", "free", "on_request"])
            .optional(),
          type: z
            .enum(["product", "service", "vehicle", "property", "food", "job"])
            .optional(),
          categoryId: z.number().optional(),
          subcategory: z.string().max(80).optional(),
          itemCondition: z.string().max(30).optional(),
          cityId: z.number().optional(),
          neighborhood: z.string().optional(),
          status: z.enum(["active", "paused", "sold"]).optional(),
          whatsapp: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { id, price, ...rest } = input;
        await db
          .update(listings)
          .set({
            ...rest,
            price: price ? String(price) : undefined,
            updatedAt: new Date(),
          })
          .where(and(eq(listings.id, id), eq(listings.userId, ctx.user.id)));
        return { success: true };
      }),
    deleteListing: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db
          .delete(listings)
          .where(
            and(eq(listings.id, input.id), eq(listings.userId, ctx.user.id))
          );
        return { success: true };
      }),
    addImage: protectedProcedure
      .input(
        z.object({
          listingId: z.number(),
          url: z.string(),
          fileKey: z.string().optional(),
          isPrimary: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [listing] = await db
          .select()
          .from(listings)
          .where(
            and(
              eq(listings.id, input.listingId),
              eq(listings.userId, ctx.user.id)
            )
          )
          .limit(1);
        if (!listing) throw new TRPCError({ code: "FORBIDDEN" });
        await db.insert(listingImages).values(input);
        return { success: true };
      }),
    activateBooster: protectedProcedure
      .input(
        z.object({
          listingId: z.number(),
          type: z.enum(["featured", "top", "banner"]).default("featured"),
          durationDays: z.number().default(7),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [listing] = await db
          .select()
          .from(listings)
          .where(
            and(
              eq(listings.id, input.listingId),
              eq(listings.userId, ctx.user.id)
            )
          )
          .limit(1);
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
        await db.insert(boosters).values({
          ...input,
          userId: ctx.user.id,
          price: String(price),
          status: "active",
          startsAt,
          expiresAt,
        });
        await db
          .update(listings)
          .set({ isBoosted: true, boostExpiresAt: expiresAt })
          .where(eq(listings.id, input.listingId));
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
      const myListings = await db
        .select()
        .from(listings)
        .where(eq(listings.userId, ctx.user.id));
      const totalViews = myListings.reduce(
        (sum, l) => sum + (l.viewCount || 0),
        0
      );
      const totalContacts = myListings.reduce(
        (sum, l) => sum + (l.contactCount || 0),
        0
      );
      const totalFavorites = myListings.reduce(
        (sum, l) => sum + (l.favoriteCount || 0),
        0
      );
      const activeBoosters = await db
        .select()
        .from(boosters)
        .where(
          and(eq(boosters.userId, ctx.user.id), eq(boosters.status, "active"))
        );
      const topListing =
        [...myListings].sort(
          (a, b) => (b.viewCount || 0) - (a.viewCount || 0)
        )[0] ?? null;
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
    toggleFavorite: protectedProcedure
      .input(z.object({ listingId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [existing] = await db
          .select()
          .from(favorites)
          .where(
            and(
              eq(favorites.userId, ctx.user.id),
              eq(favorites.listingId, input.listingId)
            )
          )
          .limit(1);
        if (existing) {
          await db.delete(favorites).where(eq(favorites.id, existing.id));
          return { favorited: false };
        } else {
          await db
            .insert(favorites)
            .values({ userId: ctx.user.id, listingId: input.listingId });
          return { favorited: true };
        }
      }),
    myFavorites: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const favs = await db
        .select()
        .from(favorites)
        .where(eq(favorites.userId, ctx.user.id));
      if (!favs.length) return [];
      const ids = favs.map(f => f.listingId);
      return db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.status, "active"),
            sql`${listings.id} IN (${ids.join(",")})`
          )
        );
    }),
    uploadImage: protectedProcedure
      .input(
        z.object({
          listingId: z.number(),
          base64: z.string(),
          mimeType: z.string().default("image/jpeg"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { storagePut } = await import("./storage");
        const buffer = Buffer.from(
          input.base64.replace(/^data:[^;]+;base64,/, ""),
          "base64"
        );
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
        rejectedListings: allListings.filter(
          listing => listing.status === "rejected"
        ).length,
      };
    }),
    allUsers: protectedProcedure
      .input(
        z.object({ page: z.number().default(1), limit: z.number().default(20) })
      )
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin")
          throw new TRPCError({ code: "FORBIDDEN" });
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
    allListings: protectedProcedure
      .input(
        z.object({ page: z.number().default(1), status: z.string().optional() })
      )
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin")
          throw new TRPCError({ code: "FORBIDDEN" });
        const db = await getDb();
        if (!db) return [];
        const conditions: any[] = [];
        if (input.status)
          conditions.push(eq(listings.status, input.status as any));
        const items = await db
          .select()
          .from(listings)
          .where(conditions.length ? and(...conditions) : undefined)
          .orderBy(desc(listings.createdAt))
          .limit(20)
          .offset((input.page - 1) * 20);

        const userIds = Array.from(new Set(items.map(item => item.userId)));
        const cityIds = Array.from(
          new Set(
            items
              .map(item => item.cityId)
              .filter((value): value is number => typeof value === "number")
          )
        );
        const categoryIds = Array.from(
          new Set(items.map(item => item.categoryId))
        );

        const sellerRows = userIds.length
          ? await db
              .select({ id: users.id, name: users.name })
              .from(users)
              .where(sql`${users.id} IN (${userIds.join(",")})`)
          : [];
        const cityRows = cityIds.length
          ? await db
              .select({ id: cities.id, name: cities.name })
              .from(cities)
              .where(sql`${cities.id} IN (${cityIds.join(",")})`)
          : [];
        const categoryRows = categoryIds.length
          ? await db
              .select({ id: categories.id, name: categories.name })
              .from(categories)
              .where(sql`${categories.id} IN (${categoryIds.join(",")})`)
          : [];

        const sellersById = new Map(
          sellerRows.map(item => [item.id, item.name])
        );
        const citiesById = new Map(cityRows.map(item => [item.id, item.name]));
        const categoriesById = new Map(
          categoryRows.map(item => [item.id, item.name])
        );

        return items.map(item => ({
          ...item,
          sellerName: sellersById.get(item.userId) ?? null,
          cityName: item.cityId ? (citiesById.get(item.cityId) ?? null) : null,
          categoryName: categoriesById.get(item.categoryId) ?? null,
        }));
      }),
    moderateListing: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["active", "rejected", "paused"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin")
          throw new TRPCError({ code: "FORBIDDEN" });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db
          .update(listings)
          .set({ status: input.status })
          .where(eq(listings.id, input.id));
        return { success: true };
      }),
    banUser: protectedProcedure
      .input(z.object({ id: z.number(), banned: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin")
          throw new TRPCError({ code: "FORBIDDEN" });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db
          .update(users)
          .set({ isBanned: input.banned })
          .where(eq(users.id, input.id));
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
