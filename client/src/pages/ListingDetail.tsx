import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MapPin,
  MessageCircle,
  Heart,
  Share2,
  Eye,
  Clock,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Zap,
  Star,
  Flag,
  Bell,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import { Button } from "@/components/ui/button";

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [currentImage, setCurrentImage] = useState(0);
  const [isFollowingSeller, setIsFollowingSeller] = useState(false);
  const [hasPriceAlert, setHasPriceAlert] = useState(false);

  const { data: listing, isLoading } = trpc.public.listingById.useQuery({
    id: Number(id),
  });
  const { data: sellerListings } = trpc.public.sellerListings.useQuery(
    {
      sellerId: listing?.seller?.id ?? 0,
      excludeId: listing?.id,
      limit: 4,
    },
    { enabled: Boolean(listing?.seller?.id) }
  );
  const { data: relatedListings } = trpc.public.relatedListings.useQuery(
    {
      listingId: listing?.id ?? 0,
      categoryId: listing?.categoryId ?? 0,
      subcategory: "subcategory" in (listing ?? {}) ? listing?.subcategory ?? undefined : undefined,
      cityId: listing?.cityId ?? undefined,
      limit: 8,
    },
    { enabled: Boolean(listing?.id && listing?.categoryId) }
  );
  const favMutation = trpc.advertiser.toggleFavorite.useMutation({
    onSuccess: data =>
      toast.success(
        data.favorited
          ? "Adicionado aos favoritos!"
          : "Removido dos favoritos"
      ),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-96 rounded-2xl bg-gray-200" />
            <div className="h-8 w-3/4 rounded bg-gray-200" />
            <div className="h-6 w-1/4 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container py-20 text-center">
          <h2 className="mb-4 font-display text-2xl font-bold text-gray-700">
            Anuncio nao encontrado
          </h2>
          <Link href="/busca">
            <Button className="rounded-xl bg-brand-gradient text-white">
              Ver outros anuncios
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = listing.images || [];
  const sellerPersonType =
    listing.seller && "personType" in listing.seller ? listing.seller.personType : undefined;
  const sellerCompanyName =
    listing.seller && "companyName" in listing.seller ? listing.seller.companyName : undefined;
  const listingSubcategory = "subcategory" in listing ? listing.subcategory : undefined;
  const listingCondition = "itemCondition" in listing ? listing.itemCondition : undefined;
  const sellerDisplayName =
    sellerPersonType === "pj"
      ? sellerCompanyName || listing.seller?.name || "Loja"
      : listing.seller?.name || "Anunciante";
  const sellerInitial = sellerDisplayName.charAt(0)?.toUpperCase() || "?";
  const sellerStorageKey = listing.seller?.id ? `norte-vivo:follow-seller:${listing.seller.id}` : "";
  const priceAlertKey = `norte-vivo:price-alert:${listing.id}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sellerStorageKey) {
      setIsFollowingSeller(window.localStorage.getItem(sellerStorageKey) === "1");
    }
    setHasPriceAlert(window.localStorage.getItem(priceAlertKey) === "1");
  }, [priceAlertKey, sellerStorageKey]);

  const formatPrice = () => {
    if (!listing.price || listing.priceType === "free") return "Gratis";
    if (listing.priceType === "on_request") return "Sob consulta";
    if (listing.priceType === "negotiable") {
      return `R$ ${Number(listing.price).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })} (negociavel)`;
    }
    return `R$ ${Number(listing.price).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}`;
  };

  const whatsappUrl = listing.whatsapp
    ? `https://wa.me/55${listing.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Ola! Vi seu anuncio "${listing.title}" no Norte Vivo e tenho interesse.`
      )}`
    : null;
  const shareText = `Olha esse anuncio no Norte Vivo: ${listing.title}`;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `${shareText}\n${shareUrl}`
  )}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fall back to a WhatsApp share link.
      }
    }

    window.open(whatsappShareUrl, "_blank", "noopener,noreferrer");
  };

  const toggleFollowSeller = () => {
    if (!isAuthenticated) {
      toast.info("Faca login para seguir esta loja.");
      return;
    }
    if (!sellerStorageKey || typeof window === "undefined") return;

    const nextValue = !isFollowingSeller;
    window.localStorage.setItem(sellerStorageKey, nextValue ? "1" : "0");
    setIsFollowingSeller(nextValue);
    toast.success(nextValue ? "Loja seguida com sucesso." : "Voce deixou de seguir esta loja.");
  };

  const togglePriceAlert = () => {
    if (!isAuthenticated) {
      toast.info("Faca login para salvar alerta de preco.");
      return;
    }
    if (typeof window === "undefined") return;

    const nextValue = !hasPriceAlert;
    window.localStorage.setItem(priceAlertKey, nextValue ? "1" : "0");
    setHasPriceAlert(nextValue);
    toast.success(
      nextValue
        ? "Aviso de queda de preco ativado para este item."
        : "Aviso de queda de preco removido."
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container py-4 sm:py-6">
        <div className="mb-4 flex items-center gap-2 overflow-hidden text-sm text-gray-500 sm:mb-6">
          <Link href="/" className="hover:text-blue-600">
            Inicio
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/busca" className="hover:text-blue-600">
            Anuncios
          </Link>
          <ChevronRight className="h-3 w-3" />
            <span className="truncate font-medium text-gray-900">
              {listing.title}
            </span>
          </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="relative aspect-[16/10] bg-gray-100">
                {images.length > 0 ? (
                  <img
                    src={images[currentImage]?.url}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                    <div className="font-display text-8xl font-black text-blue-300">
                      {listing.title.charAt(0)}
                    </div>
                  </div>
                )}

                {listing.isBoosted && (
                  <div className="absolute left-4 top-4">
                    <span className="flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-sm font-bold text-white shadow-md">
                      <Zap className="h-4 w-4" /> DESTAQUE
                    </span>
                  </div>
                )}

                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImage(i => Math.max(0, i - 1))}
                      className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md transition-colors hover:bg-white"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentImage(i => Math.min(images.length - 1, i + 1))
                      }
                      className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md transition-colors hover:bg-white"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImage(i)}
                          className={`h-2 w-2 rounded-full transition-all ${
                            i === currentImage ? "w-4 bg-white" : "bg-white/60"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-3 scrollbar-hide">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImage(i)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                        i === currentImage
                          ? "border-blue-500"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  {(listing.type || listingSubcategory || listingCondition) && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {listing.type && (
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {listing.type === "product"
                            ? "Produto"
                            : listing.type === "service"
                              ? "Servico"
                              : listing.type === "vehicle"
                                ? "Veiculo"
                                : listing.type === "property"
                                  ? "Imovel"
                                  : listing.type === "food"
                                    ? "Delivery"
                                    : "Vaga"}
                        </span>
                      )}
                      {listingSubcategory && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {listingSubcategory}
                        </span>
                      )}
                      {listingCondition && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {listingCondition}
                        </span>
                      )}
                    </div>
                  )}
                  <h1 className="mb-2 break-words font-display text-2xl font-bold text-gray-900">
                    {listing.title}
                  </h1>
                  <div
                    className="break-words text-2xl font-black sm:text-3xl"
                    style={{ color: "oklch(0.48 0.22 255)" }}
                  >
                    {formatPrice()}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2 self-start">
                  <button
                    onClick={() => {
                      if (isAuthenticated) {
                        favMutation.mutate({ listingId: listing.id });
                      } else {
                        toast.info("Faca login para favoritar");
                      }
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 transition-colors hover:border-red-200 hover:bg-red-50"
                  >
                    <Heart className="h-5 w-5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => {
                      void handleShare();
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 transition-colors hover:border-blue-200 hover:bg-blue-50"
                  >
                    <Share2 className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="mb-6 flex flex-wrap gap-3 text-sm text-gray-500">
                {listing.neighborhood && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {listing.neighborhood}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {listing.viewCount} visualizacoes
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDistanceToNow(new Date(listing.createdAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>

              {listing.description && (
                <div>
                  <h3 className="mb-2 font-bold text-gray-900">Descricao</h3>
                  <p className="whitespace-pre-wrap break-words leading-relaxed text-gray-600">
                    {listing.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6 lg:sticky lg:top-24">
              {listing.seller && (
                <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-6">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-brand-gradient text-xl font-black text-white">
                    {listing.seller.avatar ? (
                      <img
                        src={listing.seller.avatar}
                        alt={sellerDisplayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      sellerInitial
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="truncate font-bold text-gray-900">
                        {sellerDisplayName}
                      </span>
                      {listing.seller.isVerified && (
                        <BadgeCheck className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Membro desde{" "}
                      {new Date(listing.seller.createdAt).getFullYear()}
                    </p>
                    <div className="mt-1 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className="h-3 w-3 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {whatsappUrl && (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full rounded-xl bg-green-500 py-6 text-base font-bold text-white hover:bg-green-600">
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Chamar no WhatsApp
                    </Button>
                  </a>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void handleShare();
                  }}
                  className="w-full rounded-xl border-blue-200 py-6 text-base font-semibold text-blue-700 hover:bg-blue-50"
                >
                  <Share2 className="mr-2 h-5 w-5" />
                  Compartilhar no WhatsApp
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={toggleFollowSeller}
                  className="w-full rounded-xl border-gray-200 py-6 text-base font-semibold text-gray-800 hover:bg-gray-50"
                >
                  <Store className="mr-2 h-5 w-5" />
                  {isFollowingSeller ? "Seguindo loja" : "Seguir loja"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={togglePriceAlert}
                  className="w-full rounded-xl border-gray-200 py-6 text-base font-semibold text-gray-800 hover:bg-gray-50"
                >
                  <Bell className="mr-2 h-5 w-5" />
                  {hasPriceAlert ? "Aviso de preco ativo" : "Avisar queda de preco"}
                </Button>
              </div>

              <div className="mt-4 rounded-xl bg-amber-50 p-3">
                <p className="text-xs font-medium text-amber-700">
                  Nunca pague antecipado. Prefira negociar pessoalmente ou via
                  WhatsApp.
                </p>
              </div>

              <button className="mx-auto mt-4 flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-red-500">
                <Flag className="h-3 w-3" /> Denunciar anuncio
              </button>
            </div>
          </div>
        </div>

        {(sellerListings?.length || relatedListings?.length) && (
          <div className="mt-8 space-y-8">
            {sellerListings && sellerListings.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-gray-900">
                      Mais da mesma loja
                    </h2>
                    <p className="text-sm text-gray-500">
                      Outros itens publicados por {sellerDisplayName}.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                  {sellerListings.map(item => (
                    <ListingCard key={item.id} {...item} />
                  ))}
                </div>
              </section>
            )}

            {relatedListings && relatedListings.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-gray-900">
                      Anuncios parecidos
                    </h2>
                    <p className="text-sm text-gray-500">
                      Itens da mesma categoria para comparar melhor antes de falar com o anunciante.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                  {relatedListings.map(item => (
                    <ListingCard key={item.id} {...item} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
