import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { LOGIN_ROUTE } from "@/const";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertCircle,
  ChevronRight,
  Clock3,
  Pencil,
  Eye,
  Heart,
  LayoutDashboard,
  LogIn,
  MessageSquare,
  Package,
  Pause,
  Play,
  Plus,
  Star,
  Trash2,
  Trophy,
  Zap,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  active: { label: "Ativo", badge: "bg-emerald-50 text-emerald-700" },
  pending: { label: "Pendente", badge: "bg-amber-50 text-amber-700" },
  paused: { label: "Pausado", badge: "bg-gray-100 text-gray-700" },
  sold: { label: "Vendido", badge: "bg-blue-50 text-blue-700" },
  rejected: { label: "Rejeitado", badge: "bg-red-50 text-red-700" },
  expired: { label: "Expirado", badge: "bg-rose-50 text-rose-700" },
};

export default function AdvertiserDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const utils = trpc.useUtils();
  const { data: stats } = trpc.advertiser.stats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

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
  const trialDaysLeft = user?.trialStartedAt
    ? Math.max(0, 30 - Math.floor((Date.now() - new Date(user.trialStartedAt).getTime()) / 86400000))
    : 30;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container py-6">
        <section className="rounded-[28px] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                <LayoutDashboard className="h-4 w-4" />
                Painel do cliente
              </div>
              <h1 className="font-display text-3xl font-black text-gray-900">
                {user?.name ? `Ola, ${user.name.split(" ")[0]}` : "Seu painel"}
              </h1>
              <p className="mt-2 max-w-2xl text-gray-500">
                Visualize seus produtos, acompanhe resultados e gerencie o que esta no ar.
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
            { label: "Anuncios", value: stats?.totalListings ?? 0, note: `${stats?.statusBreakdown.active ?? 0} ativos`, icon: Package, tone: "bg-blue-50 text-blue-700" },
            { label: "Visualizacoes", value: stats?.totalViews ?? 0, note: "alcance total", icon: Eye, tone: "bg-violet-50 text-violet-700" },
            { label: "Contatos", value: stats?.totalContacts ?? 0, note: `${stats?.totalFavorites ?? 0} favoritos`, icon: MessageSquare, tone: "bg-emerald-50 text-emerald-700" },
            { label: "Booster", value: stats?.activeBoosters ?? 0, note: `${stats?.boostedListings ?? 0} turbinado(s)`, icon: Zap, tone: "bg-amber-50 text-amber-700" },
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
