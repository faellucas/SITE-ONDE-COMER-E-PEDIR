type ListingType =
  | "product"
  | "service"
  | "vehicle"
  | "property"
  | "food"
  | "job";

export const mockCities = [
  {
    id: 1,
    name: "Ibaiti",
    state: "PR",
    slug: "ibaiti",
    isActive: true,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: 2,
    name: "Jaboti",
    state: "PR",
    slug: "jaboti",
    isActive: true,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: 3,
    name: "Japira",
    state: "PR",
    slug: "japira",
    isActive: true,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: 4,
    name: "Pinhalao",
    state: "PR",
    slug: "pinhalao",
    isActive: true,
    createdAt: new Date("2025-01-01"),
  },
];

export const mockCategories = [
  {
    id: 2,
    name: "Delivery",
    slug: "delivery",
    icon: "ShoppingBag",
    color: "#f97316",
    parentId: null,
    isActive: true,
    sortOrder: 1,
    viewCount: 133,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: 3,
    name: "Servicos Gerais",
    slug: "servicos-gerais",
    icon: "Wrench",
    color: "#8b5cf6",
    parentId: null,
    isActive: true,
    sortOrder: 2,
    viewCount: 41,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: 4,
    name: "Veiculos",
    slug: "veiculos",
    icon: "Car",
    color: "#2563eb",
    parentId: null,
    isActive: true,
    sortOrder: 3,
    viewCount: 88,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: 5,
    name: "Imoveis",
    slug: "imoveis",
    icon: "HomeIcon",
    color: "#0f766e",
    parentId: null,
    isActive: true,
    sortOrder: 4,
    viewCount: 62,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: 6,
    name: "Eletronicos",
    slug: "eletronicos",
    icon: "Smartphone",
    color: "#06b6d4",
    parentId: null,
    isActive: true,
    sortOrder: 5,
    viewCount: 56,
    createdAt: new Date("2025-01-01"),
  },
];

export const mockPlans = [
  {
    id: 1,
    name: "Gratis",
    slug: "gratis",
    description: "Plano inicial para testar a plataforma",
    price: "0.00",
    durationDays: 30,
    maxListings: 5,
    maxImages: 3,
    canBoost: false,
    canFeatured: false,
    isActive: true,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: 2,
    name: "Profissional",
    slug: "profissional",
    description: "Mais alcance para negocios locais",
    price: "99.90",
    durationDays: 365,
    maxListings: 15,
    maxImages: 8,
    canBoost: true,
    canFeatured: false,
    isActive: true,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: 3,
    name: "Premium",
    slug: "premium",
    description: "Destaque maximo na plataforma",
    price: "129.90",
    durationDays: 365,
    maxListings: 9999,
    maxImages: 20,
    canBoost: true,
    canFeatured: true,
    isActive: true,
    createdAt: new Date("2025-01-01"),
  },
];

export const mockUsers = [
  {
    id: 1,
    openId: "mock-user-1",
    name: "Restaurante Sabor da Praca",
    email: null,
    loginMethod: "mock",
    role: "advertiser",
    phone: null,
    whatsapp: "43999990001",
    avatar: null,
    bannerUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80",
    bio: null,
    openingHoursJson: stringifyOpeningHours({
      ...DEFAULT_OPENING_HOURS,
      sun: { enabled: true, open: "18:00", close: "23:00" },
      mon: { enabled: true, open: "11:00", close: "22:30" },
      tue: { enabled: true, open: "11:00", close: "22:30" },
      wed: { enabled: true, open: "11:00", close: "22:30" },
      thu: { enabled: true, open: "11:00", close: "22:30" },
      fri: { enabled: true, open: "11:00", close: "23:30" },
      sat: { enabled: true, open: "18:00", close: "23:30" },
    }),
    personType: "pj",
    cpfCnpj: null,
    companyName: "Sabor da Praca",
    cityId: 1,
    neighborhood: "Centro",
    planId: 2,
    planExpiresAt: null,
    trialStartedAt: new Date("2025-01-01"),
    trialUsed: true,
    isVerified: true,
    isBanned: false,
    createdAt: new Date("2024-12-10"),
    updatedAt: new Date("2025-03-01"),
    lastSignedIn: new Date("2025-03-01"),
  },
  {
    id: 2,
    openId: "mock-user-2",
    name: "Auto Center Norte",
    email: null,
    loginMethod: "mock",
    role: "advertiser",
    phone: null,
    whatsapp: "43999990002",
    avatar: null,
    bannerUrl:
      "https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=1400&q=80",
    bio: null,
    openingHoursJson: stringifyOpeningHours(DEFAULT_OPENING_HOURS),
    personType: "pj",
    cpfCnpj: null,
    companyName: "Auto Center Norte",
    cityId: 1,
    neighborhood: "Vila Nova",
    planId: 2,
    planExpiresAt: null,
    trialStartedAt: new Date("2025-01-01"),
    trialUsed: true,
    isVerified: true,
    isBanned: false,
    createdAt: new Date("2024-11-15"),
    updatedAt: new Date("2025-03-01"),
    lastSignedIn: new Date("2025-03-01"),
  },
];

