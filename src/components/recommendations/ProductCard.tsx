import { formatPrice } from "./formatPrice";
import type { RecommendedProduct } from "./types";

interface ProductCardProps {
  product: RecommendedProduct;
  onSelect?: ((product: RecommendedProduct) => void) | undefined;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`h-3.5 w-3.5 ${i < Math.round(rating) ? "fill-amber-500" : "fill-neutral-300"}`}
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const {
    name,
    brand,
    price,
    compareAtPrice,
    currency,
    rating,
    reviewCount,
    imageUrl,
    imageTint,
    badge,
    href,
  } = product;

  const discount =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  const Wrapper = href ? "a" : "div";

  return (
    <Wrapper
      {...(href ? { href } : {})}
      onClick={onSelect ? () => onSelect(product) : undefined}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow duration-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
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
          <span className="absolute left-2 top-2 rounded-full bg-neutral-900 px-2 py-0.5 text-[11px] font-medium tracking-wide text-white">
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
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">{brand}</p>
        ) : null}
        <p className="line-clamp-2 text-sm font-medium text-neutral-900">{name}</p>

        {typeof rating === "number" ? (
          <div className="mt-0.5 flex items-center gap-1.5">
            <Stars rating={rating} />
            <span className="text-xs text-neutral-500">
              {rating.toFixed(1)}
              {reviewCount ? ` (${reviewCount})` : ""}
            </span>
          </div>
        ) : null}

        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-sm font-semibold text-neutral-900">
            {formatPrice(price, currency)}
          </span>
          {compareAtPrice && compareAtPrice > price ? (
            <span className="text-xs text-neutral-400 line-through">
              {formatPrice(compareAtPrice, currency)}
            </span>
          ) : null}
        </div>
      </div>
    </Wrapper>
  );
}
