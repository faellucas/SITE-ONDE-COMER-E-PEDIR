import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { LOGIN_ROUTE } from "@/const";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import {
  Ambulance,
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Car,
  HeartHandshake,
  Home as HomeIcon,
  LayoutGrid,
  MapPin,
  Phone,
  Search,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Store,
  Stethoscope,
  Wrench,
  Zap,
} from "lucide-react";

type HomeHighlightListing = {
  id: number;
  userId: number;
  title: string;
  cityId?: number | null;
  categoryId?: number | null;
  subcategory?: string | null;
  whatsapp?: string | null;
  price?: string | null;
  images?: { url: string; isPrimary?: boolean | null }[];
  seller?: {
    id?: number;
    name?: string | null;
    companyName?: string | null;
    avatar?: string | null;
    bannerUrl?: string | null;
    whatsapp?: string | null;
    cityId?: number | null;
    neighborhood?: string | null;
    isVerified?: boolean | null;
  } | null;
};

const GUIDE_SHORTCUTS = [
  {
    title: "Saude",
    description: "Hospitais, clinicas e farmacias",
    href: "/busca?q=saude",
    icon: Stethoscope,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Educacao",
    description: "Escolas, cursos e faculdades",
    href: "/busca?q=educacao",
    icon: Briefcase,
    tone: "bg-orange-50 text-orange-700",
  },
  {
    title: "Seguranca",
    description: "Policia, apoio e servicos uteis",
    href: "/busca?q=seguranca",
    icon: Shield,
    tone: "bg-blue-50 text-blue-700",
  },
  {
    title: "Emergencias",
    description: "Atalhos para urgencias da cidade",
    href: "/busca?q=emergencia",
    icon: Ambulance,
    tone: "bg-rose-50 text-rose-700",
  },
  {
    title: "Oficinas",
    description: "Mecanicos, eletricistas e reparos",
    href: "/busca?q=oficina",
    icon: Wrench,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    title: "Servicos",
    description: "Prestadores e negocios locais",
    href: "/busca?q=servicos",
    icon: HeartHandshake,
    tone: "bg-violet-50 text-violet-700",
  },
];

const MAIN_SHORTCUTS = [
  {
    label: "Guia Local",
    description: "Servicos e contatos da sua cidade",
    href: "/guia",
    icon: MapPin,
    tone: "bg-white text-slate-900",
  },
  {
    label: "Marketplace",
    description: "Produtos, servicos e oportunidades",
    href: "/busca",
    icon: ShoppingCart,
    tone: "bg-orange-500 text-white",
  },
  {
    label: "Lojas e Empresas",
    description: "Negocios locais em destaque",
    href: "/lojas",
    icon: Store,
    tone: "bg-slate-900 text-white",
  },
  {
    label: "Servicos",
    description: "Prestadores e negocios locais",
    href: "/busca?q=servicos",
    icon: HeartHandshake,
    tone: "bg-emerald-500 text-white",
  },
];

