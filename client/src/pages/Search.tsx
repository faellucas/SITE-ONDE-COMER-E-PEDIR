import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import { getSubcategoryOptionsBySlug } from "@/lib/listingSubcategories";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Filter, SlidersHorizontal, X, Search, ChevronDown } from "lucide-react";

export default function SearchPage() {
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const [, navigate] = useLocation();

  const [q, setQ] = useState(params.get("q") || "");
  const [cityId, setCityId] = useState<number | null>(params.get("city") ? Number(params.get("city")) : null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [subcategory, setSubcategory] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const { data: cities } = trpc.public.cities.useQuery();
  const { data: categories } = trpc.public.categories.useQuery();
  const selectedCategory = categories?.find(c => c.id === categoryId);
  const subcategoryOptions = getSubcategoryOptionsBySlug(selectedCategory?.slug);
  const { data: results, isLoading } = trpc.public.searchListings.useQuery({
    q: q || undefined,
    cityId: cityId || undefined,
    categoryId: categoryId || undefined,
    subcategory: subcategory || undefined,
    type: type as any || undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 50000 ? priceRange[1] : undefined,
    page,
    limit: 20,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header selectedCity={cityId} onCityChange={setCityId} onSearch={(v) => { setQ(v); setPage(1); }} />

      <div className="container py-6">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="O que você está buscando?"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button type="submit" className="bg-brand-gradient text-white rounded-xl px-6">Buscar</Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-gray-200"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filtros
            {showFilters ? <X className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
          </Button>
        </form>

        {/* Filters panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-2 block">Categoria</label>
                <Select value={categoryId ? String(categoryId) : "all"} onValueChange={v => setCategoryId(v === "all" ? null : Number(v))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-2 block">Cidade</label>
                <Select value={cityId ? String(cityId) : "all"} onValueChange={v => setCityId(v === "all" ? null : Number(v))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Todas as cidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as cidades</SelectItem>
                    {cities?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-2 block">Subcategoria</label>
                <Select
                  value={subcategory || "all"}
                  onValueChange={v => setSubcategory(v === "all" ? "" : v)}
                  disabled={!subcategoryOptions.length}
                >
                  <SelectTrigger className="rounded-xl">
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
                <label className="text-xs font-semibold text-gray-500 mb-2 block">Tipo</label>
                <Select value={type || "all"} onValueChange={v => setType(v === "all" ? "" : v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="product">Produto</SelectItem>
                    <SelectItem value="service">Serviço</SelectItem>
                    <SelectItem value="vehicle">Veículo</SelectItem>
                    <SelectItem value="property">Imóvel</SelectItem>
                    <SelectItem value="food">Comida</SelectItem>
                    <SelectItem value="job">Emprego</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-2 block">
                  Preço: R$ {priceRange[0].toLocaleString()} — R$ {priceRange[1] >= 50000 ? "Qualquer" : priceRange[1].toLocaleString()}
                </label>
                <Slider
                  min={0}
                  max={50000}
                  step={100}
                  value={priceRange}
                  onValueChange={(v) => setPriceRange(v as [number, number])}
                  className="mt-3"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => { setCategoryId(null); setSubcategory(""); setCityId(null); setType(""); setPriceRange([0, 50000]); setQ(""); }}
              >
                <X className="w-3 h-3 mr-1" /> Limpar filtros
              </Button>
            </div>
          </div>
        )}

        {/* Active filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {q && <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1">"{q}" <button onClick={() => setQ("")}><X className="w-3 h-3" /></button></span>}
          {cityId && <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1">{cities?.find(c => c.id === cityId)?.name} <button onClick={() => setCityId(null)}><X className="w-3 h-3" /></button></span>}
          {categoryId && <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1">{categories?.find(c => c.id === categoryId)?.name} <button onClick={() => setCategoryId(null)}><X className="w-3 h-3" /></button></span>}
          {subcategory && <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1">{subcategory} <button onClick={() => setSubcategory("")}><X className="w-3 h-3" /></button></span>}
        </div>

        {/* Results */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {isLoading ? "Buscando..." : `${results?.total || 0} resultado(s) encontrado(s)`}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : results?.items && results.items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results.items.map(listing => (
              <ListingCard
                key={listing.id}
                {...listing}
                cityName={cities?.find(c => c.id === listing.cityId)?.name}
                categoryName={categories?.find(c => c.id === listing.categoryId)?.name}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl">
            <Search className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="font-display font-bold text-gray-700 text-xl mb-2">Nenhum resultado encontrado</h3>
            <p className="text-gray-500 mb-6">Tente outros termos ou remova alguns filtros</p>
            <Button variant="outline" className="rounded-xl" onClick={() => { setQ(""); setCategoryId(null); setSubcategory(""); setCityId(null); setType(""); }}>
              <X className="w-4 h-4 mr-2" /> Limpar busca
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
