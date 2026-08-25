import { pageSeo } from "@/lib/seo";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { collectionBySlug, COLLECTIONS } from "@/lib/collections";
import { SUB_CATALOG } from "@/lib/subcategories";
import { productsQuery, resolveProductImage, LOCAL_PRODUCTS, type Product } from "@/lib/products";
import { handleImageError } from "@/lib/image-fallback";
import { siteImagesQuery, subcategoryImages } from "@/lib/site-images";


// Maps collection slug → LOCAL_PRODUCTS slugs shown when Supabase has no items
const LOCAL_FALLBACK: Record<string, string[]> = {
  "crochet-bouquets": ["signature-crochet-bouquet"],
  "pipe-cleaner-bouquets": ["pipe-cleaner-flower-art"],
  "airport-collection": ["luxury-airport-welcome-bouquet"],
  "luxury-gift-boxes": ["divine-heritage-luxury-gift-box"],
  "corporate-gifts": ["corporate-luxury-gifting"],
  "baby-collection": ["mini-indoor-plants"],
  "indoor-plants": ["mini-indoor-plants"],
};

export const Route = createFileRoute("/collections/$slug")({
  head: ({ params }) => {
    const c = collectionBySlug(params.slug);
    const cat = SUB_CATALOG[params.slug];
    const title = c?.name ?? cat?.eyebrow ?? "Collection";
    const desc = c?.tagline ?? "OMORA BLOOMS luxury handmade collection.";
    return {
      ...pageSeo({
        path: `/collections/${params.slug}`,
        title: `${title} — OMORA BLOOMS`,
        description: desc,
      }),
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `${title} — OMORA BLOOMS`,
            description: desc,
            url: `https://omorablooms.in/collections/${params.slug}`,
            isPartOf: {
              "@type": "WebSite",
              name: "OMORA BLOOMS",
              url: "https://omorablooms.in",
            },
          }),
        },
      ],
    };
  },
  loader: ({ context, params }) => {
    if (!collectionBySlug(params.slug) && !SUB_CATALOG[params.slug]) throw notFound();
    return context.queryClient.ensureQueryData(productsQuery);
  },
  component: CollectionPage,
});

function ItemCard({ product }: { product: Product }) {
  const img = resolveProductImage(product.images?.[0] || product.image_url);
  return (
    <Link
      to="/varieties/$slug"
      params={{ slug: product.slug }}
      className="group block overflow-hidden rounded-2xl hairline border bg-[color:var(--card)] hover:ring-1 hover:ring-[color:var(--gold)]/60 transition"
    >
      <div className="aspect-square overflow-hidden bg-black/40">
        <img
          src={img}
          alt={`${product.name} — OMORA BLOOMS`}
          loading="lazy"
          decoding="async"
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          onError={handleImageError}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
        />
      </div>
      <div className="p-2 md:p-4">
        <h3 className="font-serif text-sm md:text-xl leading-snug tracking-tight line-clamp-2">
          {product.name}
        </h3>
        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[color:var(--gold)]/70 text-[color:var(--gold)] group-hover:bg-[color:var(--gold)] group-hover:text-[color:var(--noir)] text-[9px] md:text-[11px] tracking-[0.16em] uppercase font-semibold px-2.5 py-1 transition">
          View Details <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

function CollectionPage() {
  const { slug } = Route.useParams();
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: siteImages } = useQuery(siteImagesQuery);
  const gallery = subcategoryImages(siteImages, slug);
  const collection = collectionBySlug(slug);
  const catalog = SUB_CATALOG[slug];
  const name = collection?.name ?? catalog?.eyebrow ?? "Collection";
  const tagline = collection?.tagline ?? "Handcrafted luxury, made to last forever.";
  const heroImg = gallery[0]?.image_url ?? collection?.image;

  const supabaseItems = products.filter((p) => p.category === slug);
  const fallbackSlugs = LOCAL_FALLBACK[slug] ?? [];
  const items =
    supabaseItems.length > 0
      ? supabaseItems
      : LOCAL_PRODUCTS.filter((p) => fallbackSlugs.includes(p.slug));

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <section className="relative h-[28vh] min-h-[200px] md:h-[42vh] md:min-h-[320px] overflow-hidden bg-[color:var(--noir)]">
        {heroImg && (
          <img src={heroImg} alt={name} onError={handleImageError} className="absolute inset-0 h-full w-full object-cover opacity-70" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
        <div className="relative container-luxe px-3 h-full flex flex-col justify-end pb-4 md:pb-10">
          <p className="eyebrow mb-1 md:mb-3 text-[color:var(--gold)]">Collection</p>
          <h1 className="font-serif text-2xl md:text-6xl">{name}</h1>
          <p className="mt-1 md:mt-3 text-xs md:text-base text-[color:var(--muted-foreground)] max-w-xl">{tagline}</p>
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="container-luxe px-3 pt-4 md:pt-16">
          <h2 className="sr-only">{name} gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6">
            {gallery.map((g) => (
              <div key={g.id} className="overflow-hidden rounded-2xl hairline border aspect-[4/5] bg-black/40">
                <img
                  src={g.image_url}
                  alt={`${name} — OMORA BLOOMS`}
                  loading="lazy"
                  decoding="async"
                  onError={handleImageError}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.05]"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="container-luxe px-3 py-4 md:py-16">
        <h2 className="eyebrow mb-2 md:mb-6">Pieces in this collection</h2>
        {items.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6">
            {items.map((p) => (
              <ItemCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 md:py-24">
            <p className="font-serif text-3xl">New pieces coming soon</p>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-2">
              This collection is being crafted with love — get in touch for a bespoke order.
            </p>
            <Link to="/contact" className="btn-gold mt-6 inline-block px-6 py-3 rounded-full text-sm">
              Request bespoke
            </Link>
          </div>
        )}

        <div className="mt-6 md:mt-20 text-center">
          <p className="eyebrow mb-3">Discover more</p>
          <div className="flex flex-wrap justify-center gap-2">
            {COLLECTIONS.filter((c) => c.slug !== slug)
              .slice(0, 6)
              .map((c) => (
                <Link
                  key={c.slug}
                  to="/collections/$slug"
                  params={{ slug: c.slug }}
                  className="btn-outline-gold px-4 py-2 rounded-full text-xs uppercase tracking-widest"
                >
                  {c.name}
                </Link>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
