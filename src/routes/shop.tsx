import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { productsQuery } from "@/lib/products";
import { COLLECTIONS } from "@/lib/collections";
import { ProductCard } from "@/components/site/ProductCard";
import { pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/shop")({
  head: () => ({
    ...pageSeo({
      path: "/shop",
      title: "Shop — OMORA BLOOMS",
      description: "Browse our luxury handmade bouquets, gift boxes and curated hampers. Crafted to last forever.",
    }),
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: ShopPage,
});

function ShopPage() {
  const { data } = useSuspenseQuery(productsQuery);
  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"featured" | "price-asc" | "price-desc">("featured");

  const filtered = useMemo(() => {
    let list = data;
    if (cat !== "all") list = list.filter((p) => p.category === cat);
    if (q) {
      const t = q.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(t) || p.description?.toLowerCase().includes(t));
    }
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [data, cat, q, sort]);

  return (
    <div>
      <section className="container-luxe pt-14 pb-10 text-center">
        <p className="eyebrow mb-4">The Boutique</p>
        <h1 className="font-serif text-5xl md:text-6xl">Shop the Collection</h1>
        <p className="mt-4 text-[color:var(--muted-foreground)] max-w-xl mx-auto">Every piece handmade to order — crochet flowers, pipe cleaner blooms, luxury gift boxes and curated hampers.</p>
      </section>

      <section className="container-luxe">
        <div className="flex flex-wrap items-center gap-3 border-y hairline py-4">
          <div className="flex-1 min-w-[220px]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search bouquets, hampers, kits..."
              aria-label="Search products"
              type="search"
              className="w-full bg-transparent hairline border rounded-full px-4 py-2.5 text-sm placeholder:text-[color:var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)]"
            />
          </div>
          <select
            aria-label="Sort products"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="bg-transparent hairline border rounded-full px-4 py-2.5 text-sm focus:outline-none"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>

        <div className="flex gap-2 overflow-x-auto py-6 -mx-1 px-1">
          {[{ slug: "all", name: "All" }, ...COLLECTIONS.map((c) => ({ slug: c.slug, name: c.name }))].map((c) => (
            <button
              key={c.slug}
              onClick={() => setCat(c.slug)}
              className={`whitespace-nowrap text-xs tracking-[0.16em] uppercase px-4 py-2 rounded-full border transition ${
                cat === c.slug
                  ? "bg-gold-gradient text-[color:var(--noir)] border-transparent"
                  : "hairline text-[color:var(--muted-foreground)] hover:text-[color:var(--gold)]"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-serif text-3xl">Nothing here yet</p>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-2">Try another category or reach out for a custom order.</p>
            <Link to="/contact" className="btn-outline-gold mt-6 inline-block px-6 py-3 rounded-full text-sm">Contact us</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-8 pb-24">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
