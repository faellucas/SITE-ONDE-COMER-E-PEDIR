import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { LOGIN_ROUTE } from "@/const";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  Utensils, ShoppingBag, ShoppingCart, Shirt, Home as HomeIcon, Hammer, Car, Building2, Briefcase, HardHat, Heart, PawPrint, Tractor, Smartphone, Users, Calendar,
  Tag, Wrench, Cross, Zap, ArrowRight, Star, TrendingUp, Shield, CheckCircle,
  ChevronRight, MapPin, BadgeCheck, BarChart3
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils, ShoppingBag, ShoppingCart, Shirt, HomeIcon, Hammer, Car, Building2, Briefcase, HardHat, Heart, PawPrint, Tractor, Smartphone, Users, Calendar,
  Tag, Wrench, Cross, Zap,
};

const CATEGORY_COLORS: Record<string, string> = {
  "onde-comer": "bg-red-50 text-red-600 hover:bg-red-100",
  "delivery": "bg-orange-50 text-orange-600 hover:bg-orange-100",
  "mercados": "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
  "farmacia": "bg-blue-50 text-blue-600 hover:bg-blue-100",
  "moda-acessorios": "bg-pink-50 text-pink-600 hover:bg-pink-100",
  "casa-moveis": "bg-purple-50 text-purple-600 hover:bg-purple-100",
  "construcao": "bg-amber-50 text-amber-600 hover:bg-amber-100",
  "autopecas": "bg-gray-50 text-gray-600 hover:bg-gray-100",
  "veiculos": "bg-blue-50 text-blue-700 hover:bg-blue-100",
  "imoveis": "bg-teal-50 text-teal-600 hover:bg-teal-100",
  "servicos-gerais": "bg-violet-50 text-violet-600 hover:bg-violet-100",
  "mao-de-obra": "bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
  "saude-beleza": "bg-rose-50 text-rose-600 hover:bg-rose-100",
  "pets": "bg-green-50 text-green-600 hover:bg-green-100",
  "agro-rural": "bg-lime-50 text-lime-700 hover:bg-lime-100",
  "eletronicos": "bg-cyan-50 text-cyan-600 hover:bg-cyan-100",
  "empregos": "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
  "eventos": "bg-fuchsia-50 text-fuchsia-600 hover:bg-fuchsia-100",
  "classificados": "bg-slate-50 text-slate-600 hover:bg-slate-100",
};

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [categoryCarouselApi, setCategoryCarouselApi] = useState<CarouselApi>();

  const { data: categories } = trpc.public.categories.useQuery();
  const { data: topCategories } = trpc.public.topCategories.useQuery({ limit: 10 });
  const { data: cities } = trpc.public.cities.useQuery();
  const { data: featured } = trpc.public.featuredListings.useQuery({ limit: 8, cityId: selectedCity ?? undefined });
  const { data: recent } = trpc.public.recentListings.useQuery({ limit: 16, cityId: selectedCity ?? undefined });
  const { data: foodListings } = trpc.public.listingsByCategory.useQuery({ categorySlug: "onde-comer", limit: 6 });
  const { data: deliveryListings } = trpc.public.listingsByCategory.useQuery({ categorySlug: "delivery", limit: 6 });

  const handleSearch = (q: string) => {
    navigate(`/busca?q=${encodeURIComponent(q)}&city=${selectedCity || ""}`);
  };

  const cityName = cities?.find(c => c.id === selectedCity)?.name;
  const featuredCategories = topCategories?.length ? topCategories : categories?.slice(0, 10);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header selectedCity={selectedCity} onCityChange={setSelectedCity} onSearch={handleSearch} />

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="bg-hero-gradient text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, white, transparent)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, white, transparent)", transform: "translate(-30%, 30%)" }} />

        <div className="container py-16 md:py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium mb-6 border border-white/20">
              <MapPin className="w-4 h-4" />
              Norte Pioneiro do Paraná
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-black leading-tight mb-4">
              Compre, venda e anuncie
              <span className="block" style={{ color: "oklch(0.82 0.18 85)" }}>no Norte Pioneiro</span>
            </h1>
            <p className="text-blue-100 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              O marketplace regional de Ibaiti e toda a região. Produtos, serviços, imóveis, veículos e muito mais — tudo perto de você.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-6 mb-10">
              {[
                { label: "Cidades", value: "17+" },
                { label: "Categorias", value: "19" },
                { label: "Cadastro", value: "Grátis" },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <div className="font-display text-2xl font-black text-white">{stat.value}</div>
                  <div className="text-blue-200 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={isAuthenticated ? "/anunciante/novo" : LOGIN_ROUTE}>
                <Button className="bg-orange-gradient text-white font-bold px-8 py-6 text-lg rounded-2xl shadow-xl hover:opacity-90 transition-opacity">
                  <Zap className="w-5 h-5 mr-2" />
                  Anunciar Grátis
                </Button>
              </Link>
              <Link href="/busca">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-6 text-lg rounded-2xl bg-transparent">
                  Ver Anúncios
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="#F9FAFB"/>
          </svg>
        </div>
      </section>

      {/* ─── CATEGORIES ───────────────────────────────────────────────────── */}
      <section className="container py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="section-heading">Explorar por Categoria</h2>
            <p className="text-sm text-gray-500">Slide autom&aacute;tico com as 10 categorias mais visitadas no site.</p>
          </div>
          <Link href="/busca" className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:gap-2 transition-all">
            Ver todas <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <Carousel
          setApi={setCategoryCarouselApi}
          opts={{
            align: "start",
            loop: (featuredCategories?.length ?? 0) > 4,
            dragFree: true,
          }}
          className="relative"
        >
          <CarouselContent className="-ml-3">
            {featuredCategories?.map(cat => {
            const IconComp = ICON_MAP[cat.icon || "Tag"] || Tag;
            const colorClass = CATEGORY_COLORS[cat.slug] || "bg-gray-50 text-gray-600 hover:bg-gray-100";
            return (
              <CarouselItem key={cat.id} className="pl-3 basis-[78%] xs:basis-[45%] md:basis-[30%] lg:basis-[22%] xl:basis-[18%]">
                <Link href={`/categoria/${cat.slug}`}>
                  <div className={`h-full rounded-[22px] border border-white bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${colorClass}`}>
                    <div className="mb-4 flex items-start justify-between">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl"
                        style={{ background: cat.color ? `${cat.color}20` : undefined }}
                      >
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div className="flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-semibold">
                        <BarChart3 className="h-3 w-3" />
                        {cat.viewCount ?? 0}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold text-sm leading-tight">{cat.name}</div>
                      <div className="text-xs opacity-75">Mais acessadas agora</div>
                    </div>
                  </div>
                </Link>
              </CarouselItem>
            );
          })}
          </CarouselContent>
        </Carousel>
      </section>

      {/* ─── FEATURED (BOOSTED) ───────────────────────────────────────────── */}
      {featured && featured.length > 0 && (
        <section className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-400 rounded-xl flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h2 className="section-heading">Anúncios em Destaque</h2>
            </div>
            <Link href="/busca?boost=true" className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:gap-2 transition-all">
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {featured.map(listing => (
              <ListingCard
                key={listing.id}
                {...listing}
                cityName={cities?.find(c => c.id === listing.cityId)?.name}
                categoryName={categories?.find(c => c.id === listing.categoryId)?.name}
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── ONDE COMER ───────────────────────────────────────────────────── */}
      <section className="bg-red-50 py-10">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center">
                <Utensils className="w-4 h-4 text-white" />
              </div>
              <h2 className="section-heading">Onde Comer</h2>
            </div>
            <Link href="/categoria/onde-comer" className="text-sm text-red-600 font-medium flex items-center gap-1 hover:gap-2 transition-all">
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {foodListings && foodListings.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {foodListings.map(listing => (
                <ListingCard key={listing.id} {...listing} cityName={cities?.find(c => c.id === listing.cityId)?.name} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl">
              <Utensils className="w-12 h-12 text-red-200 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">Seja o primeiro a anunciar nesta categoria!</p>
              <Link href={isAuthenticated ? "/anunciante/novo" : LOGIN_ROUTE}>
                <Button className="bg-red-500 text-white rounded-xl hover:bg-red-600">Anunciar Grátis</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─── DELIVERY ─────────────────────────────────────────────────────── */}
      <section className="bg-orange-50 py-10">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <h2 className="section-heading">Delivery & Pedidos</h2>
            </div>
            <Link href="/categoria/delivery" className="text-sm text-orange-600 font-medium flex items-center gap-1 hover:gap-2 transition-all">
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {deliveryListings && deliveryListings.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {deliveryListings.map(listing => (
                <ListingCard key={listing.id} {...listing} cityName={cities?.find(c => c.id === listing.cityId)?.name} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl">
              <ShoppingBag className="w-12 h-12 text-orange-200 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">Nenhum delivery cadastrado ainda. Seja o primeiro!</p>
              <Link href={isAuthenticated ? "/anunciante/novo" : LOGIN_ROUTE}>
                <Button className="bg-orange-500 text-white rounded-xl hover:bg-orange-600">Anunciar Grátis</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─── RECENT LISTINGS ──────────────────────────────────────────────── */}
      <section className="container py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-gradient rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <h2 className="section-heading">
              Anúncios Recentes
              {cityName && <span className="text-blue-600 ml-2">— {cityName}</span>}
            </h2>
          </div>
          <Link href="/busca" className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:gap-2 transition-all">
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
                categoryName={categories?.find(c => c.id === listing.categoryId)?.name}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="font-display font-bold text-gray-700 text-lg mb-2">Nenhum anúncio ainda</h3>
            <p className="text-gray-500 mb-6">Seja o primeiro a anunciar no Norte Vivo!</p>
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
          <h2 className="section-heading text-center mb-2">Cidades Atendidas</h2>
          <p className="text-gray-500 text-center mb-8">Presente em toda a região do Norte Pioneiro do Paraná</p>
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
        <h2 className="section-heading text-center mb-2">Como Funciona</h2>
        <p className="text-gray-500 text-center mb-10">Simples, rápido e gratuito para começar</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: "01", icon: Users, title: "Crie sua conta", desc: "Cadastre-se gratuitamente em menos de 1 minuto. Pessoa física ou jurídica.", color: "bg-blue-500" },
            { step: "02", icon: Zap, title: "Publique seu anúncio", desc: "Adicione fotos, descrição e preço. Seu anúncio fica ativo por 30 dias grátis.", color: "bg-orange-500" },
            { step: "03", icon: TrendingUp, title: "Turbine com Booster", desc: "Destaque seu anúncio e receba muito mais contatos e visualizações.", color: "bg-green-500" },
          ].map(item => {
            const IconComp = item.icon;
            return (
              <div key={item.step} className="text-center">
                <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <IconComp className="w-8 h-8 text-white" />
                </div>
                <div className="text-xs font-bold text-gray-400 mb-2">PASSO {item.step}</div>
                <h3 className="font-display font-bold text-lg text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── PLANS PREVIEW ────────────────────────────────────────────────── */}
      <section className="bg-gray-900 py-14">
        <div className="container">
          <h2 className="font-display text-3xl font-black text-white text-center mb-2">Planos e Preços</h2>
          <p className="text-gray-400 text-center mb-10">Comece grátis, cresça com o Norte Vivo</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: "Gratis", price: "R$ 0", period: "30 dias", features: ["5 anuncios", "3 fotos por anuncio", "Suporte basico"], color: "border-gray-600", badge: null },
              { name: "Profissional", price: "R$ 99,90", period: "/ano", features: ["15 anuncios", "8 fotos por anuncio", "12 boosters de 24h/ano", "Suporte prioritario"], color: "border-blue-500", badge: "LANCAMENTO" },
              { name: "Premium", price: "R$ 129,90", period: "/ano", features: ["Anuncios ilimitados", "20 fotos por anuncio", "24 boosters de 24h/ano", "Acumula e usa quando quiser"], color: "border-amber-400", badge: "MELHOR" },
            ].map(plan => (
              <div key={plan.name} className={`bg-gray-800 rounded-2xl p-6 border-2 ${plan.color} relative`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`text-xs font-black px-3 py-1 rounded-full ${plan.badge === "POPULAR" ? "bg-blue-500 text-white" : "bg-amber-400 text-gray-900"}`}>
                      {plan.badge}
                    </span>
                  </div>
                )}
                <h3 className="font-display font-bold text-white text-xl mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black text-white">{plan.price}</span>
                  <span className="text-gray-400 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/planos">
                  <Button className={`w-full rounded-xl font-bold ${plan.badge === "MELHOR" ? "bg-amber-400 text-gray-900 hover:bg-amber-300" : plan.badge === "POPULAR" ? "bg-blue-500 text-white hover:bg-blue-400" : "bg-gray-700 text-white hover:bg-gray-600"}`}>
                    {plan.name === "Grátis" ? "Começar Grátis" : "Assinar Agora"}
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
              Turbine seu anúncio com o Booster!
            </h2>
            <p className="text-orange-100 text-lg mb-6 max-w-xl mx-auto">
              Apareça no topo das buscas, ganhe destaque na home e receba até 10x mais contatos. A partir de R$ 19,90.
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
              { icon: Shield, title: "100% Seguro", desc: "Plataforma verificada e confiável" },
              { icon: Zap, title: "Rápido e Fácil", desc: "Anuncie em menos de 5 minutos" },
              { icon: MapPin, title: "Regional", desc: "Foco no Norte Pioneiro do PR" },
              { icon: BadgeCheck, title: "Verificado", desc: "Anunciantes com selo de confiança" },
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
          <Link href="/" className="flex flex-col items-center gap-0.5 text-blue-600 px-3 py-1">
            <Zap className="w-5 h-5" />
            <span className="text-xs font-medium">Início</span>
          </Link>
          <Link href="/busca" className="flex flex-col items-center gap-0.5 text-gray-500 px-3 py-1">
            <Tag className="w-5 h-5" />
            <span className="text-xs">Buscar</span>
          </Link>
          <Link href={isAuthenticated ? "/anunciante/novo" : LOGIN_ROUTE} className="flex flex-col items-center gap-0.5 px-3 py-1">
            <div className="w-12 h-12 bg-orange-gradient rounded-2xl flex items-center justify-center -mt-5 shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-orange-500 font-bold">Anunciar</span>
          </Link>
          <Link href="/favoritos" className="flex flex-col items-center gap-0.5 text-gray-500 px-3 py-1">
            <Heart className="w-5 h-5" />
            <span className="text-xs">Favoritos</span>
          </Link>
          <Link href={isAuthenticated ? "/anunciante" : LOGIN_ROUTE} className="flex flex-col items-center gap-0.5 text-gray-500 px-3 py-1">
            <Users className="w-5 h-5" />
            <span className="text-xs">Perfil</span>
          </Link>
        </div>
      </nav>
      <div className="h-16 md:hidden" />
    </div>
  );
}
