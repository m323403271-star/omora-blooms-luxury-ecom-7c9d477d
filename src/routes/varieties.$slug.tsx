import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, ChevronRight, Bell } from "lucide-react";
import { productsQuery, formatPrice, LOCAL_PRODUCTS } from "@/lib/products";
import { collectionBySlug } from "@/lib/collections";
import { getVariantsByProductSlug, type ProductVariant } from "@/lib/variants";
import { NotifyMeModal } from "@/components/site/NotifyMeModal";
import { COMING_SOON } from "@/lib/launch-config";

export const Route = createFileRoute("/varieties/$slug")({
  head: ({ params }) => {
    const title = params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      meta: [
        { title: `${title} — Choose Your Shade — OMORA BLOOMS` },
        {
          name: "description",
          content: `Explore 10 exclusive colour varieties of ${title}. Handcrafted luxury bouquets by OMORA BLOOMS.`,
        },
      ],
    };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: VarietiesPage,
});

// ─── Variant Card ─────────────────────────────────────────────────────────────
function VariantCard({
  variant,
  onNotify,
}: {
  variant: ProductVariant;
  onNotify: (v: ProductVariant) => void;
}) {
  const cardBody = (
    <>
      {/* Product image */}
      <div className="aspect-[4/5] overflow-hidden bg-black/40 relative">
        <img
          src={variant.image}
          alt={variant.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.07]"
        />
        {/* Color tint overlay */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 group-hover:opacity-50"
          style={{
            backgroundColor: variant.colorHex,
            mixBlendMode: "multiply",
            opacity: 0.38,
          }}
        />
        {/* Dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

        {/* Color swatch badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white/10">
          <span
            className="h-3 w-3 rounded-full flex-shrink-0 ring-1 ring-white/30"
            style={{ backgroundColor: variant.colorHex }}
          />
          <span className="text-[9px] tracking-[0.16em] uppercase text-white/80 font-medium">
            {variant.colorName}
          </span>
        </div>

        {/* Coming Soon badge — only shown when COMING_SOON = true */}
        {COMING_SOON && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-[color:var(--gold)] text-[color:var(--noir)] rounded-full px-2.5 py-1">
            <span className="text-[8px] tracking-[0.18em] uppercase font-bold">Coming Soon</span>
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="font-serif text-sm md:text-base text-white leading-snug tracking-tight line-clamp-2">
          {variant.name}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[color:var(--gold)] font-medium text-base">
            {formatPrice(variant.price)}
          </span>

          {COMING_SOON ? (
            /* Notify Me CTA */
            <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--gold)]/60 text-[color:var(--gold)] group-hover:bg-[color:var(--gold)] group-hover:text-[color:var(--noir)] text-[9px] tracking-[0.15em] uppercase font-semibold px-2.5 py-1 transition-colors duration-200">
              <Bell className="h-3 w-3" /> Notify Me
            </span>
          ) : (
            /* Live: Select CTA */
            <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--gold)]/60 text-[color:var(--gold)] group-hover:bg-[color:var(--gold)] group-hover:text-[color:var(--noir)] text-[9px] tracking-[0.15em] uppercase font-semibold px-2.5 py-1 transition-colors duration-200">
              Select <ArrowRight className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
    </>
  );

  const baseClass =
    "group relative block overflow-hidden rounded-2xl hairline border bg-[color:var(--card)] hover:ring-2 hover:ring-[color:var(--gold)]/70 transition-all duration-300";

  if (COMING_SOON) {
    return (
      <button
        type="button"
        onClick={() => onNotify(variant)}
        className={`${baseClass} w-full text-left`}
      >
        {cardBody}
      </button>
    );
  }

  return (
    <Link
      to="/buy/$variant"
      params={{ variant: variant.slug }}
      className={baseClass}
    >
      {cardBody}
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function VarietiesPage() {
  const { slug } = Route.useParams();
  const { data: products } = useSuspenseQuery(productsQuery);
  const [notifyVariant, setNotifyVariant] = useState<ProductVariant | null>(null);

  const product =
    products.find((p) => p.slug === slug) ?? LOCAL_PRODUCTS.find((p) => p.slug === slug);
  if (!product) throw notFound();

  const collection = collectionBySlug(product.category);
  const variants = getVariantsByProductSlug(slug, product.name, product.price, product.category);

  return (
    <>
      {/* Notify Me modal — rendered outside normal flow so it overlays everything */}
      <NotifyMeModal
        open={notifyVariant !== null}
        onClose={() => setNotifyVariant(null)}
        productName={notifyVariant?.name}
      />

      <div>
        {/* Hero banner */}
        <section className="relative h-[38vh] min-h-[280px] overflow-hidden bg-[color:var(--noir)]">
          <img
            src={variants[0]?.image ?? ""}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />

          {/* Coming Soon hero banner */}
          {COMING_SOON && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
              <div className="flex items-center gap-2 bg-[color:var(--gold)]/10 border border-[color:var(--gold)]/40 backdrop-blur-sm rounded-full px-5 py-2">
                <span
                  className="h-2 w-2 rounded-full bg-[color:var(--gold)] animate-pulse"
                />
                <span className="text-[color:var(--gold)] text-[11px] tracking-[0.2em] uppercase font-semibold">
                  Launching Soon — Get Notified
                </span>
              </div>
            </div>
          )}

          {/* Breadcrumb */}
          <div className="relative container-luxe pt-8 flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase text-[color:var(--muted-foreground)]">
            <Link to="/" className="hover:text-[color:var(--gold)] transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            {collection ? (
              <>
                <Link
                  to="/collections/$slug"
                  params={{ slug: collection.slug }}
                  className="hover:text-[color:var(--gold)] transition-colors"
                >
                  {collection.name}
                </Link>
                <ChevronRight className="h-3 w-3" />
              </>
            ) : null}
            <span className="text-[color:var(--gold)]">Choose Variety</span>
          </div>

          <div className="relative container-luxe h-full flex flex-col justify-end pb-10">
            <p className="eyebrow mb-2 text-[color:var(--gold)]">Select Your Shade</p>
            <h1 className="font-serif text-3xl md:text-5xl leading-tight">{product.name}</h1>
            <p className="mt-2 text-[color:var(--muted-foreground)] text-sm md:text-base">
              10 exclusive colour varieties — handcrafted to order
            </p>
          </div>
        </section>

        {/* Variant grid */}
        <section className="container-luxe py-12 md:py-16">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="eyebrow mb-1">10 Varieties Available</p>
              <h2 className="font-serif text-2xl md:text-3xl">Pick your perfect shade</h2>
            </div>
            <div className="hidden md:block text-xs text-[color:var(--muted-foreground)] tracking-wide">
              {COMING_SOON ? "Click any card to get notified" : "Hover to preview · Click to order"}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
            {variants.map((v) => (
              <VariantCard key={v.slug} variant={v} onNotify={setNotifyVariant} />
            ))}
          </div>

          {/* Coming Soon CTA strip */}
          {COMING_SOON && (
            <div className="mt-12 rounded-2xl border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/5 p-8 text-center">
              <p className="eyebrow text-[color:var(--gold)] mb-2">Be First in Line</p>
              <h3 className="font-serif text-2xl mb-3">We're putting the final touches on our store</h3>
              <p className="text-[color:var(--muted-foreground)] text-sm mb-6 max-w-md mx-auto">
                Leave your number and we'll SMS you the moment orders open — along with an exclusive early-access offer.
              </p>
              <button
                onClick={() => setNotifyVariant({ slug: "", name: product.name, price: 0, colorName: "", colorHex: "", image: "", parentName: product.name, parentSlug: slug, collectionSlug: "" })}
                className="btn-gold inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm"
              >
                <Bell className="h-4 w-4" /> Notify Me at Launch
              </button>
            </div>
          )}

          {/* Trust signals */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Handcrafted", sub: "Made to order, by artisans" },
              { label: "Everlasting", sub: "Blooms that last forever" },
              { label: "Same-day", sub: "Order before 12 PM" },
              { label: "Luxury box", sub: "Signature gift packaging" },
            ].map((f) => (
              <div key={f.label} className="hairline border rounded-xl p-4 text-center">
                <p className="font-serif text-base text-[color:var(--gold)]">{f.label}</p>
                <p className="text-xs text-[color:var(--muted-foreground)] mt-1">{f.sub}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
