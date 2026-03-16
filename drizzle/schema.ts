import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "advertiser", "admin"])
    .default("user")
    .notNull(),
  // Profile
  phone: varchar("phone", { length: 20 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  avatar: text("avatar"),
  bannerUrl: text("bannerUrl"),
  bio: text("bio"),
  openingHoursJson: text("openingHoursJson"),
  // PF or PJ
  personType: mysqlEnum("personType", ["pf", "pj"]).default("pf"),
  cpfCnpj: varchar("cpfCnpj", { length: 20 }),
  companyName: text("companyName"),
  // Location
  cityId: int("cityId"),
  neighborhood: varchar("neighborhood", { length: 100 }),
  // Plan
  planId: int("planId"),
  planExpiresAt: timestamp("planExpiresAt"),
  trialStartedAt: timestamp("trialStartedAt"),
  trialUsed: boolean("trialUsed").default(false),
  // Status
  isVerified: boolean("isVerified").default(false),
  isBanned: boolean("isBanned").default(false),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// ─── Cities ───────────────────────────────────────────────────────────────────
export const cities = mysqlTable("cities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  state: varchar("state", { length: 2 }).default("PR").notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Categories ───────────────────────────────────────────────────────────────
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  parentId: int("parentId"),
  isActive: boolean("isActive").default(true),
  sortOrder: int("sortOrder").default(0),
  viewCount: int("viewCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Plans ────────────────────────────────────────────────────────────────────
export const plans = mysqlTable("plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).default("0.00"),
  durationDays: int("durationDays").default(30),
  maxListings: int("maxListings").default(5),
  maxImages: int("maxImages").default(3),
  canBoost: boolean("canBoost").default(false),
  canFeatured: boolean("canFeatured").default(false),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Listings ─────────────────────────────────────────────────────────────────
export const listings = mysqlTable("listings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  categoryId: int("categoryId").notNull(),
  subcategory: varchar("subcategory", { length: 80 }),
  itemCondition: varchar("itemCondition", { length: 30 }),
  cityId: int("cityId"),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 12, scale: 2 }),
  priceType: mysqlEnum("priceType", [
    "fixed",
    "negotiable",
    "free",
    "on_request",
  ]).default("fixed"),
  type: mysqlEnum("type", [
    "product",
    "service",
    "vehicle",
    "property",
    "food",
    "job",
  ]).default("product"),
  neighborhood: varchar("neighborhood", { length: 100 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  // Status
  status: mysqlEnum("status", [
    "pending",
    "active",
    "paused",
    "sold",
    "rejected",
    "expired",
  ]).default("pending"),
  isFeatured: boolean("isFeatured").default(false),
  isBoosted: boolean("isBoosted").default(false),
  boostExpiresAt: timestamp("boostExpiresAt"),
  // Metrics
  viewCount: int("viewCount").default(0),
  contactCount: int("contactCount").default(0),
  favoriteCount: int("favoriteCount").default(0),
  // Validity
  expiresAt: timestamp("expiresAt"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Listing Images ───────────────────────────────────────────────────────────
export const listingImages = mysqlTable("listing_images", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  url: text("url").notNull(),
  fileKey: text("fileKey"),
  isPrimary: boolean("isPrimary").default(false),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Boosters ─────────────────────────────────────────────────────────────────
export const boosters = mysqlTable("boosters", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["featured", "top", "banner"]).default("featured"),
  durationDays: int("durationDays").default(7),
  price: decimal("price", { precision: 10, scale: 2 }),
  status: mysqlEnum("status", [
    "pending",
    "active",
    "expired",
    "cancelled",
  ]).default("pending"),
  startsAt: timestamp("startsAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Favorites ────────────────────────────────────────────────────────────────
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  listingId: int("listingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  reviewerId: int("reviewerId").notNull(),
  sellerId: int("sellerId").notNull(),
  listingId: int("listingId"),
  rating: int("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  reporterId: int("reporterId").notNull(),
  listingId: int("listingId"),
  reason: varchar("reason", { length: 100 }),
  description: text("description"),
  status: mysqlEnum("status", ["open", "reviewed", "resolved"]).default("open"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Banners ──────────────────────────────────────────────────────────────────
export const banners = mysqlTable("banners", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }),
  imageUrl: text("imageUrl").notNull(),
  linkUrl: text("linkUrl"),
  position: mysqlEnum("position", [
    "home_top",
    "home_mid",
    "sidebar",
    "category",
  ]).default("home_top"),
  isActive: boolean("isActive").default(true),
  startsAt: timestamp("startsAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type City = typeof cities.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type ListingImage = typeof listingImages.$inferSelect;
export type Booster = typeof boosters.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Banner = typeof banners.$inferSelect;
