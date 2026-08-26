import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { VirtualTryOn, tryOnModeForCategory } from "@/components/tryon/VirtualTryOn";
import { productsQuery, formatPrice, LOCAL_PRODUCTS, resolveProductImage } from "@/lib/products";
import { collectionBySlug } from "@/lib/collections";
import { activeVariantsQuery, isSoldOut, type ProductVariantRow } from "@/lib/product-variants";
import { handleImageError } from "@/lib/image-fallback";
import { TryOnBadge } from "@/components/site/TryOnBadge";

export const Route = createFileRoute("/varieties/$slug")({
  head: ({ params }) => {
    const title = params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      meta: [
        { title: `${title} — Pick Your Shade — OMORA BLOOMS` },
        {
          name: "description",
          content: `Choose your colour shade of ${title}. Handcrafted luxury bouquets by OMORA BLOOMS.`,
        },
        { property: "og:title", content: `${title} — Pick Your Shade — OMORA BLOOMS` },
        {
          property: "og:description",
          content: `Choose your colour shade of ${title}. Handcrafted luxury bouquets by OMORA BLOOMS.`,
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: VarietiesPage,
});

function VariantCard({ variant, fallbackImage }: { variant: ProductVariantRow; fallbackImage: string }) {
  const img = variant.images?.[0] || fallbackImage;
  const soldOut = isSoldOut(variant);
  return (
    <Link
      to="/buy/$variant"
      params={{ variant: variant.slug }}
      className="group relative block overflow-hidden rounded-2xl hairline border bg-[color:var(--card)] hover:ring-2 hover:ring-[color:var(--gold)]/70 transition-all duration-300"
    >
      <div className="aspect-square overflow-hidden bg-black/40 relative">
        <img
          src={img}
          alt={variant.name}
          loading="lazy"
          decoding="async"
          onError={handleImageError}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.07]"
        />
        <TryOnBadge />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
        {soldOut ? (
          <span className="absolute left-3 top-3 z-10 rounded-full border border-red-500/40 bg-black/70 px-3 py-1 text-[10px] uppercase tracking-widest text-red-300">
            Sold Out
          </span>
        ) : null}
        {variant.color_name ? (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white/10">
            <span
              className="h-3 w-3 rounded-full flex-shrink-0 ring-1 ring-white/30"
              style={{ backgroundColor: variant.color_hex }}
            />
            <span className="text-[9px] tracking-[0.16em] uppercase text-white/80 font-medium">
              {variant.color_name}
            </span>
          </div>
        ) : null}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="font-serif text-sm md:text-base text-white leading-snug tracking-tight line-clamp-2">
          {variant.name}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[color:var(--gold)] font-medium text-base">{formatPrice(variant.price)}</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--gold)]/60 text-[color:var(--gold)] group-hover:bg-[color:var(--gold)] group-hover:text-[color:var(--noir)] text-[9px] tracking-[0.15em] uppercase font-semibold px-2.5 py-1 transition-colors duration-200">
            Select <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function VarietiesPage() {
  const { slug } = Route.useParams();
  const { data: products } = useSuspenseQuery(productsQuery);

  const product =
    products.find((p) => p.slug === slug) ?? LOCAL_PRODUCTS.find((p) => p.slug === slug);
  if (!product) throw notFound();

  const collection = collectionBySlug(product.category);
  const { data: variants, isLoading } = useQuery(activeVariantsQuery(product.id));
  const list = variants ?? [];
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const [tryOnSlug, setTryOnSlug] = useState("");
  const navigate = useNavigate();
  const tryOnMode = tryOnModeForCategory(product.category);
  const cover = resolveProductImage(product.images?.[0] || product.image_url);

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <section className="relative h-[26vh] min-h-[190px] md:h-[38vh] md:min-h-[280px] overflow-hidden bg-[color:var(--noir)]">
        <img
          src={list[0]?.images?.[0] || cover}
          alt={product.name}
          onError={handleImageError}
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />

        <div className="relative container-luxe pt-8 flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase text-[color:var(--muted-foreground)]">
          <Link to="/" className="hover:text-[color:var(--gold)] transition-colors">Home</Link>
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
          <span className="text-[color:var(--gold)]">Pick Your Shade</span>
        </div>

        <div className="relative container-luxe px-3 h-full flex flex-col justify-end pb-4 md:pb-10">
          <p className="eyebrow mb-2 text-[color:var(--gold)]">Select Your Shade</p>
          <h1 className="font-serif text-2xl md:text-5xl leading-tight">{product.name}</h1>
          <p className="mt-2 text-[color:var(--muted-foreground)] text-sm md:text-base">
            Handcrafted to order — choose the colour you love
          </p>
          {list.length > 0 ? (
            <button
              onClick={() => {
                setTryOnSlug(list[0]!.slug);
                setTryOnOpen(true);
              }}
              className="mt-2 self-start inline-flex items-center gap-1.5 rounded-full border border-[color:var(--gold)]/60 px-4 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[color:var(--gold)] hover:bg-[color:var(--gold)]/10 transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {tryOnMode === "hands" ? "Try-On" : "View in Room"}
            </button>
          ) : null}
        </div>
      </section>

      <section className="container-luxe px-3 py-4 md:py-16">
        <div className="mb-3 md:mb-8 flex items-center justify-between">
          <div>
            <p className="eyebrow mb-1">
              {list.length} {list.length === 1 ? "Shade" : "Shades"} Available
            </p>
            <h2 className="font-serif text-2xl md:text-3xl">Pick your perfect shade</h2>
          </div>
          <div className="hidden md:block text-xs text-[color:var(--muted-foreground)] tracking-wide">
            Tap a shade to view photos & order
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-[color:var(--muted-foreground)]">
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-[color:var(--gold)]/25 bg-[color:var(--gold)]/5 p-10 text-center">
            <h3 className="font-serif text-2xl mb-2">Shades coming soon</h3>
            <p className="text-sm text-[color:var(--muted-foreground)]">
              New colour variants for {product.name} are being added. Please check back shortly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
            {list.map((v) => (
              <VariantCard key={v.id} variant={v} fallbackImage={cover} />
            ))}
          </div>
        )}

        <VirtualTryOn
          open={tryOnOpen}
          onClose={() => setTryOnOpen(false)}
          mode={tryOnMode}
          shades={list.map((v) => ({
            slug: v.slug,
            name: v.name,
            colorName: v.color_name,
            colorHex: v.color_hex,
            image: v.images?.[0] || cover,
          }))}
          activeSlug={tryOnSlug || list[0]?.slug || ""}
          onSelectShade={(slug) => setTryOnSlug(slug)}
          productName={product.name}
        />

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
  );
}
