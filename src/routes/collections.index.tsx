import { pageSeo } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { COLLECTIONS } from "@/lib/collections";

export const Route = createFileRoute("/collections/")({
  head: () => {
    const seo = pageSeo({
      path: "/collections",
      title: 'Collections — OMORA BLOOMS',
      description: 'Explore OMORA BLOOMS collections — crochet bouquets, mother recovery, baby essentials, wedding gifts and more.',
    });
    return {
      ...seo,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Collections — OMORA BLOOMS",
            description:
              "Explore OMORA BLOOMS collections — crochet bouquets, mother recovery, baby essentials, wedding gifts and more.",
            url: "https://omorablooms.in/collections",
            hasPart: COLLECTIONS.map((c) => ({
              "@type": "CollectionPage",
              name: c.name,
              description: c.tagline,
              url: `https://omorablooms.in/collections/${c.slug}`,
            })),
          }),
        },
      ],
    };
  },
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
      <h2 className="sr-only">Browse all OMORA BLOOMS collections</h2>
      <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {COLLECTIONS.map((c) => (
          <Link key={c.slug} to="/collections/$slug" params={{ slug: c.slug }} className="group block overflow-hidden rounded-2xl hairline border bg-[color:var(--card)]">
            <div className="overflow-hidden aspect-square bg-black/40">
              <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="p-2 md:p-4">
              <h3 className="font-serif text-sm md:text-xl line-clamp-2">{c.name}</h3>
              <p className="text-[10px] md:text-xs text-[color:var(--muted-foreground)] mt-0.5 line-clamp-1">{c.tagline}</p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gold-gradient text-[color:var(--noir)] text-[9px] md:text-[10px] tracking-[0.16em] uppercase font-semibold px-2.5 py-1">
                Explore
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
