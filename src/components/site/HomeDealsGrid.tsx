import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { productsQuery, resolveProductImage, formatPrice, LOCAL_PRODUCTS } from "@/lib/products";
import { handleImageError } from "@/lib/image-fallback";

/**
 * FNP-style product grid: clean cards, tight spacing and prominent pricing.
 */
export function HomeDealsGrid({
  title = "Trending Now",
  eyebrow = "Handpicked for you",
  limit = 8,
}: {
  title?: string;
  eyebrow?: string;
  limit?: number;
}) {
  const { data } = useSuspenseQuery(productsQuery);
  const catalog = data && data.length > 0 ? data : LOCAL_PRODUCTS;
  // Trending feed comes straight from the catalog flag, with a graceful fallback.
  const trending = catalog.filter((p) => p.is_trending);
  const products = (trending.length > 0 ? trending : catalog).slice(0, limit);

  return (
    <section className="container-luxe py-7 md:py-14">
      <div className="mb-4 flex items-end justify-between gap-4 md:mb-7">
        <div className="min-w-0">
          <p className="eyebrow mb-1.5 text-[color:var(--gold)]">{eyebrow}</p>
          <h2 className="font-serif text-2xl leading-tight tracking-tight md:text-4xl">{title}</h2>
        </div>
        <Link
          to="/shop"
          className="shrink-0 inline-flex items-center gap-1.5 text-xs text-[color:var(--gold)] hover:opacity-80 md:text-sm"
        >
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div
        className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory md:mx-0 md:px-0 md:gap-5"
        style={{ scrollbarWidth: "none" }}
      >
        {products.map((p) => {
          const img = resolveProductImage(p.image_url);
          const off =
            p.compare_at_price && p.compare_at_price > p.price
              ? Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100)
              : null;
          return (
            <Link
              key={p.id}
              to="/products/$slug"
              params={{ slug: p.slug }}
              className="group flex w-[46%] max-w-[220px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border hairline bg-[color:var(--card)] transition hover:ring-1 hover:ring-[color:var(--gold)]/60 sm:w-[38%] md:w-[26%] lg:w-[23%]"
            >

              <div className="relative aspect-square overflow-hidden">
                <img
                  src={img}
                  alt={`${p.name} — OMORA BLOOMS`}
                  loading="lazy"
                  decoding="async"
                  onError={handleImageError}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {off ? (
                  <span className="absolute left-2 top-2 rounded-full bg-gold-gradient px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--noir)] shadow">
                    {off}% Off
                  </span>
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-2.5 md:p-3.5">
                <h3 className="line-clamp-2 font-serif text-[13px] leading-snug md:text-base">{p.name}</h3>
                <div className="mt-auto flex items-baseline gap-1.5 pt-1">
                  <span className="text-base font-semibold text-[color:var(--gold)] md:text-lg">
                    {formatPrice(p.price)}
                  </span>
                  {p.compare_at_price ? (
                    <span className="text-[11px] text-[color:var(--muted-foreground)] line-through">
                      {formatPrice(p.compare_at_price)}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
