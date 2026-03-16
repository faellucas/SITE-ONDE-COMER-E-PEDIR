import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { LOGIN_ROUTE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Briefcase,
  ChevronDown,
  Heart,
  HeartHandshake,
  Home,
  LayoutDashboard,
  LogOut,
  MapPin,
  Plus,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  Store,
  Stethoscope,
  User,
  Wrench,
  Zap,
} from "lucide-react";

interface HeaderProps {
  selectedCity?: number | null;
  onCityChange?: (cityId: number | null) => void;
  onSearch?: (q: string) => void;
}

const HEADER_SHORTCUTS = [
  { label: "Guia Local", href: "/guia" },
  { label: "Marketplace", href: "/busca" },
  { label: "Lojas", href: "/lojas" },
];

const HEADER_PILLS = [
  { label: "Saude", href: "/busca?q=saude", icon: Stethoscope, tone: "bg-emerald-50 text-emerald-700" },
  { label: "Educacao", href: "/busca?q=educacao", icon: Briefcase, tone: "bg-orange-50 text-orange-700" },
  { label: "Delivery", href: "/categoria/delivery", icon: ShoppingBag, tone: "bg-amber-50 text-amber-700" },
  { label: "Imoveis", href: "/busca?q=imoveis", icon: Home, tone: "bg-cyan-50 text-cyan-700" },
  { label: "Veiculos", href: "/busca?q=veiculos", icon: Zap, tone: "bg-blue-50 text-blue-700" },
  { label: "Servicos", href: "/busca?q=servicos", icon: Wrench, tone: "bg-violet-50 text-violet-700" },
  { label: "Lojas", href: "/lojas", icon: Store, tone: "bg-blue-50 text-blue-700" },
  { label: "Guia", href: "/guia", icon: HeartHandshake, tone: "bg-indigo-50 text-indigo-700" },
];

