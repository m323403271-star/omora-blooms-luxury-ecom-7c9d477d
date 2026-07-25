import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { formatPrice, resolveProductImage, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const img = resolveProductImage(product.image_url);

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
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {product.compare_at_price && (
            <span className="absolute top-3 left-3 bg-[color:var(--blush)] text-[color:var(--noir)] text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full font-medium">
              Sale
            </span>
          )}
          {product.tags?.includes("bestseller") && (
            <span className="absolute top-3 right-3 bg-gold-gradient text-[color:var(--noir)] text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full font-medium">
              Bestseller
            </span>
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
          <h3 className="font-serif text-lg text-[color:var(--foreground)] leading-snug">{product.name}</h3>
          {product.tagline && <p className="text-xs text-[color:var(--muted-foreground)]">{product.tagline}</p>}
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
