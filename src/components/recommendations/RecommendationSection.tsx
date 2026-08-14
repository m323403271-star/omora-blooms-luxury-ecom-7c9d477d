import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "./ProductCardSkeleton";
import { RecommendationCarousel } from "./RecommendationCarousel";
import type { RecommendationLayout, RecommendedProduct } from "./types";

export interface RecommendationSectionProps {
  title: string;
  subtitle?: string;
  products: RecommendedProduct[];
  layout?: RecommendationLayout | undefined;
  /** Max items rendered in grid layout. */
  maxItems?: number | undefined;
  isLoading?: boolean | undefined;
  viewAllHref?: string | undefined;
  onSelect?: ((product: RecommendedProduct) => void) | undefined;
  className?: string | undefined;
}

/**
 * Self-contained recommendation block. Renders nothing when there is no data,
 * so it can be dropped onto any product page without affecting existing layout.
 */
export function RecommendationSection({
  title,
  subtitle,
  products,
  layout = "carousel",
  maxItems = 8,
  isLoading = false,
  viewAllHref,
  onSelect,
  className = "",
}: RecommendationSectionProps) {
  if (!isLoading && products.length === 0) return null;

  const items = layout === "grid" ? products.slice(0, maxItems) : products;

  return (
    <section className={`w-full ${className}`} aria-label={title}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">
            {title}
          </h2>
          {subtitle ? <p className="mt-1 text-sm text-neutral-500">{subtitle}</p> : null}
        </div>
        {viewAllHref ? (
          <a
            href={viewAllHref}
            className="shrink-0 text-sm font-medium text-neutral-900 underline underline-offset-4 hover:text-neutral-600"
          >
            View all
          </a>
        ) : null}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : layout === "carousel" ? (
        <RecommendationCarousel products={items} onSelect={onSelect} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} onSelect={onSelect} />
          ))}
        </div>
      )}
    </section>
  );
}
