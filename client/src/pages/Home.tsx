import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { LOGIN_ROUTE } from "@/const";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { CASHBACK_RULES } from "@/lib/cashback";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  Utensils,
  ShoppingBag,
  ShoppingCart,
  Shirt,
  Home as HomeIcon,
  Hammer,
  Car,
  Building2,
  MessageCircle,
  Briefcase,
  HardHat,
  Heart,
  PawPrint,
  Tractor,
  Smartphone,
  Users,
  Calendar,
  Tag,
  Wrench,
  Cross,
  Zap,
  ArrowRight,
  Star,
  TrendingUp,
  Shield,
  CheckCircle,
  ChevronRight,
  MapPin,
  BadgeCheck,
  BarChart3,
  Store as StoreIcon,
  Globe,
  SearchCheck,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils,
  ShoppingBag,
  ShoppingCart,
  Shirt,
  HomeIcon,
  Hammer,
  Car,
  Building2,
  Briefcase,
  HardHat,
  Heart,
  PawPrint,
  Tractor,
  Smartphone,
  Users,
  Calendar,
  Tag,
  Wrench,
  Cross,
  Zap,
};

const CATEGORY_COLORS: Record<string, string> = {
  delivery: "bg-orange-50 text-orange-600 hover:bg-orange-100",
  mercados: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
  farmacia: "bg-blue-50 text-blue-600 hover:bg-blue-100",
  "moda-acessorios": "bg-pink-50 text-pink-600 hover:bg-pink-100",
  "casa-moveis": "bg-purple-50 text-purple-600 hover:bg-purple-100",
  construcao: "bg-amber-50 text-amber-600 hover:bg-amber-100",
  autopecas: "bg-gray-50 text-gray-600 hover:bg-gray-100",
  veiculos: "bg-blue-50 text-blue-700 hover:bg-blue-100",
  imoveis: "bg-teal-50 text-teal-600 hover:bg-teal-100",
  "servicos-gerais": "bg-violet-50 text-violet-600 hover:bg-violet-100",
  "mao-de-obra": "bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
  "saude-beleza": "bg-rose-50 text-rose-600 hover:bg-rose-100",
  pets: "bg-green-50 text-green-600 hover:bg-green-100",
  "agro-rural": "bg-lime-50 text-lime-700 hover:bg-lime-100",
  eletronicos: "bg-cyan-50 text-cyan-600 hover:bg-cyan-100",
  empregos: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
  eventos: "bg-fuchsia-50 text-fuchsia-600 hover:bg-fuchsia-100",
  classificados: "bg-slate-50 text-slate-600 hover:bg-slate-100",
};

