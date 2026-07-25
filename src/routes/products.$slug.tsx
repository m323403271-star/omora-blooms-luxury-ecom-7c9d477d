import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { MessageCircle, ShoppingBag, Heart, Truck, ShieldCheck, Sparkles, Minus, Plus } from "lucide-react";
import { formatPrice, productsQuery, resolveProductImage, type Product } from "@/lib/products";
import { collectionBySlug } from "@/lib/collections";
import { useCart } from "@/lib/cart";
import { orderOnWhatsApp } from "@/lib/whatsapp";
import { ProductCard } from "@/components/site/ProductCard";
import { DeliveryEtaChecker } from "@/components/site/DeliveryEtaChecker";
import { Media3DViewer } from "@/components/site/Media3DViewer";


export const Route = createFileRoute("/products/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — OMORA BLOOMS` },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(productsQuery);
  const product = data.find((p) => p.slug === slug);
  if (!product) throw notFound();

  const collection = collectionBySlug(product.category);
  const img = resolveProductImage(product.image_url);
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  const related = data.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div>
      <div className="container-luxe pt-10 text-xs text-[color:var(--muted-foreground)] tracking-widest uppercase">
        <Link to="/" className="hover:text-[color:var(--gold)]">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/shop" className="hover:text-[color:var(--gold)]">Shop</Link>
        {collection && (<>
          <span className="mx-2">/</span>
          <Link to="/collections/$slug" params={{ slug: collection.slug }} className="hover:text-[color:var(--gold)]">{collection.name}</Link>
        </>)}
      </div>

      <section className="container-luxe grid lg:grid-cols-2 gap-10 md:gap-16 py-10 md:py-16">
        <div className="glass-card rounded-3xl p-3 md:p-4">
          <img src={img} alt={product.name} className="w-full aspect-square object-cover rounded-2xl" />
        </div>
        <div>
          {collection && <p className="eyebrow mb-3">{collection.name}</p>}
          <h1 className="font-serif text-4xl md:text-5xl leading-tight">{product.name}</h1>
          {product.tagline && <p className="mt-3 text-[color:var(--muted-foreground)]">{product.tagline}</p>}
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl text-[color:var(--gold)] font-medium">{formatPrice(product.price)}</span>
            {product.compare_at_price && (
              <span className="text-lg text-[color:var(--muted-foreground)] line-through">{formatPrice(product.compare_at_price)}</span>
            )}
          </div>

          {product.description && (
            <p className="mt-6 text-[color:var(--muted-foreground)] leading-relaxed">{product.description}</p>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center hairline border rounded-full">
              <button className="p-3" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease"><Minus className="h-4 w-4" /></button>
              <span className="px-3 min-w-8 text-center">{qty}</span>
              <button className="p-3" onClick={() => setQty((q) => q + 1)} aria-label="Increase"><Plus className="h-4 w-4" /></button>
            </div>
            <button
              onClick={() => add({ id: product.id, slug: product.slug, name: product.name, price: product.price, image: img }, qty)}
              className="btn-gold flex-1 py-3.5 px-6 rounded-full text-sm inline-flex items-center justify-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" /> Add to bag
            </button>
          </div>

          <a
            href={orderOnWhatsApp({ name: product.name, price: product.price })}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 btn-outline-gold w-full py-3.5 rounded-full text-sm inline-flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-4 w-4" /> Order on WhatsApp
          </a>

          <div className="mt-6">
            <DeliveryEtaChecker />
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 text-xs">
            <Feature icon={Sparkles} title="Handmade to order" copy="Crafted by our artisans" />
            <Feature icon={Heart} title="Everlasting" copy="Made to last forever" />
            <Feature icon={Truck} title="Same-day delivery" copy="Order before 12 PM" />
            <Feature icon={ShieldCheck} title="Luxury packaging" copy="Signature gift box" />
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="container-luxe pb-20 border-t hairline pt-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="eyebrow mb-2">You may also love</p>
              <h2 className="font-serif text-3xl md:text-4xl">Complete the moment</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function Feature({ icon: Icon, title, copy }: { icon: React.ComponentType<{ className?: string }>; title: string; copy: string }) {
  return (
    <div className="hairline border rounded-xl p-3 flex items-start gap-3">
      <Icon className="h-4 w-4 text-[color:var(--gold)] mt-0.5" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-[color:var(--muted-foreground)]">{copy}</p>
      </div>
    </div>
  );
}
