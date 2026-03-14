import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { LOGIN_ROUTE } from "@/const";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CASHBACK_RULES } from "@/lib/cashback";
import { getSegmentFromCategorySlug, SEGMENT_CONTENT } from "@/lib/segments";
import { toast } from "sonner";
import {
  Camera,
  AlertCircle,
  ChevronRight,
  Clock3,
  CookingPot,
  Cpu,
  Pencil,
  Eye,
  Heart,
  LayoutDashboard,
  LogIn,
  MessageSquare,
  Store,
  Package,
  Pause,
  Play,
  Plus,
  Save,
  Shirt,
  Star,
  Trash2,
  Trophy,
  CarFront,
  Zap,
} from "lucide-react";
import { useEffect } from "react";

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  active: { label: "Ativo", badge: "bg-emerald-50 text-emerald-700" },
  pending: { label: "Pendente", badge: "bg-amber-50 text-amber-700" },
  paused: { label: "Pausado", badge: "bg-gray-100 text-gray-700" },
  sold: { label: "Vendido", badge: "bg-blue-50 text-blue-700" },
  rejected: { label: "Rejeitado", badge: "bg-red-50 text-red-700" },
  expired: { label: "Expirado", badge: "bg-rose-50 text-rose-700" },
};

const SEGMENT_ICON = {
  generic: Store,
  food: CookingPot,
  vehicles: CarFront,
  fashion: Shirt,
  electronics: Cpu,
} as const;