type HomeHighlightListing = {
  id: number;
  userId: number;
  title: string;
  cityId?: number | null;
  categoryId?: number | null;
  subcategory?: string | null;
  whatsapp?: string | null;
  images?: { url: string; isPrimary?: boolean | null }[];
  seller?: {
    id?: number;
    name?: string | null;
    companyName?: string | null;
    avatar?: string | null;
    bannerUrl?: string | null;
  } | null;
};

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [categoryCarouselApi, setCategoryCarouselApi] = useState<CarouselApi>();
  const [cashbackCarouselApi, setCashbackCarouselApi] = useState<CarouselApi>();

  const { data: categories } = trpc.public.categories.useQuery();
  const { data: topCategories } = trpc.public.topCategories.useQuery({
    limit: 10,
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

  const handleSearch = (q: string) => {
    navigate(`/busca?q=${encodeURIComponent(q)}&city=${selectedCity || ""}`);
  };

  const cityName = cities?.find(c => c.id === selectedCity)?.name;
  const featuredCategories = topCategories?.length
    ? topCategories
    : categories?.slice(0, 10);
  const companySource = (
    featured?.length ? featured : (recent ?? [])
  ) as HomeHighlightListing[];
  const companyHighlights = companySource
    .slice(0, 12)
    .reduce<HomeHighlightListing[]>((acc, item) => {
      const displayName = item.seller?.name?.trim() || item.title.trim();
      const alreadyIncluded = acc.some(
        existing =>
          (
            existing.seller?.name?.trim() || existing.title.trim()
          ).toLowerCase() === displayName.toLowerCase()
      );

      if (!alreadyIncluded) {
        acc.push(item);
      }

      return acc;
    }, [])
    .slice(0, 3);
  const quickLinks = [
    {
      label: "Guia local",
      description: "Ache lojas e servicos por perto",
      href: "/busca",
      icon: MapPin,
    },
    {
      label: "Compra e venda",
      description: "Anuncie e publique seus produtos",
      href: isAuthenticated ? "/anunciante/novo" : LOGIN_ROUTE,
      icon: ShoppingCart,
    },
    {
      label: "Vitrine digital",
      description: "Descubra vitrines e ofertas locais",
      href: "/busca?q=lojas",
      icon: ShoppingBag,
    },
    {
      label: "Perfil da loja",
      description: "Veja contatos e perfis comerciais",
      href: "/busca?q=perfil%20de%20loja",
      icon: Building2,
    },
  ];

  useEffect(() => {
    if (!categoryCarouselApi || !featuredCategories?.length) return;

    const timer = window.setInterval(() => {
      if (categoryCarouselApi.canScrollNext()) {
        categoryCarouselApi.scrollNext();
        return;
      }

      categoryCarouselApi.scrollTo(0);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [categoryCarouselApi, featuredCategories]);

  useEffect(() => {
    if (!cashbackCarouselApi) return;

    const timer = window.setInterval(() => {
      if (cashbackCarouselApi.canScrollNext()) {
        cashbackCarouselApi.scrollNext();
        return;
      }

      cashbackCarouselApi.scrollTo(0);
    }, 3200);

    return () => window.clearInterval(timer);
  }, [cashbackCarouselApi]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        onSearch={handleSearch}
      />
      <section className="container pt-8 pb-4">
        <div className="overflow-hidden rounded-[28px] bg-brand-gradient p-6 text-white shadow-sm sm:p-8">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-semibold text-white">
              <MapPin className="h-4 w-4" />
              Portal local do Norte Pioneiro
            </div>
            <h1 className="font-display text-3xl font-black text-white sm:text-4xl">
              O portal local para encontrar e ser encontrado
            </h1>
            <p className="mx-auto mt-3 max-w-3xl text-blue-50/90">
              Descubra lojas, produtos, servicos e oportunidades da sua
              regiao. No Norte Vivo, cada negocio pode ter perfil, vitrine
              publica e mais chances de aparecer para novos clientes.
            </p>
            <div className="mx-auto mt-6 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {quickLinks.map(item => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="group rounded-[20px] bg-orange-gradient px-4 py-3 text-white shadow-lg transition-all hover:-translate-y-0.5 hover:opacity-95 sm:rounded-[22px] sm:px-4 sm:py-4"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-white shadow-sm sm:h-11 sm:w-11">
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="mt-2 text-base font-semibold text-white sm:mt-3 sm:text-base">
                        {item.label}
                      </p>
                      <p className="mt-1 hidden text-sm leading-snug text-orange-50/90 sm:block">
                        {item.description}
                      </p>
                      <div className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-white sm:mt-3">
                        Acessar
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="container py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="section-heading">Empresas em destaque</h2>
            <p className="text-sm text-gray-500">
              Conheca negocios da regiao e ganhe mais visibilidade para sua
              marca dentro do portal.
            </p>
          </div>
          <Link
            href={isAuthenticated ? "/anunciante/novo" : LOGIN_ROUTE}
            className="text-sm font-medium text-orange-600 hover:underline sm:shrink-0"
          >
            Cadastrar empresa
          </Link>
        </div>

        {companyHighlights.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {companyHighlights.map(item => {
              const cover =
                (item.seller?.bannerUrl ||
                  item.images?.find(image => image.isPrimary)?.url) ??
                item.images?.[0]?.url;
              const displayName =
                item.seller?.companyName?.trim() ||
                item.seller?.name?.trim() ||
                item.title;
              const subtitle =
                categories?.find(category => category.id === item.categoryId)
                  ?.name ||
                item.subcategory ||
                "Negocio local";
              const storefrontSellerId = item.seller?.id ?? item.userId;
              const storefrontHref = `/loja/${storefrontSellerId}`;
              const whatsappHref = item.whatsapp
                ? `https://wa.me/55${item.whatsapp.replace(/\D/g, "")}`
                : null;

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-sm"
                >
                  <Link href={storefrontHref} className="block">
                    <div className="relative h-36 overflow-hidden bg-gray-100">
                      {cover ? (
                        <img
                          src={cover}
                          alt={displayName}
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                          <span className="font-display text-3xl font-black text-blue-700">
                            {displayName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        )}
                      </div>
                  </Link>

                  <div className="relative px-5 pb-5">
                    <div className="-mt-7 flex justify-center">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white text-lg font-black text-blue-700 shadow-md">
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
                    </div>

                    <div className="mt-3 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                        Destaque local
                      </p>
                      <h3 className="mt-2 font-display text-lg font-bold text-gray-900">
                        {displayName}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {cities?.find(city => city.id === item.cityId)?.name ||
                          "Norte Pioneiro"}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-2">
                      <Link href={storefrontHref}>
                        <Button
                          size="sm"
                          className="rounded-xl bg-brand-gradient text-white hover:opacity-90"
                        >
                          Ver vitrine
                        </Button>
                      </Link>
                      {whatsappHref && (
                        <a
                          href={whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            size="sm"
                            className="rounded-xl bg-green-500 text-white hover:bg-green-600"
                          >
                            <MessageCircle className="mr-1 h-4 w-4" />
                            WhatsApp
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-gray-200 bg-white p-10 text-center">
            <Building2 className="mx-auto h-10 w-10 text-blue-200" />
            <h3 className="mt-4 font-display text-xl font-bold text-gray-900">
              Sua empresa pode aparecer aqui
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Cadastre sua vitrine, publique seus produtos e entre para os
              destaques do portal.
            </p>
            <Link href={isAuthenticated ? "/anunciante/novo" : LOGIN_ROUTE}>
              <Button className="mt-5 rounded-2xl bg-orange-gradient text-white hover:opacity-90">
                Entrar para os destaques
              </Button>
            </Link>
          </div>
        )}
      </section>

      <section className="container pb-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: SearchCheck,
              title: "Encontre perto de voce",
              desc: "Busque lojas, produtos e servicos da regiao em um so lugar.",
            },
            {
              icon: StoreIcon,
              title: "Cada loja com sua vitrine",
              desc: "Perfis comerciais com banner, produtos, contato e descoberta local.",
            },
            {
              icon: Globe,
              title: "Presenca digital regional",
              desc: "Uma forma simples de sua empresa ser vista no portal e nas buscas.",
            },
          ].map(item => {
            const IconComp = item.icon;
            return (
              <article
                key={item.title}
                className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <IconComp className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {item.desc}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="container py-12">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="section-heading">
              Categorias que movimentam o portal
            </h2>
            <p className="text-sm text-gray-500">
              Explore os segmentos com mais procura e descubra vitrines que
              fazem parte da rotina da regiao.
            </p>
          </div>
          <Link
            href="/como-funciona"
            className="text-sm font-medium text-emerald-600 hover:underline sm:shrink-0"
          >
            Como funciona
          </Link>
        </div>

        <div className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
          {CASHBACK_RULES.slice(0, 4).map(rule => (
            <article
              key={rule.slug}
              className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-5 shadow-sm"
            >
              <div className="mb-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700">
                ate {rule.rate}% de cashback
              </div>
              <h3 className="font-display text-xl font-bold text-gray-900">
                {rule.label}
              </h3>
              <p className="mt-2 text-sm text-gray-600">{rule.description}</p>
            </article>
          ))}
        </div>

        <div className="md:hidden">
          <Carousel opts={{ align: "start", loop: true }} setApi={setCashbackCarouselApi}>
            <CarouselContent className="-ml-2">
              {CASHBACK_RULES.slice(0, 4).map(rule => (
                <CarouselItem key={rule.slug} className="basis-[88%] pl-2">
                  <article className="min-h-[180px] rounded-[24px] border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
                    <div className="mb-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700">
                      ate {rule.rate}% de cashback
                    </div>
                    <h3 className="font-display text-xl font-bold text-gray-900">
                      {rule.label}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">
                      {rule.description}
                    </p>
                  </article>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </section>

      {/* ─── DELIVERY ─────────────────────────────────────────────────────── */}
      <section className="bg-orange-50 py-10">
        <div className="container">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <h2 className="section-heading">
                Delivery, pedidos e vitrines ativas
              </h2>
            </div>
            <Link
              href="/categoria/delivery"
              className="flex items-center gap-1 text-sm font-medium text-orange-600 transition-all hover:gap-2 sm:shrink-0"
            >
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {deliveryListings && deliveryListings.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {deliveryListings.map(listing => (
                <ListingCard
                  key={listing.id}
                  {...listing}
                  cityName={cities?.find(c => c.id === listing.cityId)?.name}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl">
              <ShoppingBag className="w-12 h-12 text-orange-200 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">
                Nenhuma loja desta categoria apareceu ainda. Seja a primeira
                vitrine ativa daqui!
              </p>
              <Link href={isAuthenticated ? "/anunciante/novo" : LOGIN_ROUTE}>
                <Button className="bg-orange-500 text-white rounded-xl hover:bg-orange-600">
                  Anunciar Grátis
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─── RECENT LISTINGS ──────────────────────────────────────────────── */}
      <section className="container py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-gradient rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <h2 className="section-heading">
              Produtos, servicos e oportunidades
              {cityName && (
                <span className="text-blue-600 ml-2">— {cityName}</span>
              )}
            </h2>
          </div>
          <Link
            href="/busca"
            className="flex items-center gap-1 text-sm font-medium text-blue-600 transition-all hover:gap-2 sm:shrink-0"
          >
            Ver todos <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {recent && recent.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recent.map(listing => (
              <ListingCard
                key={listing.id}
                {...listing}
                cityName={cities?.find(c => c.id === listing.cityId)?.name}
                categoryName={
                  categories?.find(c => c.id === listing.categoryId)?.name
                }
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="font-display font-bold text-gray-700 text-lg mb-2">
              Nada publicado ainda
            </h3>
            <p className="text-gray-500 mb-6">
              Seja a primeira loja ou anunciante a aparecer no portal!
            </p>
            <Link href={isAuthenticated ? "/anunciante/novo" : LOGIN_ROUTE}>
              <Button className="bg-brand-gradient text-white rounded-xl px-8">
                <Zap className="w-4 h-4 mr-2" /> Anunciar Grátis
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* ─── CITIES ───────────────────────────────────────────────────────── */}
      <section className="bg-white py-10 border-y border-gray-100">
        <div className="container">
          <h2 className="section-heading text-center mb-2">
            Cidades e negocios da regiao
          </h2>
          <p className="text-gray-500 text-center mb-8">
            Um portal local pensado para conectar moradores, clientes e empresas
            do Norte Pioneiro do Parana
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {cities?.map(city => (
              <Link key={city.id} href={`/cidade/${city.slug}`}>
                <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors cursor-pointer">
                  <MapPin className="w-3.5 h-3.5" />
                  {city.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="container py-14">
        <h2 className="section-heading text-center mb-2">
          Como sua loja entra para o portal
        </h2>
        <p className="text-gray-500 text-center mb-10">
          Sem mudar sua rotina: voce cria presenca, exibe seus produtos e comeca
          a ser encontrado
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              icon: Users,
              title: "Crie sua conta",
              desc: "Cadastre sua empresa ou seu perfil em poucos minutos para fazer parte do portal local.",
              color: "bg-blue-500",
            },
            {
              step: "02",
              icon: Zap,
              title: "Monte sua vitrine",
              desc: "Publique produtos, servicos, fotos, descricao e informacoes para sua loja ser encontrada.",
              color: "bg-orange-500",
            },
            {
              step: "03",
              icon: TrendingUp,
              title: "Ganhe visibilidade",
              desc: "Apareca para quem busca no site e fortaleça sua presenca regional com mais alcance.",
              color: "bg-green-500",
            },
          ].map(item => {
            const IconComp = item.icon;
            return (
              <div key={item.step} className="text-center">
                <div
                  className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}
                >
                  <IconComp className="w-8 h-8 text-white" />
                </div>
                <div className="text-xs font-bold text-gray-400 mb-2">
                  PASSO {item.step}
                </div>
                <h3 className="font-display font-bold text-lg text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container pb-14">
        <div className="rounded-[32px] bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-600">
                Para empresas da regiao
              </div>
              <h2 className="mt-4 font-display text-3xl font-black text-gray-900">
                Sua loja precisa estar onde as pessoas procuram
              </h2>
              <p className="mt-3 text-gray-600">
                Crie sua presenca no portal, monte sua vitrine digital e
                publique produtos, servicos e contatos para ser encontrado por
                quem busca na sua cidade e na regiao.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Perfil publico da loja",
                "Vitrine com produtos e banner",
                "Contato rapido por WhatsApp",
                "Mais chances de descoberta local",
              ].map(item => (
                <div
                  key={item}
                  className="rounded-[22px] bg-gray-50 px-4 py-4 text-sm font-semibold text-gray-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── PLANS PREVIEW ────────────────────────────────────────────────── */}
      <section className="bg-gray-900 py-14">
        <div className="container">
          <h2 className="font-display text-3xl font-black text-white text-center mb-2">
            Planos e presença digital
          </h2>
          <p className="text-gray-400 text-center mb-10">
            Comece gratis, apareca no portal e cresca sua vitrine com mais
            destaque
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: "Gratis",
                price: "R$ 0",
                period: "30 dias",
                features: [
                  "5 anuncios",
                  "3 fotos por anuncio",
                  "Suporte basico",
                ],
                color: "border-gray-600",
                badge: null,
              },
              {
                name: "Profissional",
                price: "R$ 99,90",
                period: "/ano",
                features: [
                  "15 anuncios",
                  "8 fotos por anuncio",
                  "12 boosters de 24h/ano",
                  "Suporte prioritario",
                ],
                color: "border-blue-500",
                badge: "LANCAMENTO",
              },
              {
                name: "Premium",
                price: "R$ 129,90",
                period: "/ano",
                features: [
                  "Anuncios ilimitados",
                  "20 fotos por anuncio",
                  "24 boosters de 24h/ano",
                  "Acumula e usa quando quiser",
                ],
                color: "border-amber-400",
                badge: "MELHOR",
              },
            ].map(plan => (
              <div
                key={plan.name}
                className={`bg-gray-800 rounded-2xl p-6 border-2 ${plan.color} relative`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className={`text-xs font-black px-3 py-1 rounded-full ${plan.badge === "POPULAR" ? "bg-blue-500 text-white" : "bg-amber-400 text-gray-900"}`}
                    >
                      {plan.badge}
                    </span>
                  </div>
                )}
                <h3 className="font-display font-bold text-white text-xl mb-1">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-400 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-gray-300"
                    >
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/planos">
                  <Button
                    className={`w-full rounded-xl font-bold ${plan.badge === "MELHOR" ? "bg-amber-400 text-gray-900 hover:bg-amber-300" : plan.badge === "POPULAR" ? "bg-blue-500 text-white hover:bg-blue-400" : "bg-gray-700 text-white hover:bg-gray-600"}`}
                  >
                    {plan.name === "Grátis"
                      ? "Começar Grátis"
                      : "Assinar Agora"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BOOSTER CTA ──────────────────────────────────────────────────── */}
      <section className="container py-14">
        <div className="bg-orange-gradient rounded-3xl p-8 md:p-12 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-8 w-24 h-24 rounded-full border-4 border-white" />
            <div className="absolute bottom-4 right-8 w-16 h-16 rounded-full border-4 border-white" />
            <div className="absolute top-1/2 left-1/4 w-8 h-8 rounded-full bg-white" />
          </div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-black mb-3">
              Turbine sua vitrine com o Booster!
            </h2>
            <p className="text-orange-100 text-lg mb-6 max-w-xl mx-auto">
              Apareca no topo das buscas, ganhe destaque dentro do portal e
              aumente as chances de novos contatos e vendas.
            </p>
            <Link href={isAuthenticated ? "/anunciante" : LOGIN_ROUTE}>
              <Button className="bg-white text-orange-600 font-black px-10 py-4 text-lg rounded-2xl hover:bg-orange-50 shadow-xl">
                <Zap className="w-5 h-5 mr-2" />
                Ativar Booster Agora
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── TRUST SIGNALS ────────────────────────────────────────────────── */}
      <section className="bg-blue-50 py-10">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: "Portal confiavel",
                desc: "Um ambiente pensado para reunir negocios reais da regiao",
              },
              {
                icon: Zap,
                title: "Vitrine rapida",
                desc: "Sua loja ou anuncio pode entrar no ar em poucos minutos",
              },
              {
                icon: MapPin,
                title: "Presenca regional",
                desc: "Foco total em quem compra, vende e procura por perto",
              },
              {
                icon: BadgeCheck,
                title: "Mais descoberta",
                desc: "Produtos, perfis e servicos organizados para serem encontrados",
              },
            ].map(item => {
              const IconComp = item.icon;
              return (
                <div key={item.title} className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <IconComp className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-2xl md:hidden z-40">
        <div className="flex items-center justify-around py-2">
          <Link
            href="/"
            className="flex flex-col items-center gap-0.5 text-blue-600 px-3 py-1"
          >
            <Zap className="w-5 h-5" />
            <span className="text-xs font-medium">Início</span>
          </Link>
          <Link
            href="/busca"
            className="flex flex-col items-center gap-0.5 text-gray-500 px-3 py-1"
          >
            <Tag className="w-5 h-5" />
            <span className="text-xs">Buscar</span>
          </Link>
          <Link
            href={isAuthenticated ? "/anunciante/novo" : LOGIN_ROUTE}
            className="flex flex-col items-center gap-0.5 px-3 py-1"
          >
            <div className="w-12 h-12 bg-orange-gradient rounded-2xl flex items-center justify-center -mt-5 shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-orange-500 font-bold">Anunciar</span>
          </Link>
          <Link
            href="/favoritos"
            className="flex flex-col items-center gap-0.5 text-gray-500 px-3 py-1"
          >
            <Heart className="w-5 h-5" />
            <span className="text-xs">Favoritos</span>
          </Link>
          <Link
            href={isAuthenticated ? "/anunciante" : LOGIN_ROUTE}
            className="flex flex-col items-center gap-0.5 text-gray-500 px-3 py-1"
          >
            <Users className="w-5 h-5" />
            <span className="text-xs">Perfil</span>
          </Link>
        </div>
      </nav>
      <div className="h-16 md:hidden" />
    </div>
  );
}
