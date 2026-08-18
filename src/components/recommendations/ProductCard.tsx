import { formatPrice } from "./formatPrice";
import type { RecommendationTone, RecommendedProduct } from "./types";

interface ProductCardProps {
  product: RecommendedProduct;
  onSelect?: ((product: RecommendedProduct) => void) | undefined;
  tone?: RecommendationTone | undefined;
}

const toneStyles = {
  light: {
    card: "border-neutral-200 bg-white hover:shadow-md focus-visible:outline-neutral-900",
    media: "bg-neutral-100",
    brand: "text-neutral-500",
    name: "text-neutral-900",
    meta: "text-neutral-500",
    price: "text-neutral-900",
    compare: "text-neutral-400",
    badge: "bg-neutral-900 text-white",
    starOff: "fill-neutral-300",
  },
  dark: {
    card: "border-white/10 bg-white/[0.04] hover:border-white/25 hover:shadow-lg focus-visible:outline-amber-300",
    media: "bg-white/5",
    brand: "text-white/50",
    name: "text-white",
    meta: "text-white/60",
    price: "text-amber-200",
    compare: "text-white/40",
    badge: "bg-amber-200 text-neutral-900",
    starOff: "fill-white/20",
  },
} as const;

function Stars({ rating, offClass }: { rating: number; offClass: string }) {
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`h-3.5 w-3.5 ${i < Math.round(rating) ? "fill-amber-400" : offClass}`}
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

export function ProductCard({ product, onSelect, tone = "light" }: ProductCardProps) {
  const {
    name,
    brand,
    price,
    compareAtPrice,
    currency,
    locale,
    rating,
    reviewCount,
    imageUrl,
    imageTint,
    badge,
    href,
  } = product;

  const t = toneStyles[tone];

  const discount =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  const Wrapper = href ? "a" : "div";

  return (
    <Wrapper
      {...(href ? { href } : {})}
      onClick={onSelect ? () => onSelect(product) : undefined}
      className={`group flex h-full flex-col overflow-hidden rounded-xl border transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 ${t.card}`}
    >
      <div className={`relative aspect-square w-full overflow-hidden ${t.media}`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="h-full w-full transition-transform duration-300 group-hover:scale-105"
            style={{ background: imageTint ?? "linear-gradient(135deg,#e5e5e5,#f5f5f5)" }}
          />
        )}
        {badge ? (
          <span
            className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide ${t.badge}`}
          >
            {badge}
          </span>
        ) : null}
        {discount ? (
          <span className="absolute right-2 top-2 rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-semibold text-white">
            -{discount}%
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        {brand ? (
          <p className={`text-[11px] font-medium uppercase tracking-wide ${t.brand}`}>{brand}</p>
        ) : null}
        <p className={`line-clamp-2 text-sm font-medium ${t.name}`}>{name}</p>

        {typeof rating === "number" ? (
          <div className="mt-0.5 flex items-center gap-1.5">
            <Stars rating={rating} offClass={t.starOff} />
            <span className={`text-xs ${t.meta}`}>
              {rating.toFixed(1)}
              {reviewCount ? ` (${reviewCount})` : ""}
            </span>
          </div>
        ) : null}

        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className={`text-sm font-semibold ${t.price}`}>
            {formatPrice(price, currency, locale)}
          </span>
          {compareAtPrice && compareAtPrice > price ? (
            <span className={`text-xs line-through ${t.compare}`}>
              {formatPrice(compareAtPrice, currency, locale)}
            </span>
          ) : null}
        </div>
      </div>
    </Wrapper>
  );
}