export const mockListings = [
  {
    id: 1,
    userId: 1,
    categoryId: 2,
    subcategory: "Marmita",
    itemCondition: null,
    cityId: 1,
    title: "Prato executivo com entrega rapida",
    description: "Almoco caseiro com marmita, suco e entrega no centro.",
    price: "24.90",
    priceType: "fixed",
    type: "food" as ListingType,
    neighborhood: "Centro",
    whatsapp: "43999990001",
    status: "active",
    isFeatured: true,
    isBoosted: true,
    boostExpiresAt: new Date("2026-04-01"),
    viewCount: 184,
    contactCount: 37,
    favoriteCount: 12,
    expiresAt: new Date("2026-04-30"),
    createdAt: new Date("2026-03-08"),
    updatedAt: new Date("2026-03-08"),
  },
  {
    id: 2,
    userId: 1,
    categoryId: 2,
    subcategory: "Pizza",
    itemCondition: null,
    cityId: 1,
    title: "Pizza grande com borda recheada",
    description: "Pedido online com entrega noturna em Ibaiti.",
    price: "59.90",
    priceType: "fixed",
    type: "food" as ListingType,
    neighborhood: "Centro",
    whatsapp: "43999990001",
    status: "active",
    isFeatured: false,
    isBoosted: true,
    boostExpiresAt: new Date("2026-04-01"),
    viewCount: 133,
    contactCount: 24,
    favoriteCount: 9,
    expiresAt: new Date("2026-04-30"),
    createdAt: new Date("2026-03-07"),
    updatedAt: new Date("2026-03-07"),
  },
  {
    id: 3,
    userId: 2,
    categoryId: 4,
    subcategory: "Carro",
    itemCondition: "Usado",
    cityId: 1,
    title: "Troca de oleo e revisao completa",
    description: "Servico rapido para carros populares e utilitarios.",
    price: "120.00",
    priceType: "negotiable",
    type: "service" as ListingType,
    neighborhood: "Vila Nova",
    whatsapp: "43999990002",
    status: "active",
    isFeatured: false,
    isBoosted: false,
    boostExpiresAt: null,
    viewCount: 88,
    contactCount: 14,
    favoriteCount: 5,
    expiresAt: new Date("2026-04-30"),
    createdAt: new Date("2026-03-05"),
    updatedAt: new Date("2026-03-05"),
  },
  {
    id: 4,
    userId: 2,
    categoryId: 5,
    subcategory: "Casa",
    itemCondition: null,
    cityId: 3,
    title: "Casa com 2 quartos perto do centro",
    description: "Imovel pronto para morar, com garagem e quintal.",
    price: "185000.00",
    priceType: "fixed",
    type: "property" as ListingType,
    neighborhood: "Jardim Novo",
    whatsapp: "43999990002",
    status: "active",
    isFeatured: true,
    isBoosted: false,
    boostExpiresAt: null,
    viewCount: 62,
    contactCount: 10,
    favoriteCount: 3,
    expiresAt: new Date("2026-04-30"),
    createdAt: new Date("2026-03-03"),
    updatedAt: new Date("2026-03-03"),
  },
  {
    id: 5,
    userId: 2,
    categoryId: 3,
    subcategory: "Montagem",
    itemCondition: null,
    cityId: 4,
    title: "Montagem de moveis e pequenos reparos",
    description: "Atendimento em domicilio para casas e comercios.",
    price: "80.00",
    priceType: "negotiable",
    type: "service" as ListingType,
    neighborhood: "Centro",
    whatsapp: "43999990002",
    status: "active",
    isFeatured: false,
    isBoosted: false,
    boostExpiresAt: null,
    viewCount: 41,
    contactCount: 6,
    favoriteCount: 2,
    expiresAt: new Date("2026-04-30"),
    createdAt: new Date("2026-03-01"),
    updatedAt: new Date("2026-03-01"),
  },
];