export default function AdvertiserDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [profileName, setProfileName] = useState("");
  const [personType, setPersonType] = useState<"pf" | "pj">("pf");
  const [companyName, setCompanyName] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cityId, setCityId] = useState<string>("none");
  const [neighborhood, setNeighborhood] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const utils = trpc.useUtils();
  const { data: stats } = trpc.advertiser.stats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: cities } = trpc.public.cities.useQuery();
  const { data: categories } = trpc.public.categories.useQuery();

  useEffect(() => {
    if (!user) return;
    setProfileName(user.name ?? "");
    setPersonType((user.personType as "pf" | "pj") ?? "pf");
    setCompanyName(user.companyName ?? "");
    setCpfCnpj(user.cpfCnpj ?? "");
    setWhatsapp(user.whatsapp ?? "");
    setCityId(user.cityId ? String(user.cityId) : "none");
    setNeighborhood(user.neighborhood ?? "");
  }, [user]);

  const updateMutation = trpc.advertiser.updateListing.useMutation({
    onSuccess: async () => {
      await utils.advertiser.stats.invalidate();
      toast.success("Anuncio atualizado.");
    },
  });

  const deleteMutation = trpc.advertiser.deleteListing.useMutation({
    onSuccess: async () => {
      await utils.advertiser.stats.invalidate();
      setDeletingId(null);
      toast.success("Anuncio removido.");
    },
  });

  const boostMutation = trpc.advertiser.activateBooster.useMutation({
    onSuccess: async () => {
      await utils.advertiser.stats.invalidate();
      toast.success("Booster ativado.");
    },
  });

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Perfil atualizado.");
    },
    onError: error => {
      toast.error(error.message);
    },
  });
  const uploadAvatarMutation = trpc.auth.uploadAvatar.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Foto de perfil atualizada.");
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container py-20 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-100">
            <LogIn className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="font-display text-2xl font-bold text-gray-800">Acesse seu painel</h2>
          <p className="mt-3 text-gray-500">Entre para visualizar seus anuncios, desempenho e favoritos.</p>
          <Link href={LOGIN_ROUTE}>
            <Button className="mt-6 rounded-xl bg-brand-gradient px-8 py-3 text-white">
              Entrar / Cadastrar
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const listings = stats?.listings ?? [];
  const topListing = stats?.topListing ?? null;
  const cashbackHighlights = CASHBACK_RULES.slice(0, 4);
  const primaryCategory = categories?.find(category =>
    listings.some(listing => listing.categoryId === category.id)
  );
  const segment = getSegmentFromCategorySlug(primaryCategory?.slug);
  const segmentContent = SEGMENT_CONTENT[segment];
  const SegmentIcon = SEGMENT_ICON[segment];
  const trialDaysLeft = user?.trialStartedAt
    ? Math.max(0, 30 - Math.floor((Date.now() - new Date(user.trialStartedAt).getTime()) / 86400000))
    : 30;

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async readerEvent => {
      const result = readerEvent.target?.result;
      if (typeof result !== "string") return;

      setAvatarUploading(true);
      try {
        await uploadAvatarMutation.mutateAsync({
          base64: result,
          mimeType: file.type || "image/jpeg",
        });
      } finally {
        setAvatarUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container py-6">
        <section className="rounded-[28px] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                <LayoutDashboard className="h-4 w-4" />
                {segmentContent.quickLabel}
              </div>
              <h1 className="font-display text-3xl font-black text-gray-900">
                {segmentContent.dashboardTitle}
              </h1>
              <p className="mt-2 max-w-2xl text-gray-500">
                {user?.name ? `Ola, ${user.name.split(" ")[0]}. ` : ""}
                {segmentContent.dashboardSubtitle}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/anunciar">
                <Button className="rounded-2xl bg-orange-gradient px-6 py-6 font-bold text-white hover:opacity-90">
                  <Plus className="mr-2 h-5 w-5" />
                  Novo anuncio
                </Button>
              </Link>
              <Link href="/planos">
                <Button variant="outline" className="rounded-2xl px-6 py-6 font-semibold">
                  Ver planos
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {trialDaysLeft <= 7 && trialDaysLeft > 0 && (
          <section className="mt-6 flex items-start gap-3 rounded-[24px] border border-amber-200 bg-amber-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800">Seu periodo gratis expira em {trialDaysLeft} dia(s)</p>
              <p className="text-sm text-amber-700">Considere fazer upgrade para manter seus anuncios ativos.</p>
            </div>
            <Link href="/planos">
              <Button size="sm" className="rounded-xl bg-amber-400 text-gray-900 hover:bg-amber-300">
                Fazer upgrade
              </Button>
            </Link>
          </section>
        )}

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: segmentContent.metrics[0]?.label ?? "Anuncios",
              value: stats?.totalListings ?? 0,
              note: segmentContent.metrics[0]?.helper ?? `${stats?.statusBreakdown.active ?? 0} ativos`,
              icon: Package,
              tone: "bg-blue-50 text-blue-700",
            },
            {
              label: segmentContent.metrics[1]?.label ?? "Visualizacoes",
              value: stats?.totalViews ?? 0,
              note: segmentContent.metrics[1]?.helper ?? "alcance total",
              icon: Eye,
              tone: "bg-violet-50 text-violet-700",
            },
            {
              label: segmentContent.metrics[2]?.label ?? "Contatos",
              value: stats?.totalContacts ?? 0,
              note: segmentContent.metrics[2]?.helper ?? `${stats?.totalFavorites ?? 0} favoritos`,
              icon: MessageSquare,
              tone: "bg-emerald-50 text-emerald-700",
            },
            {
              label: segmentContent.metrics[3]?.label ?? "Booster",
              value: stats?.activeBoosters ?? 0,
              note: segmentContent.metrics[3]?.helper ?? `${stats?.boostedListings ?? 0} turbinado(s)`,
              icon: Zap,
              tone: "bg-amber-50 text-amber-700",
            },
          ].map(item => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
                <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-3xl font-black text-gray-900">{item.value.toLocaleString()}</div>
                <div className="mt-1 text-sm font-semibold text-gray-700">{item.label}</div>
                <div className="mt-1 text-xs text-gray-500">{item.note}</div>
              </article>
            );
          })}
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
          <article className="rounded-[28px] bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-white/90">
                  {segmentContent.badge}
                </div>
                <h2 className="font-display text-2xl font-black">
                  {segmentContent.title}
                </h2>
                <p className="mt-2 text-sm text-slate-200">
                  {segmentContent.description}
                </p>
              </div>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-white/10">
                <SegmentIcon className="h-7 w-7 text-white" />
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {segmentContent.highlights.map(item => (
                <div
                  key={item}
                  className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium backdrop-blur-sm"
                >
                  {item}
                </div>
              ))}
            </div>
            {primaryCategory && (
              <p className="mt-4 text-xs text-slate-300">
                Segmento principal detectado: {primaryCategory.name}
              </p>
            )}
          </article>

          {segmentContent.modules.map(module => (
            <article
              key={module.title}
              className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${module.accent}`}>
                Modulo sugerido
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-gray-900">
                {module.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {module.description}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-gray-900">Seus produtos</h2>
                <p className="text-sm text-gray-500">Lista completa do que voce publicou.</p>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                {listings.length} item(ns)
              </span>
            </div>

            {listings.length === 0 ? (
              <div className="rounded-[24px] bg-gray-50 p-12 text-center">
                <Package className="mx-auto mb-4 h-14 w-14 text-gray-200" />
                <h3 className="font-display text-xl font-bold text-gray-800">Nenhum anuncio ainda</h3>
                <p className="mt-2 text-gray-500">Crie seu primeiro produto e acompanhe tudo por aqui.</p>
                <Link href="/anunciar">
                  <Button className="mt-6 rounded-2xl bg-brand-gradient px-6 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar anuncio
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {listings.map(listing => {
                  const statusCfg = STATUS_CONFIG[listing.status || "pending"] ?? STATUS_CONFIG.pending;
                  return (
                    <article key={listing.id} className="flex flex-col gap-4 rounded-[22px] border border-gray-100 p-4 lg:flex-row lg:items-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-xl font-bold text-gray-400">
                        {listing.title.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/anuncio/${listing.id}`}>
                            <h3 className="cursor-pointer truncate font-semibold text-gray-900 hover:text-blue-600">
                              {listing.title}
                            </h3>
                          </Link>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusCfg.badge}`}>
                            {statusCfg.label}
                          </span>
                          {listing.isBoosted && (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                              Boost ativo
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{listing.viewCount ?? 0} visualizacoes</span>
                          <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{listing.favoriteCount ?? 0} favoritos</span>
                          <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{new Date(listing.createdAt).toLocaleDateString("pt-BR")}</span>
                          {listing.price && (
                            <span className="font-semibold text-blue-600">
                              R$ {Number(listing.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/anunciante/editar/${listing.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Editar
                          </Button>
                        </Link>
                        {!listing.isBoosted && (
                          <Button
                            size="sm"
                            className="rounded-xl bg-amber-400 text-gray-900 hover:bg-amber-300"
                            onClick={() => boostMutation.mutate({ listingId: listing.id, type: "featured", durationDays: 7 })}
                            disabled={boostMutation.isPending}
                          >
                            <Zap className="mr-1 h-3.5 w-3.5" />
                            Booster
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => updateMutation.mutate({ id: listing.id, status: listing.status === "active" ? "paused" : "active" })}
                        >
                          {listing.status === "active" ? (
                            <>
                              <Pause className="mr-1 h-3.5 w-3.5" />
                              Pausar
                            </>
                          ) : (
                            <>
                              <Play className="mr-1 h-3.5 w-3.5" />
                              Ativar
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => {
                            if (deletingId === listing.id) {
                              deleteMutation.mutate({ id: listing.id });
                              return;
                            }
                            setDeletingId(listing.id);
                            toast.warning("Clique novamente para confirmar a exclusao.");
                            setTimeout(() => setDeletingId(null), 3000);
                          }}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          {deletingId === listing.id ? "Confirmar" : "Excluir"}
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-gray-900">
                    Perfil da conta
                  </h2>
                  <p className="text-sm text-gray-500">
                    Defina se sua conta opera como pessoa fisica ou juridica.
                  </p>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-4 rounded-[22px] bg-gray-50 p-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-brand-gradient text-2xl font-black text-white">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || "Perfil"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (user?.name?.charAt(0)?.toUpperCase() || "U")
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Foto de perfil</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Essa imagem aparece no seu painel e na apresentacao da conta.
                  </p>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl"
                    disabled={avatarUploading || uploadAvatarMutation.isPending}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {avatarUploading || uploadAvatarMutation.isPending
                      ? "Enviando..."
                      : "Trocar foto"}
                  </Button>
                </label>
              </div>

              <div className="mb-4 grid gap-3 rounded-[22px] bg-gray-50 p-4 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Tipo atual</span>
                  <span className="rounded-full bg-white px-3 py-1 font-semibold text-gray-900">
                    {personType === "pj" ? "Pessoa juridica" : "Pessoa fisica"}
                  </span>
                </div>
                <p>
                  Os valores continuam os mesmos por enquanto, mas a comunicacao,
                  beneficios e recursos podem variar por perfil em breve.
                </p>
              </div>

              <form
                className="space-y-4"
                onSubmit={event => {
                  event.preventDefault();
                  updateProfileMutation.mutate({
                    name: profileName || undefined,
                    personType,
                    companyName: personType === "pj" ? companyName || undefined : undefined,
                    cpfCnpj: cpfCnpj || undefined,
                    whatsapp: whatsapp || undefined,
                    cityId: cityId !== "none" ? Number(cityId) : undefined,
                    neighborhood: neighborhood || undefined,
                  });
                }}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      Tipo de conta
                    </label>
                    <Select
                      value={personType}
                      onValueChange={value => setPersonType(value as "pf" | "pj")}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pf">Pessoa fisica</SelectItem>
                        <SelectItem value="pj">Pessoa juridica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      WhatsApp
                    </label>
                    <Input
                      value={whatsapp}
                      onChange={event => setWhatsapp(event.target.value)}
                      placeholder="(43) 99999-9999"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    {personType === "pj" ? "Nome do responsavel" : "Nome"}
                  </label>
                  <Input
                    value={profileName}
                    onChange={event => setProfileName(event.target.value)}
                    placeholder="Seu nome"
                  />
                </div>

                {personType === "pj" && (
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      Empresa
                    </label>
                    <Input
                      value={companyName}
                      onChange={event => setCompanyName(event.target.value)}
                      placeholder="Nome fantasia ou razao social"
                    />
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      {personType === "pj" ? "CNPJ" : "CPF"}
                    </label>
                    <Input
                      value={cpfCnpj}
                      onChange={event => setCpfCnpj(event.target.value)}
                      placeholder={personType === "pj" ? "00.000.000/0000-00" : "000.000.000-00"}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      Cidade
                    </label>
                    <Select value={cityId} onValueChange={setCityId}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nao informar</SelectItem>
                        {cities?.map(city => (
                          <SelectItem key={city.id} value={String(city.id)}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Bairro
                  </label>
                  <Input
                    value={neighborhood}
                    onChange={event => setNeighborhood(event.target.value)}
                    placeholder="Centro, Vila Nova..."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="w-full rounded-2xl bg-brand-gradient font-bold text-white hover:opacity-90"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateProfileMutation.isPending ? "Salvando..." : "Salvar perfil"}
                </Button>
              </form>
            </section>

            <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-gray-900">
                    Cashback Norte Vivo
                  </h2>
                  <p className="text-sm text-gray-500">
                    Recompensa pensada para categorias com recompra frequente.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {cashbackHighlights.map(rule => (
                  <div
                    key={rule.slug}
                    className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {rule.label}
                        </div>
                        <div className="text-xs text-gray-600">{rule.description}</div>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700">
                        ate {rule.rate}% de cashback
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs text-gray-500">
                Para comecar, o cashback vale melhor em categorias recorrentes,
                como alimentacao, delivery, pet, saude e beleza.
              </p>
            </section>

            <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-gray-900">Melhor desempenho</h2>
                  <p className="text-sm text-gray-500">Seu anuncio com maior alcance.</p>
                </div>
              </div>
              {topListing ? (
                <div className="rounded-[22px] bg-gray-50 p-4">
                  <p className="font-semibold text-gray-900">{topListing.title}</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-white p-3">
                      <div className="text-xs text-gray-500">Visualizacoes</div>
                      <div className="mt-1 font-black text-gray-900">{topListing.viewCount ?? 0}</div>
                    </div>
                    <div className="rounded-2xl bg-white p-3">
                      <div className="text-xs text-gray-500">Contatos</div>
                      <div className="mt-1 font-black text-gray-900">{topListing.contactCount ?? 0}</div>
                    </div>
                  </div>
                  <Link href={`/anuncio/${topListing.id}`}>
                    <Button variant="outline" className="mt-4 w-full rounded-2xl">Ver anuncio</Button>
                  </Link>
                </div>
              ) : (
                <div className="rounded-[22px] bg-gray-50 p-4 text-sm text-gray-500">
                  Assim que houver desempenho suficiente, o anuncio destaque aparece aqui.
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="font-display text-xl font-bold text-gray-900">Resumo rapido</h2>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Ativos", value: stats?.statusBreakdown.active ?? 0, tone: "bg-emerald-50 text-emerald-700" },
                  { label: "Pausados", value: stats?.statusBreakdown.paused ?? 0, tone: "bg-gray-100 text-gray-700" },
                  { label: "Vendidos", value: stats?.statusBreakdown.sold ?? 0, tone: "bg-blue-50 text-blue-700" },
                  { label: "Pendentes", value: stats?.statusBreakdown.pending ?? 0, tone: "bg-amber-50 text-amber-700" },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.tone}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] bg-gradient-to-r from-blue-700 to-violet-700 p-6 text-white shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <Star className="h-6 w-6 text-amber-300" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Quer mais visibilidade?</h2>
                  <p className="text-sm text-blue-100">Use Booster para subir seus produtos nas buscas.</p>
                </div>
              </div>
              <Link href="/planos">
                <Button className="mt-5 rounded-2xl bg-white text-blue-900 hover:bg-blue-50">
                  Ver planos <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
