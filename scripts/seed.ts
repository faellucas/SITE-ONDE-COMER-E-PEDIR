import "dotenv/config";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run the seed script");
}

const cities = [
  { name: "Ibaiti", state: "PR", slug: "ibaiti" },
  { name: "Jaboti", state: "PR", slug: "jaboti" },
  { name: "Japira", state: "PR", slug: "japira" },
  { name: "Pinhalao", state: "PR", slug: "pinhalao" },
];

const categories = [
  { name: "Delivery", slug: "delivery", icon: "ShoppingBag", color: "#f97316", sortOrder: 1 },
  { name: "Servicos Gerais", slug: "servicos-gerais", icon: "Wrench", color: "#8b5cf6", sortOrder: 2 },
  { name: "Veiculos", slug: "veiculos", icon: "Car", color: "#2563eb", sortOrder: 3 },
  { name: "Imoveis", slug: "imoveis", icon: "HomeIcon", color: "#0f766e", sortOrder: 4 },
  { name: "Eletronicos", slug: "eletronicos", icon: "Smartphone", color: "#06b6d4", sortOrder: 5 },
];

const plans = [
  {
    name: "Gratis",
    slug: "gratis",
    description: "Plano inicial para testar a plataforma",
    price: "0.00",
    durationDays: 30,
    maxListings: 5,
    maxImages: 3,
    canBoost: false,
    canFeatured: false,
  },
  {
    name: "Profissional",
    slug: "profissional",
    description: "Mais alcance para negocios locais",
    price: "12.90",
    durationDays: 30,
    maxListings: 15,
    maxImages: 8,
    canBoost: true,
    canFeatured: false,
  },
  {
    name: "Premium",
    slug: "premium",
    description: "Destaque maximo na plataforma",
    price: "19.90",
    durationDays: 30,
    maxListings: 9999,
    maxImages: 20,
    canBoost: true,
    canFeatured: true,
  },
];

async function main() {
  const connection = await mysql.createConnection(databaseUrl);

  try {
    for (const city of cities) {
      await connection.execute(
        `
          INSERT INTO cities (name, state, slug, isActive)
          VALUES (?, ?, ?, true)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            state = VALUES(state),
            isActive = true
        `,
        [city.name, city.state, city.slug]
      );
    }

    for (const category of categories) {
      await connection.execute(
        `
          INSERT INTO categories (name, slug, icon, color, isActive, sortOrder, viewCount)
          VALUES (?, ?, ?, ?, true, ?, 0)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            icon = VALUES(icon),
            color = VALUES(color),
            isActive = true,
            sortOrder = VALUES(sortOrder)
        `,
        [
          category.name,
          category.slug,
          category.icon,
          category.color,
          category.sortOrder,
        ]
      );
    }

    for (const plan of plans) {
      await connection.execute(
        `
          INSERT INTO plans (name, slug, description, price, durationDays, maxListings, maxImages, canBoost, canFeatured, isActive)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            description = VALUES(description),
            price = VALUES(price),
            durationDays = VALUES(durationDays),
            maxListings = VALUES(maxListings),
            maxImages = VALUES(maxImages),
            canBoost = VALUES(canBoost),
            canFeatured = VALUES(canFeatured),
            isActive = true
        `,
        [
          plan.name,
          plan.slug,
          plan.description,
          plan.price,
          plan.durationDays,
          plan.maxListings,
          plan.maxImages,
          plan.canBoost,
          plan.canFeatured,
        ]
      );
    }

    console.log("Seed completed successfully");
  } finally {
    await connection.end();
  }
}

main().catch(error => {
  console.error("Seed failed", error);
  process.exit(1);
});