export const mockListingImages = [
  {
    id: 1,
    listingId: 1,
    url: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=80",
    fileKey: null,
    isPrimary: true,
    sortOrder: 0,
    createdAt: new Date("2026-03-08"),
  },
  {
    id: 2,
    listingId: 2,
    url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
    fileKey: null,
    isPrimary: true,
    sortOrder: 0,
    createdAt: new Date("2026-03-07"),
  },
  {
    id: 3,
    listingId: 4,
    url: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80",
    fileKey: null,
    isPrimary: true,
    sortOrder: 0,
    createdAt: new Date("2026-03-03"),
  },
];

export function attachMockSellerPreviewToListings<T extends { userId: number }>(
  items: T[]
) {
  return items.map(item => {
    const seller = mockUsers.find(user => user.id === item.userId) ?? null;

    return {
      ...item,
      seller: seller
        ? {
            id: seller.id,
            name: seller.name,
            personType: seller.personType,
            companyName: seller.companyName,
            avatar: seller.avatar,
            bannerUrl: seller.bannerUrl,
            whatsapp: seller.whatsapp,
            cityId: seller.cityId,
            neighborhood: seller.neighborhood,
            openingHoursJson: seller.openingHoursJson,
            isOpenNow: isOpenNow(seller.openingHoursJson),
            isVerified: seller.isVerified,
          }
        : null,
    };
  });
}

export function getMockSellerProfile(sellerId: number) {
  const seller = mockUsers.find(user => user.id === sellerId) ?? null;
  if (!seller) return null;

  const sellerListings = mockListings
    .filter(item => item.status === "active" && item.userId === sellerId)
    .map(item => ({
      ...item,
      images: mockListingImages.filter(image => image.listingId === item.id),
    }));

  return {
    seller: {
      id: seller.id,
      name: seller.name,
      personType: seller.personType,
      companyName: seller.companyName,
      phone: seller.phone,
      avatar: seller.avatar,
      bannerUrl: seller.bannerUrl,
      whatsapp: seller.whatsapp,
      bio: seller.bio,
      openingHoursJson: seller.openingHoursJson,
      isOpenNow: isOpenNow(seller.openingHoursJson),
      isVerified: seller.isVerified,
      createdAt: seller.createdAt,
      cityId: seller.cityId,
      neighborhood: seller.neighborhood,
    },
    listings: sellerListings,
  };
}

export function getMockListingById(id: number) {
  const listing = mockListings.find(item => item.id === id);
  if (!listing) return null;

  const seller = mockUsers.find(user => user.id === listing.userId) ?? null;
  const images = mockListingImages.filter(
    image => image.listingId === listing.id
  );

  return {
    ...listing,
    images,
    seller: seller
      ? {
          id: seller.id,
          name: seller.name,
          personType: seller.personType,
          companyName: seller.companyName,
          avatar: seller.avatar,
          bannerUrl: seller.bannerUrl,
          whatsapp: seller.whatsapp,
          openingHoursJson: seller.openingHoursJson,
          isOpenNow: isOpenNow(seller.openingHoursJson),
          isVerified: seller.isVerified,
          createdAt: seller.createdAt,
        }
      : null,
  };
}
import {
  DEFAULT_OPENING_HOURS,
  isOpenNow,
  stringifyOpeningHours,
} from "./_core/openingHours";
