import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { collectionBySlug, COLLECTIONS } from "@/lib/collections";
import { SUB_CATALOG } from "@/lib/subcategories";
import { productsQuery, resolveProductImage, type Product } from "@/lib/products";
import { handleImageError } from "@/lib/image-fallback";

export const Route = createFileRoute("/collections/$slug")({
  head: ({ params }) => {
    const c = collectionBySlug(params.slug);
    const cat = SUB_CATALOG[params.slug];
    const title = c?.name ?? cat?.eyebrow ?? "Collection";
    const desc = c?.tagline ?? "OMORA BLOOMS luxury handmade collection.";
    return {
      meta: [
        { title: `${title} — OMORA BLOOMS` },
        { name: "description", content: desc },
        { property: "og:title", content: `${title} — OMORA BLOOMS` },
        { property: "og:description", content: desc },
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
      to="/products/$slug"
      params={{ slug: product.slug }}
      className="group relative block overflow-hidden rounded-2xl hairline border bg-[color:var(--card)] hover:ring-1 hover:ring-[color:var(--gold)]/60 transition"
    >
      <div className="aspect-[4/5] overflow-hidden bg-black/40 relative">
        <img
          src={img}
          alt={`${product.name} — OMORA BLOOMS`}
          loading="lazy"
          decoding="async"
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          onError={handleImageError}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
        <h3 className="font-serif text-base md:text-xl text-white leading-snug tracking-tight line-clamp-2">
          {product.name}
        </h3>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[color:var(--gold)]/70 text-[color:var(--gold)] group-hover:bg-[color:var(--gold)] group-hover:text-[color:var(--noir)] text-[10px] md:text-[11px] tracking-[0.18em] uppercase font-semibold px-3.5 py-1.5 transition">
          View Details <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

function CollectionPage() {
  const { slug } = Route.useParams();
  const { data: products } = useSuspenseQuery(productsQuery);
  const collection = collectionBySlug(slug);
  const catalog = SUB_CATALOG[slug];
  const name = collection?.name ?? catalog?.eyebrow ?? "Collection";
  const tagline = collection?.tagline ?? "Handcrafted luxury, made to last forever.";
  const heroImg = collection?.image;

  const items = products.filter((p) => p.category === slug);

  return (
    <div>
      <section className="relative h-[42vh] min-h-[320px] overflow-hidden bg-[color:var(--noir)]">
        {heroImg && (
          <img src={heroImg} alt={name} className="absolute inset-0 h-full w-full object-cover opacity-70" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
        <div className="relative container-luxe h-full flex flex-col justify-end pb-10">
          <p className="eyebrow mb-3 text-[color:var(--gold)]">Collection</p>
          <h1 className="font-serif text-4xl md:text-6xl">{name}</h1>
          <p className="mt-3 text-[color:var(--muted-foreground)] max-w-xl">{tagline}</p>
        </div>
      </section>

      <section className="container-luxe py-12 md:py-16">
        {items.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {items.map((p) => (
              <ItemCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="font-serif text-3xl">New pieces coming soon</p>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-2">
              This collection is being crafted with love — get in touch for a bespoke order.
            </p>
            <Link to="/contact" className="btn-gold mt-6 inline-block px-6 py-3 rounded-full text-sm">
              Request bespoke
            </Link>
          </div>
        )}

        <div className="mt-16 md:mt-20 text-center">
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
