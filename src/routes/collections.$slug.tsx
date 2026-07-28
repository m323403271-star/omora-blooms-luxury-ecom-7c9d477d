import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { collectionBySlug, COLLECTIONS } from "@/lib/collections";
import { SUB_CATALOG, imageForItem, slugify, type SubItem } from "@/lib/subcategories";
import { whatsappLink } from "@/lib/whatsapp";

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
  loader: ({ params }) => {
    if (!collectionBySlug(params.slug) && !SUB_CATALOG[params.slug]) throw notFound();
    return null;
  },
  component: CollectionPage,
});

function ItemCard({ item, slug }: { item: SubItem; slug: string }) {
  const id = slugify(item.title);
  const img = imageForItem(item.query, `${slug}-${id}`);
  const inquiry = whatsappLink(
    `Hello OMORA BLOOMS! I'd like details for:\n\n${item.title}\n(${slug})\n\nPlease share pricing & availability.`,
  );
  return (
    <div className="group relative overflow-hidden rounded-2xl hairline border bg-[color:var(--card)] hover:ring-1 hover:ring-[color:var(--gold)]/60 transition">
      <div className="aspect-[4/5] overflow-hidden bg-black/40 relative">
        <img
          src={img}
          alt={`${item.title} — OMORA BLOOMS`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              `https://source.unsplash.com/600x750/?luxury,flower,bouquet&sig=${id}`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
        <h3 className="font-serif text-lg md:text-xl text-white leading-snug tracking-tight line-clamp-2">
          {item.title}
        </h3>
        <a
          href={inquiry}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[color:var(--gold)]/70 text-[color:var(--gold)] hover:bg-[color:var(--gold)] hover:text-[color:var(--noir)] text-[11px] tracking-[0.18em] uppercase font-semibold px-3.5 py-1.5 transition"
        >
          View Details <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

function CollectionPage() {
  const { slug } = Route.useParams();
  const collection = collectionBySlug(slug);
  const catalog = SUB_CATALOG[slug];
  const name = collection?.name ?? catalog?.eyebrow ?? "Collection";
  const tagline = collection?.tagline ?? "Handcrafted luxury, made to last forever.";
  const heroImg = collection?.image;

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
        {catalog ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {catalog.items.map((it) => (
              <ItemCard key={it.title} item={it} slug={slug} />
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
