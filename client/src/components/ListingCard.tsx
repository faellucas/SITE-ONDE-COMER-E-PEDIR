import { Link } from "wouter";
import { BadgeCheck, Clock, Eye, Heart, MapPin, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ListingCardProps {
  id: number;
  title: string;
  price?: string | null;
  priceType?: string | null;
  cityId?: number | null;
  subcategory?: string | null;
  neighborhood?: string | null;
  isBoosted?: boolean | null;
  isFeatured?: boolean | null;
  viewCount?: number | null;
  createdAt: Date | string;
  images?: { url: string; isPrimary?: boolean | null }[];
  seller?: {
    name?: string | null;
    isVerified?: boolean | null | undefined;
  } | null;
  categoryName?: string;
  type?: string | null;
  onFavorite?: (id: number) => void;
  isFavorited?: boolean | null;
  cityName?: string;
}

const TYPE_LABELS: Record<string, string> = {
  product: "Produto",
  service: "Servico",
  vehicle: "Veiculo",
  property: "Imovel",
  food: "Comida",
  job: "Emprego",
};

export default function ListingCard({
  id,
  title,
  price,
  priceType,
  subcategory,
  neighborhood,
  isBoosted,
  viewCount,
  createdAt,
  images,
  seller,
  categoryName,
  type,
  onFavorite,
  isFavorited,
  cityName,
}: ListingCardProps) {
  const primaryImage = images?.find(image => image.isPrimary) || images?.[0];
  const sellerLabel = seller?.name || "Anunciante";

  const formatPrice = () => {
    if (!price || priceType === "free") return "Gratis";
    if (priceType === "on_request") return "Sob consulta";
    if (priceType === "negotiable") {
      return `R$ ${Number(price).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })} (negociavel)`;
    }

    return `R$ ${Number(price).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}`;
  };

  const timeAgo = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div
      className={`group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${isBoosted ? "ring-2 ring-amber-400" : ""}`}
    >
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1">
        {isBoosted && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-white shadow-md">
            <Zap className="h-3 w-3" />
            BOOSTER
          </span>
        )}
        {type && (
          <span className="inline-flex rounded-full bg-blue-600 px-2.5 py-1 text-xs font-medium text-white">
            {TYPE_LABELS[type] || type}
          </span>
        )}
      </div>

      <button
        onClick={event => {
          event.preventDefault();
          onFavorite?.(id);
        }}
        className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md transition-transform hover:scale-110"
      >
        <Heart
          className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : "text-slate-400"}`}
        />
      </button>

      <Link href={`/anuncio/${id}`}>
        <div className="aspect-[4/3] overflow-hidden bg-slate-100">
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-orange-100">
              <div className="font-display text-4xl font-bold text-blue-300">
                {title.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>

        <div className="p-4">
          {(categoryName || subcategory) && (
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {[categoryName, subcategory].filter(Boolean).join(" · ")}
            </span>
          )}

          <h3 className="mt-3 line-clamp-2 text-base font-bold text-slate-900 transition-colors group-hover:text-blue-600">
            {title}
          </h3>

          <p
            className="mt-2 text-xl font-black"
            style={{ color: "oklch(0.48 0.22 255)" }}
          >
            {formatPrice()}
          </p>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{neighborhood || cityName || "Norte Pioneiro"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{timeAgo}</span>
            </div>
          </div>

          {seller && (
            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                {sellerLabel.charAt(0)?.toUpperCase() || "?"}
              </div>
              <span className="truncate text-xs font-medium text-slate-600">
                {sellerLabel}
              </span>
              {seller.isVerified && (
                <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-blue-500" />
              )}
              {viewCount !== undefined && (
                <div className="ml-auto flex items-center gap-1 text-slate-400">
                  <Eye className="h-3 w-3" />
                  <span className="text-xs">{viewCount}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
