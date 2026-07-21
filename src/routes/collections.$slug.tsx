import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { productsQuery } from "@/lib/products";
import { collectionBySlug, COLLECTIONS } from "@/lib/collections";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/collections/$slug")({
  head: ({ params }) => {
    const c = collectionBySlug(params.slug);
    return {
      meta: [
        { title: `${c?.name ?? "Collection"} — OMORA BLOOMS` },
        { name: "description", content: c?.tagline ?? "OMORA BLOOMS luxury handmade collection." },
      ],
    };
  },
  loader: ({ context, params }) => {
    if (!collectionBySlug(params.slug)) throw notFound();
    return context.queryClient.ensureQueryData(productsQuery);
  },
  component: CollectionPage,
});

function CollectionPage() {
  const { slug } = Route.useParams();
  const collection = collectionBySlug(slug)!;
  const { data } = useSuspenseQuery(productsQuery);
  const items = data.filter((p) => p.category === slug);

  return (
    <div>
      <section className="relative h-[46vh] min-h-[360px] overflow-hidden">
        <img src={collection.image} alt={collection.name} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
        <div className="relative container-luxe h-full flex flex-col justify-end pb-10">
          <p className="eyebrow mb-3">Collection</p>
          <h1 className="font-serif text-5xl md:text-7xl">{collection.name}</h1>
          <p className="mt-3 text-[color:var(--muted-foreground)] max-w-xl">{collection.tagline}</p>
        </div>
      </section>

      <section className="container-luxe py-16">
        {items.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-serif text-3xl">New pieces coming soon</p>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-2">This collection is being crafted with love — get in touch for a bespoke order.</p>
            <Link to="/contact" className="btn-gold mt-6 inline-block px-6 py-3 rounded-full text-sm">Request bespoke</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-8">
            {items.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        <div className="mt-20 text-center">
          <p className="eyebrow mb-3">Discover more</p>
          <div className="flex flex-wrap justify-center gap-2">
            {COLLECTIONS.filter((c) => c.slug !== slug).slice(0, 6).map((c) => (
              <Link key={c.slug} to="/collections/$slug" params={{ slug: c.slug }} className="btn-outline-gold px-4 py-2 rounded-full text-xs uppercase tracking-widest">
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
