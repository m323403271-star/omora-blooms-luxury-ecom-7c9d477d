import { pageSeo } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { COLLECTIONS } from "@/lib/collections";

export const Route = createFileRoute("/collections/")({
  head: () => ({
    ...pageSeo({
      path: "/collections",
      title: 'Collections — OMORA BLOOMS',
      description: 'Explore OMORA BLOOMS collections — crochet bouquets, mother recovery, baby essentials, wedding gifts and more.',
    }),
  }),
  component: CollectionsIndex,
});

function CollectionsIndex() {
  return (
    <div className="container-luxe py-16 md:py-24">
      <div className="text-center max-w-2xl mx-auto">
        <p className="eyebrow mb-4">Our Collections</p>
        <h1 className="font-serif text-5xl md:text-6xl">Curated for every occasion</h1>
        <p className="mt-4 text-[color:var(--muted-foreground)]">Discover luxury handmade collections thoughtfully crafted for life's most meaningful moments.</p>
      </div>
      <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {COLLECTIONS.map((c) => (
          <Link key={c.slug} to="/collections/$slug" params={{ slug: c.slug }} className="group block">
            <div className="relative overflow-hidden rounded-2xl aspect-[4/5] hairline border">
              <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-serif text-xl md:text-2xl">{c.name}</h3>
                <p className="text-xs text-[color:var(--muted-foreground)] mt-1">{c.tagline}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
