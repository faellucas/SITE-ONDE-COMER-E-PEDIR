import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  BadgeCheck,
  Building2,
  ChevronRight,
  Filter,
  MapPin,
  MessageCircle,
  Search,
  Store,
} from "lucide-react";

export default function StorefrontPage() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const numericSellerId = Number(sellerId);
  const [activeTab, setActiveTab] = useState<"inicio" | "produtos" | "contato">(
    "inicio"
  );
  const [sortBy, setSortBy] = useState<
    "destaque" | "recentes" | "menor-preco" | "maior-preco"
  >("destaque");
  const [activeCategory, setActiveCategory] = useState<string>("todas");

  const { data, isLoading } = trpc.public.sellerProfile.useQuery(
    { sellerId: numericSellerId },
    { enabled: Number.isFinite(numericSellerId) }
  );
  const { data: categories } = trpc.public.categories.useQuery();
  const { data: cities } = trpc.public.cities.useQuery();
  const seller = data?.seller ?? null;
  const listings = data?.listings ?? [];
  const displayName = seller
    ? seller.personType === "pj"
      ? seller.companyName || seller.name || "Loja"
      : seller.name || "Anunciante"
    : "Loja";
  const sellerInitial = displayName.charAt(0).toUpperCase();
  const coverImage =
    seller?.bannerUrl ||
    listings.flatMap(item => item.images ?? []).find(image => image.isPrimary)
      ?.url ||
    listings.flatMap(item => item.images ?? [])[0]?.url ||
    null;
  const cityName =
    (seller && cities?.find(city => city.id === seller.cityId)?.name) ||
    "Norte Pioneiro";
  const whatsappHref = seller?.whatsapp
    ? `https://wa.me/55${seller.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Ola! Vi sua vitrine no Norte Vivo e quero saber mais sobre seus produtos.`
      )}`
    : null;

  const categoryOptions = useMemo(() => {
    const seen = new Set<string>();
    return listings
      .map(item => ({
        id: String(item.categoryId ?? ""),
        label:
          categories?.find(category => category.id === item.categoryId)?.name ||
          item.subcategory ||
          "Outros",
      }))
      .filter(item => {
        if (!item.id || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
  }, [categories, listings]);

  const filteredListings = useMemo(() => {
    const base =
      activeCategory === "todas"
        ? listings
        : listings.filter(
            item => String(item.categoryId ?? "") === activeCategory
          );

    return [...base].sort((a, b) => {
      if (sortBy === "recentes") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (sortBy === "menor-preco") {
        return Number(a.price ?? 0) - Number(b.price ?? 0);
      }
      if (sortBy === "maior-preco") {
        return Number(b.price ?? 0) - Number(a.price ?? 0);
      }
      return Number(Boolean(b.isBoosted)) - Number(Boolean(a.isBoosted));
    });
  }, [activeCategory, listings, sortBy]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-64 rounded-[28px] bg-gray-200" />
            <div className="h-10 w-1/2 rounded bg-gray-200" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-56 rounded-2xl bg-gray-200" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!data?.seller) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container py-20 text-center">
          <Store className="mx-auto h-12 w-12 text-gray-300" />
          <h1 className="mt-4 font-display text-2xl font-bold text-gray-900">
            Vitrine nao encontrada
          </h1>
          <p className="mt-2 text-gray-500">
            Essa loja ainda nao tem uma vitrine publica disponivel.
          </p>
          <Link href="/busca">
            <Button className="mt-6 rounded-2xl bg-brand-gradient text-white">
              Voltar para a busca
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const storefrontSeller = seller!;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container py-6">
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">
            Inicio
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-gray-900">{displayName}</span>
        </div>

        <section className="overflow-hidden rounded-[28px] bg-white shadow-sm">
          <div className="relative h-56 bg-gray-100 sm:h-72">
            {coverImage ? (
              <img
                src={coverImage}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-hero-gradient" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-900/15 to-transparent" />
          </div>

          <div className="relative px-5 pb-6 sm:px-8">
            <div className="-mt-14 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-end gap-4">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border-4 border-white bg-white text-3xl font-black text-blue-700 shadow-lg">
                  {storefrontSeller.avatar ? (
                    <img
                      src={storefrontSeller.avatar}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    sellerInitial
                  )}
                </div>
                <div className="pb-2">
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-2xl font-black text-gray-900 sm:text-3xl">
                      {displayName}
                    </h1>
                    {storefrontSeller.isVerified && (
                      <BadgeCheck className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      Vitrine publica da loja
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {cityName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="rounded-2xl bg-green-500 px-6 text-white hover:bg-green-600">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Chat
                    </Button>
                  </a>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  Seguir loja
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="rounded-[24px] bg-gray-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                  Sobre a loja
                </p>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {storefrontSeller.bio?.trim() ||
                    "Esta loja faz parte do portal Norte Vivo e usa esta vitrine para mostrar seus produtos, servicos e oportunidades da regiao."}
                </p>
              </div>
              <div className="rounded-[24px] bg-blue-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                  Presenca no portal
                </p>
                <div className="mt-3 space-y-2 text-sm text-gray-700">
                  <p>{listings.length} item(ns) publicado(s)</p>
                  <p>
                    Membro desde{" "}
                    {new Date(storefrontSeller.createdAt).getFullYear()}
                  </p>
                  <p>Perfil publico da loja ativo</p>
                </div>
              </div>
              <div className="rounded-[24px] bg-orange-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
                  Atendimento
                </p>
                <div className="mt-3 space-y-2 text-sm text-gray-700">
                  <p>Contato rapido pelo WhatsApp</p>
                  <p>Produtos organizados por categoria</p>
                  <p>Vitrine publica para descoberta local</p>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "inicio", label: "Pagina principal" },
                  { id: "produtos", label: "Todos os produtos" },
                  { id: "contato", label: "Contato" },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() =>
                      setActiveTab(tab.id as "inicio" | "produtos" | "contato")
                    }
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      activeTab === tab.id
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-gray-900">
                Produtos e anuncios da loja
              </h2>
              <p className="text-sm text-gray-500">
                Tudo o que {displayName} publicou dentro do portal.
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600 shadow-sm">
              {listings.length} item(ns)
            </span>
          </div>

          {activeTab === "inicio" && (
            <div className="grid gap-4 lg:grid-cols-[0.28fr_0.72fr]">
              <aside className="rounded-[24px] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Filter className="h-4 w-4 text-blue-600" />
                  <p className="font-semibold text-gray-900">Categoria</p>
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("todas")}
                    className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                      activeCategory === "todas"
                        ? "bg-orange-50 text-orange-600"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Todos os produtos
                  </button>
                  {categoryOptions.map(option => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setActiveCategory(option.id)}
                      className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                        activeCategory === option.id
                          ? "bg-orange-50 text-orange-600"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </aside>

              <div className="space-y-4">
                <div className="rounded-[24px] bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Search className="h-4 w-4" />
                      Produtos organizados para ajudar o cliente a encontrar o
                      que precisa
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "destaque", label: "Em destaque" },
                        { id: "recentes", label: "Mais recentes" },
                        { id: "menor-preco", label: "Menor preco" },
                        { id: "maior-preco", label: "Maior preco" },
                      ].map(option => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            setSortBy(
                              option.id as
                                | "destaque"
                                | "recentes"
                                | "menor-preco"
                                | "maior-preco"
                            )
                          }
                          className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                            sortBy === option.id
                              ? "bg-orange-500 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {filteredListings.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                    {filteredListings.map(item => (
                      <ListingCard
                        key={item.id}
                        {...item}
                        cityName={
                          cities?.find(city => city.id === item.cityId)?.name
                        }
                        categoryName={
                          categories?.find(
                            category => category.id === item.categoryId
                          )?.name
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[24px] bg-white p-10 text-center shadow-sm">
                    <Store className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-4 text-gray-500">
                      Nenhum item encontrado para este filtro.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "produtos" &&
            (filteredListings.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {filteredListings.map(item => (
                  <ListingCard
                    key={item.id}
                    {...item}
                    cityName={
                      cities?.find(city => city.id === item.cityId)?.name
                    }
                    categoryName={
                      categories?.find(
                        category => category.id === item.categoryId
                      )?.name
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] bg-white p-10 text-center shadow-sm">
                <Store className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-4 text-gray-500">
                  Esta loja ainda nao publicou itens na vitrine.
                </p>
              </div>
            ))}

          {activeTab === "contato" && (
            <div className="rounded-[24px] bg-white p-6 shadow-sm">
              <h3 className="font-display text-xl font-bold text-gray-900">
                Fale com a loja
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Entre em contato para tirar duvidas, pedir orcamentos ou saber
                mais sobre os produtos da vitrine.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="rounded-2xl bg-green-500 text-white hover:bg-green-600">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Chamar no WhatsApp
                    </Button>
                  </a>
                )}
                <Link href="/busca">
                  <Button variant="outline" className="rounded-2xl">
                    Voltar para o portal
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
