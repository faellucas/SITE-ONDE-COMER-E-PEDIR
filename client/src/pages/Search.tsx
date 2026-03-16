import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import { getSubcategoryOptionsBySlug } from "@/lib/listingSubcategories";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  ChevronDown,
  Filter,
  LayoutGrid,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Store,
  Tag,
  X,
} from "lucide-react";

const TYPE_OPTIONS = [
  { value: "product", label: "Produto" },
  { value: "service", label: "Servico" },
  { value: "vehicle", label: "Veiculo" },
  { value: "property", label: "Imovel" },
  { value: "food", label: "Comida" },
  { value: "job", label: "Emprego" },
];

export default function SearchPage() {
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const [, navigate] = useLocation();

  const [q, setQ] = useState(params.get("q") || "");
  const [cityId, setCityId] = useState<number | null>(
    params.get("city") ? Number(params.get("city")) : null
  );
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [subcategory, setSubcategory] = useState("");
  const [type, setType] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const { data: cities } = trpc.public.cities.useQuery();
  const { data: categories } = trpc.public.categories.useQuery();
  const selectedCategory = categories?.find(category => category.id === categoryId);
  const subcategoryOptions = getSubcategoryOptionsBySlug(selectedCategory?.slug);

  const { data: results, isLoading } = trpc.public.searchListings.useQuery({
    q: q || undefined,
    cityId: cityId || undefined,
    categoryId: categoryId || undefined,
    subcategory: subcategory || undefined,
    type: (type as any) || undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 50000 ? priceRange[1] : undefined,
    page,
    limit: 20,
  });

  const activeFilterCount = [
    q,
    cityId,
    categoryId,
    subcategory,
    type,
    priceRange[0] > 0 || priceRange[1] < 50000 ? "price" : "",
  ].filter(Boolean).length;

  const handleSearch = (event?: React.FormEvent) => {
    event?.preventDefault();
    setPage(1);
    navigate(
      `/busca?q=${encodeURIComponent(q)}&city=${cityId || ""}`
    );
  };

  const clearFilters = () => {
    setQ("");
    setCategoryId(null);
    setSubcategory("");
    setCityId(null);
    setType("");
    setPriceRange([0, 50000]);
    setPage(1);
  };

  useEffect(() => {
    if (!subcategoryOptions.length) {
      setSubcategory("");
      return;
    }

    if (subcategoryOptions.includes(subcategory)) return;
    setSubcategory("");
  }, [subcategory, subcategoryOptions]);

  const filterBadges = useMemo(
    () => [
      q
        ? {
            id: "q",
            label: `"${q}"`,
            clear: () => setQ(""),
          }
        : null,
      cityId
        ? {
            id: "city",
            label: cities?.find(city => city.id === cityId)?.name || "Cidade",
            clear: () => setCityId(null),
          }
        : null,
      categoryId
        ? {
            id: "category",
            label:
              categories?.find(category => category.id === categoryId)?.name ||
              "Categoria",
            clear: () => setCategoryId(null),
          }
        : null,
      subcategory
        ? {
            id: "subcategory",
            label: subcategory,
            clear: () => setSubcategory(""),
          }
        : null,
      type
        ? {
            id: "type",
            label:
              TYPE_OPTIONS.find(option => option.value === type)?.label || type,
            clear: () => setType(""),
          }
        : null,
    ].filter(Boolean),
    [categories, cities, cityId, categoryId, q, subcategory, type]
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff8ef_0%,#f8fafc_32%,#f8fafc_100%)]">
      <Header
        selectedCity={cityId}
        onCityChange={setCityId}
        onSearch={value => {
          setQ(value);
          setPage(1);
        }}
      />

      <main className="container py-6">
        <section className="rounded-[32px] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_45%,#f97316_125%)] p-5 text-white shadow-[0_20px_70px_rgba(15,23,42,0.18)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4" />
                Marketplace do Norte Vivo
              </div>
              <h1 className="mt-4 font-display text-4xl font-black leading-tight sm:text-5xl">
                Encontre produtos, servicos e oportunidades da sua regiao.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-blue-50/90">
                Busca forte, filtros claros e resultados com mais cara de
                marketplace.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-2xl font-black text-white">
                  {results?.total ?? 0}
                </p>
                <p className="text-sm text-blue-100">Resultados</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-2xl font-black text-white">
                  {categories?.length ?? 0}
                </p>
                <p className="text-sm text-blue-100">Categorias</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-2xl font-black text-white">
                  {activeFilterCount}
                </p>
                <p className="text-sm text-blue-100">Filtros ativos</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 xl:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={q}
                onChange={event => setQ(event.target.value)}
                placeholder="O que voce esta buscando?"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-orange-300 focus:bg-white"
              />
            </div>
            <Button
              type="submit"
              className="rounded-2xl bg-brand-gradient px-6 text-white"
            >
              Buscar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={() => setShowFilters(current => !current)}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filtros
              {activeFilterCount > 0 && (
                <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                  {activeFilterCount}
                </span>
              )}
              {showFilters ? (
                <X className="ml-2 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          </form>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className={`${showFilters ? "block" : "hidden"} lg:block`}>
            <div className="sticky top-24 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-2xl bg-orange-50 p-2 text-orange-600">
                    <Filter className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Filtros</p>
                    <p className="text-xs text-slate-500">
                      Refine sua busca
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-slate-500 lg:hidden"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-5 space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Categoria
                  </label>
                  <Select
                    value={categoryId ? String(categoryId) : "all"}
                    onValueChange={value =>
                      setCategoryId(value === "all" ? null : Number(value))
                    }
                  >
                    <SelectTrigger className="rounded-2xl">
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories?.map(category => (
                        <SelectItem
                          key={category.id}
                          value={String(category.id)}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Cidade
                  </label>
                  <Select
                    value={cityId ? String(cityId) : "all"}
                    onValueChange={value =>
                      setCityId(value === "all" ? null : Number(value))
                    }
                  >
                    <SelectTrigger className="rounded-2xl">
                      <SelectValue placeholder="Todas as cidades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as cidades</SelectItem>
                      {cities?.map(city => (
                        <SelectItem key={city.id} value={String(city.id)}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Subcategoria
                  </label>
                  <Select
                    value={subcategory || "all"}
                    onValueChange={value =>
                      setSubcategory(value === "all" ? "" : value)
                    }
                    disabled={!subcategoryOptions.length}
                  >
                    <SelectTrigger className="rounded-2xl">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {subcategoryOptions.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Tipo
                  </label>
                  <Select
                    value={type || "all"}
                    onValueChange={value => setType(value === "all" ? "" : value)}
                  >
                    <SelectTrigger className="rounded-2xl">
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {TYPE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Faixa de preco
                  </label>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-700">
                      R$ {priceRange[0].toLocaleString("pt-BR")} -{" "}
                      {priceRange[1] >= 50000
                        ? "Qualquer valor"
                        : `R$ ${priceRange[1].toLocaleString("pt-BR")}`}
                    </p>
                    <Slider
                      min={0}
                      max={50000}
                      step={100}
                      value={priceRange}
                      onValueChange={value =>
                        setPriceRange(value as [number, number])
                      }
                      className="mt-4"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Button
                    type="button"
                    onClick={() => handleSearch()}
                    className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800"
                  >
                    Aplicar filtros
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearFilters}
                    className="rounded-2xl"
                  >
                    Limpar tudo
                  </Button>
                </div>
              </div>
            </div>
          </aside>

          <section>
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-2xl bg-blue-50 p-2 text-blue-600">
                      <LayoutGrid className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        Resultados da busca
                      </p>
                      <p className="text-sm text-slate-500">
                        {isLoading
                          ? "Buscando anuncios..."
                          : `${results?.total || 0} resultado(s) encontrado(s)`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {filterBadges.map(filter => (
                    <span
                      key={filter!.id}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      {filter!.label}
                      <button type="button" onClick={filter!.clear}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="inline-flex rounded-2xl bg-white p-2 text-orange-600 shadow-sm">
                    <Tag className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Foque no visual
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    A imagem principal ajuda o usuario a decidir mais rapido.
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="inline-flex rounded-2xl bg-white p-2 text-blue-600 shadow-sm">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Procure por cidade
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Resultados locais tendem a converter mais.
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="inline-flex rounded-2xl bg-white p-2 text-emerald-600 shadow-sm">
                    <Store className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Misture produto e negocio
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Buscas por loja, servico e produto convivem melhor aqui.
                  </p>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="overflow-hidden rounded-[28px] bg-white shadow-sm">
                    <div className="aspect-[4/3] animate-pulse bg-slate-200" />
                    <div className="space-y-2 p-4">
                      <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
                      <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results?.items && results.items.length > 0 ? (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {results.items.map(listing => (
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
            ) : (
              <div className="mt-5 rounded-[28px] border border-dashed border-slate-200 bg-white p-14 text-center shadow-sm">
                <Search className="mx-auto h-14 w-14 text-slate-300" />
                <h3 className="mt-4 font-display text-2xl font-bold text-slate-900">
                  Nenhum resultado encontrado
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Tente outro termo, outra cidade ou remova alguns filtros.
                </p>
                <Button
                  variant="outline"
                  className="mt-5 rounded-2xl"
                  onClick={clearFilters}
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpar busca
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
