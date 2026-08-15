import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { productsQuery, resolveProductImage, formatPrice, LOCAL_PRODUCTS } from "@/lib/products";
import { handleImageError } from "@/lib/image-fallback";
import { filterProducts, type ShowcaseSection } from "@/lib/home-showcase";

/**
 * FNP-style themed section: horizontal scrollable category icons that instantly
 * filter the product grid below, in OMORA BLOOMS dark-green + gold styling.
 */
export function HomeShowcaseSection({ section }: { section: ShowcaseSection }) {
  const { data } = useSuspenseQuery(productsQuery);
  const products = data && data.length > 0 ? data : LOCAL_PRODUCTS;

  const [activeId, setActiveId] = useState(section.tabs[0]!.id);
  const active = section.tabs.find((t) => t.id === activeId) ?? section.tabs[0]!;

  const filtered = filterProducts(products, active);
  const items = (filtered.length > 0 ? filtered : products).slice(0, 8);

  return (
    <section className="container-luxe py-6 md:py-12" aria-label={section.title}>
      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 md:mb-6">
        <div className="min-w-0">
          <p className="eyebrow mb-1 text-[color:var(--gold)]">{section.eyebrow}</p>
          <h2 className="font-serif text-xl leading-tight tracking-tight md:text-3xl">
            {section.title}
          </h2>
        </div>
        {active.collection ? (
          <Link
            to="/collections/$slug"
            params={{ slug: active.collection }}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs text-[color:var(--gold)] hover:opacity-80 md:text-sm"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            to="/shop"
            className="shrink-0 inline-flex items-center gap-1.5 text-xs text-[color:var(--gold)] hover:opacity-80 md:text-sm"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Horizontal scrollable category icons */}
      <div
        className="-mx-4 mb-4 flex gap-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0 md:gap-6"
        style={{ scrollbarWidth: "none" }}
        role="tablist"
      >
        {section.tabs.map((t) => {
          const isActive = t.id === active.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(t.id)}
              className="group flex w-[72px] shrink-0 flex-col items-center gap-1.5 md:w-[96px]"
            >
              <span
                className={`relative block h-[62px] w-[62px] overflow-hidden rounded-full ring-1 transition md:h-[80px] md:w-[80px] ${
                  isActive
                    ? "ring-2 ring-[color:var(--gold)] shadow-[0_10px_28px_-12px_rgba(200,162,74,0.9)]"
                    : "ring-[color:var(--gold)]/40 opacity-80 hover:opacity-100"
                }`}
              >
                <img
                  src={t.image}
                  alt={t.label}
                  loading="lazy"
                  decoding="async"
                  onError={handleImageError}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </span>
              <span
                className={`line-clamp-2 text-center text-[10px] leading-tight md:text-[11px] ${
                  isActive
                    ? "text-[color:var(--gold)]"
                    : "text-[color:var(--muted-foreground)]"
                }`}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
        {items.map((p) => {
          const off =
            p.compare_at_price && p.compare_at_price > p.price
              ? Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100)
              : null;
          return (
            <Link
              key={`${active.id}-${p.id}`}
              to="/products/$slug"
              params={{ slug: p.slug }}
              className="group flex flex-col overflow-hidden rounded-2xl border hairline bg-[color:var(--card)] transition hover:ring-1 hover:ring-[color:var(--gold)]/60"
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={resolveProductImage(p.image_url)}
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
                <h3 className="line-clamp-2 font-serif text-[13px] leading-snug md:text-base">
                  {p.name}
                </h3>
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

      {section.ctaLabel ? (
        <div className="mt-5 flex justify-center md:mt-8">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--noir)] shadow-[0_14px_30px_-16px_rgba(200,162,74,0.9)] transition hover:opacity-90 md:text-sm"
          >
            {section.ctaLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}
    </section>
  );
}