const PRIMARY_CATEGORIES = [
  {
    title: "Imoveis",
    query: "imoveis",
    icon: HomeIcon,
    tone: "from-teal-500 to-cyan-500",
  },
  {
    title: "Veiculos",
    query: "veiculos",
    icon: Car,
    tone: "from-blue-600 to-indigo-500",
  },
  {
    title: "Delivery",
    query: "delivery",
    icon: ShoppingBag,
    tone: "from-orange-500 to-amber-500",
  },
  {
    title: "Servicos Gerais",
    query: "servicos",
    icon: Wrench,
    tone: "from-violet-500 to-fuchsia-500",
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedCity, setSelectedCity] = useState<number | null>(null);

  const { data: categories } = trpc.public.categories.useQuery();
  const { data: topCategories } = trpc.public.topCategories.useQuery({
    limit: 8,
  });
  const { data: cities } = trpc.public.cities.useQuery();
  const { data: featured } = trpc.public.featuredListings.useQuery({
    limit: 8,
    cityId: selectedCity ?? undefined,
  });
  const { data: recent } = trpc.public.recentListings.useQuery({
    limit: 16,
    cityId: selectedCity ?? undefined,
  });
  const { data: deliveryListings } = trpc.public.listingsByCategory.useQuery({
    categorySlug: "delivery",
    limit: 6,
  });

  const topCategoryList = topCategories?.length ? topCategories : categories?.slice(0, 8);
  const featuredListings = featured ?? [];
  const recentListings = recent ?? [];
  const selectedCityName =
    cities?.find(city => city.id === selectedCity)?.name ?? "sua cidade";

  const companyHighlights = useMemo(
    () =>
      (featuredListings.length ? featuredListings : recentListings)
        .reduce<HomeHighlightListing[]>((acc, item) => {
          const key = (
            item.seller?.companyName ||
            item.seller?.name ||
            item.title
          )
            .trim()
            .toLowerCase();
          if (!acc.some(existing => {
            const existingKey = (
              existing.seller?.companyName ||
              existing.seller?.name ||
              existing.title
            )
              .trim()
              .toLowerCase();
            return existingKey === key;
          })) {
            acc.push(item as HomeHighlightListing);
          }
          return acc;
        }, [])
        .slice(0, 8),
    [featuredListings, recentListings]
  );

  const handleSearch = (query: string) => {
    navigate(`/busca?q=${encodeURIComponent(query)}&city=${selectedCity || ""}`);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff8ef_0%,#f8fafc_32%,#f8fafc_100%)]">
      <Header
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        onSearch={handleSearch}
      />

      <main className="pb-24 md:pb-0">
        <section className="container pt-2 pb-0 sm:pt-6 sm:pb-4">
          <div className="hidden overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_45%,#f97316_120%)] px-5 py-6 text-white shadow-[0_20px_70px_rgba(15,23,42,0.18)] sm:block sm:px-8 sm:py-10">
            <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <div className="hidden items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-semibold text-white sm:inline-flex">
                  <BadgeCheck className="h-4 w-4" />
                  Marketplace + Guia Local + Lojas e Empresas
                </div>
                <h1 className="hidden mt-4 font-display text-3xl font-black leading-tight text-white sm:block sm:text-5xl">
                  O shopping da cidade e os servicos locais em um so lugar.
                </h1>
                <p className="hidden mt-3 max-w-2xl text-sm leading-6 text-blue-50/90 sm:block sm:mt-4 sm:text-lg sm:leading-7">
                  Encontre produtos, negocios e servicos reais do Norte
                  Pioneiro logo na primeira busca.
                </p>

                <div className="hidden grid-cols-2 gap-3 sm:mt-6 md:grid md:grid-cols-4">
                  {MAIN_SHORTCUTS.map(item => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        className={`rounded-[28px] px-4 py-4 shadow-lg transition-transform hover:-translate-y-0.5 ${item.tone}`}
                      >
                        <div className="flex flex-col items-start gap-4">
                          <div className="rounded-2xl bg-black/10 p-3">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-display text-lg font-bold leading-tight">
                              {item.label}
                            </p>
                            <p className="mt-1 text-xs leading-5 opacity-80 sm:text-sm">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>

                <div className="mt-4 hidden grid-cols-2 gap-3 lg:hidden">
                  <div className="rounded-[22px] bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-2xl font-black text-white">
                      {featuredListings.length || recentListings.length}
                    </p>
                    <p className="text-sm text-blue-100">Ofertas visiveis agora</p>
                  </div>
                  <div className="rounded-[22px] bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-2xl font-black text-white">
                      {companyHighlights.length}
                    </p>
                    <p className="text-sm text-blue-100">Lojas e empresas</p>
                  </div>
                </div>
              </div>

              <div className="hidden rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-md lg:block">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/15 p-3">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
                      Busca global
                    </p>
                    <p className="text-sm text-blue-50/85">
                      Produtos, servicos e negocios da regiao
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {[
                    "Buscar produtos em oferta",
                    "Encontrar servicos locais",
                    "Explorar lojas e empresas",
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSearch(suggestion)}
                      className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-left text-slate-800 transition hover:bg-orange-50"
                    >
                      <span className="font-medium">{suggestion}</span>
                      <ArrowRight className="h-4 w-4 text-orange-500" />
                    </button>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-2xl font-black text-white">
                      {featuredListings.length || recentListings.length}
                    </p>
                    <p className="text-sm text-blue-100">Anuncios em destaque</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-2xl font-black text-white">
                      {companyHighlights.length}
                    </p>
                    <p className="text-sm text-blue-100">Lojas e empresas visiveis</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="guia-local" className="hidden container py-8 sm:block">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">
                Guia local
              </p>
              <h2 className="font-display text-3xl font-black text-slate-900">
                Servicos locais que resolvem o dia a dia
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Atalhos rapidos para o que mais importa em {selectedCityName}.
              </p>
            </div>
            <Link href="/guia">
              <Button variant="outline" className="rounded-2xl">
                Abrir guia local
              </Button>
            </Link>
          </div>

          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pb-0 xl:grid-cols-3">
            {GUIDE_SHORTCUTS.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group min-w-[82%] snap-center rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50/40 sm:min-w-0 sm:rounded-[28px]"
                >
                  <div className={`inline-flex rounded-2xl p-3 ${item.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-orange-600">
                    Explorar
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section id="lojas-empresas" className="container pb-4 pt-3 sm:py-8">
          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                Lojas e empresas
              </p>
              <h2 className="font-display text-3xl font-black text-slate-900">
                Descubra lojas, produtos e telefones perto de voce
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Explore negocios locais, encontre contatos uteis e veja o que esta mais perto de voce.
              </p>
            </div>
            <Link href="/lojas">
              <Button variant="outline" className="rounded-2xl">
                Ver lojas
              </Button>
            </Link>
          </div>

          {companyHighlights.length > 0 ? (
            <>
              <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:hidden">
                {companyHighlights.map(item => {
                  const displayName =
                    item.seller?.companyName?.trim() ||
                    item.seller?.name?.trim() ||
                    item.title;
                  const cityName =
                    cities?.find(city => city.id === item.seller?.cityId)?.name ||
                    "Norte Pioneiro";
                  const neighborhood = item.seller?.neighborhood?.trim();
                  const subtitle =
                    categories?.find(category => category.id === item.categoryId)?.name ||
                    item.subcategory ||
                    "Negocio local";
                  const profileImage = item.seller?.avatar;

                  return (
                    <Link
                      key={item.id}
                      href={`/anuncio/${item.id}`}
                      className="min-w-[86%] snap-center rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div>
                        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[22px] bg-slate-100 text-lg font-black text-blue-700">
                          {profileImage ? (
                            <img
                              src={profileImage}
                              alt={displayName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="mt-4">
                          <p className="truncate font-display text-2xl font-bold leading-tight text-slate-900">
                            {displayName}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                              <Store className="h-3.5 w-3.5" />
                              {subtitle}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                              <BadgeCheck className="h-3.5 w-3.5" />
                              {item.seller?.isVerified ? "Verificada" : "Perfil ativo"}
                            </span>
                          </div>
                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                            Conheca a loja, veja seus anuncios e encontre formas rapidas de contato.
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 text-slate-400" />
                              {[neighborhood, cityName].filter(Boolean).join(", ")}
                            </span>
                            {(item.seller?.whatsapp || item.whatsapp) && (
                              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                                <Phone className="h-4 w-4" />
                                WhatsApp
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="hidden gap-4 overflow-x-auto pb-2 md:flex">
              {companyHighlights.map(item => {
                const cover =
                  item.seller?.bannerUrl ||
                  item.images?.find(image => image.isPrimary)?.url ||
                  item.images?.[0]?.url;
                const displayName =
                  item.seller?.companyName?.trim() ||
                  item.seller?.name?.trim() ||
                  item.title;
                const cityName =
                  cities?.find(city => city.id === item.seller?.cityId)?.name ||
                  "Norte Pioneiro";
                const neighborhood = item.seller?.neighborhood?.trim();
                const subtitle =
                  categories?.find(category => category.id === item.categoryId)?.name ||
                  item.subcategory ||
                  "Negocio local";
                return (
                  <article
                    key={item.id}
                    className="min-w-[280px] max-w-[320px] flex-1 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
                  >
                    <Link href={`/anuncio/${item.id}`} className="block">
                      <div className="relative h-40 bg-slate-100">
                        {cover ? (
                          <img
                            src={cover}
                            alt={displayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-orange-100">
                            <span className="font-display text-4xl font-black text-slate-700">
                              {displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="p-5">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          <Store className="h-3.5 w-3.5" />
                          {subtitle}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          {item.seller?.isVerified ? "Verificada" : "Perfil ativo"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-lg font-black text-blue-700">
                          {item.seller?.avatar ? (
                            <img
                              src={item.seller.avatar}
                              alt={displayName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-display text-xl font-bold text-slate-900">
                            {displayName}
                          </p>
                          <p className="truncate text-sm text-slate-500">
                            {subtitle}
                          </p>
                        </div>
                      </div>
                      <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
                        Conheca a loja, veja os itens publicados e encontre os canais de contato disponiveis.
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          {[neighborhood, cityName].filter(Boolean).join(", ")}
                        </span>
                        {(item.seller?.whatsapp || item.whatsapp) && (
                          <span className="inline-flex items-center gap-1.5 text-emerald-700">
                            <Phone className="h-4 w-4" />
                            WhatsApp disponivel
                          </span>
                        )}
                      </div>
                      <div className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-orange-600">
                        Ver perfil
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </article>
                );
              })}
              </div>
            </>
          ) : (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center">
              <Building2 className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-slate-500">
                As primeiras lojas e empresas aparecerao aqui.
              </p>
            </div>
          )}
        </section>

        <section id="marketplace" className="container py-4 sm:py-8">
          <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">
                Booster
              </p>
              <h2 className="font-display text-2xl font-black text-slate-900 sm:text-3xl">
                Anuncios patrocinados
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Mais visibilidade para ofertas impulsionadas no Norte Vivo.
              </p>
            </div>
            <Link href="/booster">
              <Button variant="outline" className="rounded-2xl px-4 py-2 text-sm">
                Ver destaques
              </Button>
            </Link>
          </div>

          {featuredListings.length > 0 ? (
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 xl:grid xl:grid-cols-4 xl:overflow-visible xl:pb-0">
              {featuredListings.map(listing => (
                (() => {
                  const listingImages = (listing as { images?: { url: string; isPrimary?: boolean | null }[] }).images;
                  const primaryImage =
                    listingImages?.find(image => image.isPrimary)?.url ||
                    listingImages?.[0]?.url;

                  return (
                    <div
                      key={listing.id}
                      className="min-w-[62%] snap-center overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm sm:min-w-[360px] xl:min-w-0"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-black text-white">
                          <Zap className="h-3.5 w-3.5" />
                          BOOSTER
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">
                          Patrocinado
                        </span>
                      </div>
                      <div className="sm:hidden">
                        <Link href={`/anuncio/${listing.id}`} className="block">
                          <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                            {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={listing.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-orange-100">
                            <span className="font-display text-4xl font-black text-slate-700">
                              {listing.title.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          )}
                      </div>
                      <div className="p-3.5">
                        <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                          {[
                            categories?.find(category => category.id === listing.categoryId)?.name,
                            listing.subcategory,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                        <h3 className="mt-2.5 line-clamp-2 text-base font-bold leading-6 text-slate-900">
                          {listing.title}
                        </h3>
                        <p className="mt-2 text-xl font-black text-blue-700">
                          {listing.price
                            ? `R$ ${Number(listing.price).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}`
                            : "Sob consulta"}
                        </p>
                        <div className="mt-2.5 flex flex-col gap-1.5 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {listing.neighborhood ||
                              cities?.find(city => city.id === listing.cityId)?.name ||
                              "Norte Pioneiro"}
                          </span>
                          <span>{new Date(listing.createdAt).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                  <div className="hidden sm:block">
                    <ListingCard
                      {...listing}
                      cityName={cities?.find(city => city.id === listing.cityId)?.name}
                      categoryName={
                        categories?.find(category => category.id === listing.categoryId)?.name
                      }
                    />
                  </div>
                </div>
                  );
                })()
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-amber-200 bg-white p-10 text-center">
              <Zap className="mx-auto h-12 w-12 text-amber-300" />
              <p className="mt-4 text-slate-500">
                Assim que houver anuncios impulsionados, eles aparecerao aqui.
              </p>
            </div>
          )}
        </section>

        <section className="container py-5 sm:py-8">
          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">
                Navegacao rapida
              </p>
              <h2 className="font-display text-3xl font-black text-slate-900">
                Categorias mais vistas
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Entradas visuais para acelerar a descoberta.
              </p>
            </div>
          </div>

            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 xl:grid xl:grid-cols-4 xl:overflow-visible xl:pb-0">
              {PRIMARY_CATEGORIES.map(item => {
                const Icon = item.icon;
                return (
                <Link
                  key={item.title}
                  href={`/busca?q=${encodeURIComponent(item.query)}`}
                  className={`min-w-[82%] snap-center rounded-[24px] bg-gradient-to-br ${item.tone} p-5 text-white shadow-lg transition hover:-translate-y-0.5 sm:min-w-[320px] sm:rounded-[28px] sm:p-6 xl:min-w-0`}
                >
                  <div className="inline-flex rounded-2xl bg-white/15 p-3">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-black sm:mt-8 sm:text-3xl">
                    {item.title}
                  </h3>
                    <p className="mt-2 text-sm text-white/85">
                      Ver anuncios e servicos relacionados.
                    </p>
                  </Link>
              );
            })}
          </div>

          {topCategoryList && topCategoryList.length > 0 && (
            <div className="mt-4 hidden flex-wrap gap-2 sm:flex">
              {topCategoryList.map(category => (
                <Link key={category.id} href={`/categoria/${category.slug}`}>
                  <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100">
                    {category.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="bg-orange-50 py-6 sm:py-10">
          <div className="container">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">
                  Delivery
                </p>
                <h2 className="font-display text-3xl font-black text-slate-900">
                  Delivery e pedidos ativos
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Um recorte comercial forte para gerar cliques rapidos.
                </p>
              </div>
              <Link href="/categoria/delivery">
                <Button variant="outline" className="rounded-2xl">
                  Ver delivery
                </Button>
              </Link>
            </div>

            {deliveryListings && deliveryListings.length > 0 ? (
              <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:grid-cols-6">
                {deliveryListings.map(listing => (
                  <div
                    key={listing.id}
                    className="min-w-[86%] snap-center sm:min-w-0"
                  >
                    <ListingCard
                      {...listing}
                      cityName={cities?.find(city => city.id === listing.cityId)?.name}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[28px] bg-white p-10 text-center shadow-sm">
                <ShoppingBag className="mx-auto h-12 w-12 text-orange-200" />
                <p className="mt-4 text-slate-500">
                  Os primeiros deliveries em destaque aparecerao aqui.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="container py-6 sm:py-10">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                Feed de novidades
              </p>
              <h2 className="font-display text-3xl font-black text-slate-900">
                Ultimos anuncios publicados
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Novidades para manter a Home viva e em movimento.
              </p>
            </div>
            <Link href="/busca">
              <Button variant="outline" className="rounded-2xl">
                Ver mais
              </Button>
            </Link>
          </div>

          {recentListings.length > 0 ? (
            <>
              <div className="space-y-3 md:hidden">
                {recentListings.slice(0, 6).map(listing => {
                  const listingMedia = listing as typeof listing & {
                    images?: { url: string; isPrimary?: boolean | null }[];
                  };
                  const image =
                    listingMedia.images?.find(photo => photo.isPrimary)?.url ||
                    listingMedia.images?.[0]?.url;
                  return (
                    <Link
                      key={listing.id}
                      href={`/anuncio/${listing.id}`}
                      className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                        {image ? (
                          <img
                            src={image}
                            alt={listing.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-100">
                            <LayoutGrid className="h-5 w-5 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-display text-lg font-bold text-slate-900">
                          {listing.title}
                        </p>
                        <p className="mt-1 text-base font-black text-orange-600">
                          {listing.price || "Consulte"}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {cities?.find(city => city.id === listing.cityId)?.name ||
                            "Norte Pioneiro"}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="hidden grid-cols-2 gap-4 md:grid md:grid-cols-4 xl:grid-cols-5">
              {recentListings.map(listing => (
                <ListingCard
                  key={listing.id}
                  {...listing}
                  cityName={cities?.find(city => city.id === listing.cityId)?.name}
                  categoryName={
                    categories?.find(category => category.id === listing.categoryId)?.name
                  }
                />
              ))}
              </div>
            </>
          ) : (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-12 text-center">
              <LayoutGrid className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-slate-500">
                Assim que novos anuncios entrarem no portal, a Home vai refletir isso aqui.
              </p>
            </div>
          )}
        </section>

        <section className="container pb-14">
          <div className="rounded-[32px] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#f97316_140%)] p-6 text-white shadow-[0_22px_70px_rgba(15,23,42,0.18)] sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-200">
                  Publique agora
                </p>
                <h2 className="mt-3 font-display text-3xl font-black">
                  O Norte Vivo precisa parecer vivo ja na primeira dobra.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                  Quanto mais anuncios, lojas e servicos reais aparecerem aqui,
                  mais forte fica a percepcao comercial do portal.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link href={isAuthenticated ? "/anunciante/novo" : LOGIN_ROUTE}>
                  <Button className="h-12 w-full rounded-2xl bg-white text-slate-900 hover:bg-slate-100">
                    <Zap className="mr-2 h-4 w-4" />
                    Anunciar agora
                  </Button>
                </Link>
                <Link href="/planos">
                  <Button className="h-12 w-full rounded-2xl bg-orange-500 text-white hover:bg-orange-600">
                    <Zap className="mr-2 h-4 w-4" />
                    Ver planos
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
