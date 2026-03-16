import mysql from "mysql2/promise";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _schemaEnsured = false;

async function ensureAppSchema() {
  if (_schemaEnsured || !process.env.DATABASE_URL) return;

  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM users LIKE 'passwordHash'"
    );

    if (Array.isArray(columns) && columns.length === 0) {
      await connection.query(
        "ALTER TABLE users ADD COLUMN passwordHash varchar(255) NULL AFTER email"
      );
    }

    const [listingSubcategoryColumns] = await connection.query(
      "SHOW COLUMNS FROM listings LIKE 'subcategory'"
    );

    if (
      Array.isArray(listingSubcategoryColumns) &&
      listingSubcategoryColumns.length === 0
    ) {
      await connection.query(
        "ALTER TABLE listings ADD COLUMN subcategory varchar(80) NULL AFTER categoryId"
      );
    }

    const [listingConditionColumns] = await connection.query(
      "SHOW COLUMNS FROM listings LIKE 'itemCondition'"
    );

    if (
      Array.isArray(listingConditionColumns) &&
      listingConditionColumns.length === 0
    ) {
      await connection.query(
        "ALTER TABLE listings ADD COLUMN itemCondition varchar(30) NULL AFTER subcategory"
      );
    }

    const [bannerUrlColumns] = await connection.query(
      "SHOW COLUMNS FROM users LIKE 'bannerUrl'"
    );

    if (Array.isArray(bannerUrlColumns) && bannerUrlColumns.length === 0) {
      await connection.query(
        "ALTER TABLE users ADD COLUMN bannerUrl text NULL AFTER avatar"
      );
    }

    const [openingHoursColumns] = await connection.query(
      "SHOW COLUMNS FROM users LIKE 'openingHoursJson'"
    );

    if (Array.isArray(openingHoursColumns) && openingHoursColumns.length === 0) {
      await connection.query(
        "ALTER TABLE users ADD COLUMN openingHoursJson text NULL AFTER bio"
      );
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id int AUTO_INCREMENT PRIMARY KEY,
        userId int NOT NULL,
        tokenHash varchar(128) NOT NULL UNIQUE,
        expiresAt timestamp NOT NULL,
        usedAt timestamp NULL,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    _schemaEnsured = true;
  } finally {
    await connection.end();
  }
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
      await ensureAppSchema();
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = [
      "name",
      "email",
      "passwordHash",
      "loginMethod",
    ] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.
