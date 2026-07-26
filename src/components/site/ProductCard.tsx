import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { formatPrice, resolveProductImage, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { handleImageError } from "@/lib/image-fallback";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const img = resolveProductImage(product.image_url);
  const onSale = Boolean(product.compare_at_price);
  const isBestseller = product.tags?.includes("bestseller");

  return (
    <div className="group relative">
      <Link to="/products/$slug" params={{ slug: product.slug }} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[color:var(--card)] hairline border">
          <img
            src={img}
            alt={`${product.name}${product.tagline ? ` — ${product.tagline}` : ""} | OMORA BLOOMS handmade luxury`}
            loading="lazy"
            decoding="async"
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            onError={handleImageError}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Badge stack — anchored to top corners with safe insets so they
              never bleed over the image border or the title below. Both
              badges share one row when present. */}
          {(onSale || isBestseller) && (
            <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-2">
              {onSale ? (
                <span className="inline-flex items-center rounded-full bg-[color:var(--blush)] text-[color:var(--noir)] text-[10px] tracking-[0.18em] uppercase px-2.5 py-1 font-semibold shadow-sm">
                  Sale
                </span>
              ) : <span />}
              {isBestseller && (
                <span className="inline-flex items-center rounded-full bg-gold-gradient text-[color:var(--noir)] text-[10px] tracking-[0.18em] uppercase px-2.5 py-1 font-semibold shadow-sm">
                  Bestseller
                </span>
              )}
            </div>
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              add({ id: product.id, slug: product.slug, name: product.name, price: product.price, image: img });
            }}
            aria-label={`Add ${product.name} to bag`}
            className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-gold-gradient text-[color:var(--noir)] grid place-items-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-lg"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 space-y-1">
          <h3 className="font-serif text-lg text-[color:var(--foreground)] leading-snug line-clamp-2">{product.name}</h3>
          {product.tagline && <p className="text-xs text-[color:var(--muted-foreground)] line-clamp-2">{product.tagline}</p>}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-[color:var(--gold)] font-medium">{formatPrice(product.price)}</span>
            {product.compare_at_price && (
              <span className="text-xs text-[color:var(--muted-foreground)] line-through">{formatPrice(product.compare_at_price)}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