export default function Header({
  selectedCity,
  onCityChange,
  onSearch,
}: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [searchQ, setSearchQ] = useState("");
  const [animatedQuery, setAnimatedQuery] = useState("");
  const [animatedIndex, setAnimatedIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const displayName =
    user?.personType === "pj"
      ? user?.companyName || user?.name || "Loja"
      : user?.name || "Usuario";
  const displayInitial = displayName.charAt(0)?.toUpperCase() || "U";

  const { data: cities } = trpc.public.cities.useQuery();
  const { data: categories } = trpc.public.categories.useQuery();

  const searchSuggestions = useMemo(() => {
    const categorySuggestions = (categories ?? []).map(category => category.name);
    const fallbackSuggestions = [
      "carro",
      "delivery",
      "imoveis",
      "saude",
      "servicos",
    ];

    return Array.from(new Set([...categorySuggestions, ...fallbackSuggestions])).slice(0, 8);
  }, [categories]);

  useEffect(() => {
    if (!searchSuggestions.length) return;

    const currentWord = searchSuggestions[animatedIndex % searchSuggestions.length];

    const timeout = window.setTimeout(
      () => {
        if (!isDeleting) {
          const nextValue = currentWord.slice(0, animatedQuery.length + 1);
          setAnimatedQuery(nextValue);

          if (nextValue === currentWord) {
            setIsDeleting(true);
          }
          return;
        }

        const nextValue = currentWord.slice(0, Math.max(animatedQuery.length - 1, 0));
        setAnimatedQuery(nextValue);

        if (nextValue.length === 0) {
          setIsDeleting(false);
          setAnimatedIndex(current => (current + 1) % searchSuggestions.length);
        }
      },
      !isDeleting
        ? animatedQuery.length === currentWord.length
          ? 1200
          : 90
        : 45
    );

    return () => window.clearTimeout(timeout);
  }, [animatedIndex, animatedQuery, isDeleting, searchSuggestions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(searchQ);
    else navigate(`/busca?q=${encodeURIComponent(searchQ)}`);
  };

  const searchPlaceholder = `Buscar "${animatedQuery || searchSuggestions[0] || "produto"}"`;

  return (
    <header className="sticky top-0 z-50 max-w-full overflow-x-clip border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container">
        <div className="hidden items-center gap-4 py-3 xl:flex">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gradient shadow-md">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-display text-xl font-black text-gray-900">
                Norte
              </span>
              <span
                className="font-display text-xl font-black"
                style={{ color: "oklch(0.68 0.19 45)" }}
              >
                Vivo
              </span>
            </div>
          </Link>

          <form onSubmit={handleSearch} className="min-w-0 max-w-4xl flex-1">
            <div className="flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-sm text-slate-700 outline-none"
                />
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <Select
                value={selectedCity ? String(selectedCity) : "all"}
                onValueChange={value =>
                  onCityChange?.(value === "all" ? null : Number(value))
                }
              >
                <SelectTrigger className="h-12 w-[170px] border-0 bg-transparent px-3 text-sm font-medium text-slate-700 shadow-none focus:ring-0">
                  <MapPin className="mr-1 h-4 w-4 text-blue-600" />
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
              <Button type="submit" className="mr-2 rounded-xl bg-brand-gradient px-4 text-white">
                Buscar
              </Button>
            </div>
          </form>

          <nav className="flex shrink-0 items-center gap-4 text-sm font-semibold text-slate-600">
            {HEADER_SHORTCUTS.map(item => (
              <Link key={item.label} href={item.href} className="transition-colors hover:text-slate-900">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(isAuthenticated ? "/anunciante" : LOGIN_ROUTE)}
              className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-500" />
            </button>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 rounded-2xl border border-slate-200 px-2">
                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-brand-gradient text-sm font-bold text-white">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        displayInitial
                      )}
                    </div>
                    <ChevronDown className="h-3 w-3 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/anunciante")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Meu Painel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/favoritos")}>
                    <Heart className="mr-2 h-4 w-4" /> Favoritos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/anunciante/meus-dados")}>
                    <Settings className="mr-2 h-4 w-4" /> Configuracoes
                  </DropdownMenuItem>
                  {user?.role === "admin" && (
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <Shield className="mr-2 h-4 w-4" /> Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href={LOGIN_ROUTE}>
                <Button variant="outline" className="rounded-2xl border-slate-200">
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </Button>
              </Link>
            )}

            <Link href={isAuthenticated ? "/anunciante/novo" : LOGIN_ROUTE}>
              <Button className="rounded-2xl bg-orange-gradient px-4 font-bold text-white shadow-md hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" />
                Anunciar Agora
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-2 py-3 xl:hidden">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gradient shadow-md">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-lg font-black leading-none text-gray-900">
                  Norte
                  <span style={{ color: "oklch(0.68 0.19 45)" }}>Vivo</span>
                </p>
              </div>
            </Link>

            <form onSubmit={handleSearch} className="min-w-0 flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white py-3 pl-4 pr-12 text-sm text-slate-700 outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </form>

            <button
              type="button"
              onClick={() => navigate(isAuthenticated ? "/anunciante" : LOGIN_ROUTE)}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-slate-700"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-500" />
            </button>
          </div>

          <div className="border-b border-slate-100 pb-2">
            <Select
              value={selectedCity ? String(selectedCity) : "all"}
              onValueChange={value =>
                onCityChange?.(value === "all" ? null : Number(value))
              }
            >
              <SelectTrigger className="h-auto max-w-[180px] border-0 bg-transparent px-0 text-sm font-medium text-slate-700 shadow-none focus:ring-0">
                <MapPin className="mr-1 h-4 w-4 text-slate-500" />
                <SelectValue placeholder="Parana" />
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
        </div>
      </div>

      <div className="border-t border-slate-100 bg-white">
        <div className="container">
          <div className="overflow-x-auto py-2 sm:py-3 scrollbar-hide">
            <div className="flex w-max items-center gap-2 motion-safe:animate-pill-marquee">
              {[...HEADER_PILLS, ...HEADER_PILLS, ...HEADER_PILLS].map((item, index) => {
              const Icon = item.icon;
              const href = item.label === "Favoritos" && !isAuthenticated ? LOGIN_ROUTE : item.href;
              return (
                <Link
                  key={`${item.label}-${index}`}
                  href={href}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span className={`inline-flex rounded-full p-2 ${item.tone}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {item.label}
                </Link>
              );
              })}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
