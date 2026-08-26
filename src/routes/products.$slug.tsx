import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { MessageCircle, ShoppingBag, Heart, Truck, ShieldCheck, Sparkles, Minus, Plus } from "lucide-react";
import { formatPrice, productsQuery, resolveProductImage, type Product } from "@/lib/products";
import { collectionBySlug } from "@/lib/collections";
import { useCart } from "@/lib/cart";
import { whatsappLink } from "@/lib/whatsapp";
import { ProductCard } from "@/components/site/ProductCard";
import { DeliveryEtaChecker } from "@/components/site/DeliveryEtaChecker";
import { ProductGallery } from "@/components/product-gallery";
import { PeopleAlsoViewed, YouMightAlsoLike } from "@/components/recommendations";
import { buildProductGalleryMedia } from "@/lib/product-gallery-media";
import {
  pickPeopleAlsoViewed,
  pickYouMightAlsoLike,
  toRecommendedProduct,
} from "@/lib/product-recommendations";
import { GiftAndBouquetCustomizer } from "@/components/site/GiftAndBouquetCustomizer";
import { formatGiftForWhatsApp, type CustomBouquet, type GiftOptions } from "@/lib/gifting";
import { ReviewSection } from "@/components/site/ReviewSection";
import { PdpAdminUpload } from "@/components/site/PdpAdminUpload";
import { CraftNote } from "@/components/site/CraftNote";
import { pageSeo, SITE_URL } from "@/lib/seo";
import { VirtualTryOn, tryOnModeForCategory } from "@/components/tryon/VirtualTryOn";


export const Route = createFileRoute("/products/$slug")({
  head: ({ params, loaderData }) => {
    const list = (Array.isArray(loaderData) ? loaderData : []) as Product[];
    const product = list.find((p) => p.slug === params.slug);
    const title = product?.name ?? params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const desc =
      product?.description ??
      `Shop ${title} — handmade luxury bouquet by OMORA BLOOMS. Everlasting crochet & pipe-cleaner flowers, gift-boxed with same-day delivery in Bengaluru.`;
    const rawImage = product ? resolveProductImage(product.images?.[0] || product.image_url) : undefined;
    const image = rawImage?.startsWith("http") ? rawImage : undefined;
    const seo = pageSeo({
      path: `/products/${params.slug}`,
      title: `${title} — OMORA BLOOMS`,
      description: desc.slice(0, 155),
      image,
      type: "product",
    });
    return {
      ...seo,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: title,
            description: desc,
            ...(image ? { image } : {}),
            brand: { "@type": "Brand", name: "OMORA BLOOMS" },
            ...(product
              ? {
                  offers: {
                    "@type": "Offer",
                    price: String(product.price),
                    priceCurrency: "INR",
                    availability: product.available
                      ? "https://schema.org/InStock"
                      : "https://schema.org/OutOfStock",
                    url: `${SITE_URL}/products/${params.slug}`,
                  },
                }
              : {}),
          }),
        },
      ],
    };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(productsQuery);
  const product = data.find((p) => p.slug === slug);
  if (!product) throw notFound();

  const collection = collectionBySlug(product.category);
  const img = resolveProductImage(product.images?.[0] || product.image_url);
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [gift, setGift] = useState<GiftOptions | null>(null);
  const [bouquet, setBouquet] = useState<CustomBouquet | null>(null);
  const [addOnTotal, setAddOnTotal] = useState(0);
  const [activeMediaId, setActiveMediaId] = useState<string | null>(null);
  const [tryOnOpen, setTryOnOpen] = useState(false);

  const unitPrice = product.price + addOnTotal;
  const related = data.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  const waMessage = useMemo(() => {
    const base = `Hello OMORA BLOOMS! I'd like to order:\n\n${product.name} × ${qty} — ${formatPrice(unitPrice * qty)}`;
    return base + formatGiftForWhatsApp(gift, bouquet) + `\n\nPlease confirm availability.`;
  }, [product.name, qty, unitPrice, gift, bouquet]);

  // Universal gallery: use uploaded product.images if provided (future admin uploads),
  // otherwise synthesize a 3–4 photo gallery from the main image, collection cover,
  // and related products so every PDP has multi-angle thumbnails today.
  const gallery = useMemo(() => resolveGallery(product, collection?.image, related), [product, collection?.image, related]);

  const galleryMedia = useMemo(
    () =>
      buildProductGalleryMedia({
        photos: gallery,
        productName: product.name,
        productVideo: product.product_video_url,
        packagingVideo: product.packaging_video_url,
      }),
    [gallery, product.name, product.product_video_url, product.packaging_video_url],
  );

  /** Exact image the customer is looking at — sent through checkout to the warehouse. */
  const selectedImage = useMemo(() => {
    const active = galleryMedia.find((m) => m.id === activeMediaId);
    if (active && active.kind !== "video") return active.src;
    if (active?.kind === "video") return active.thumbnail || img;
    return img;
  }, [galleryMedia, activeMediaId, img]);

  const tryOnMode = tryOnModeForCategory(product.category);

  const alsoLike = useMemo(
    () => pickYouMightAlsoLike(data, product).map(toRecommendedProduct),
    [data, product],
  );
  const alsoViewed = useMemo(
    () => pickPeopleAlsoViewed(data, product).map(toRecommendedProduct),
    [data, product],
  );

  return (
    <div className="w-full max-w-full overflow-x-hidden pb-4">
      <div className="container-luxe px-3 pt-4 md:pt-10 text-xs text-[color:var(--muted-foreground)] tracking-widest uppercase">
        <Link to="/" className="hover:text-[color:var(--gold)]">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/shop" className="hover:text-[color:var(--gold)]">Shop</Link>
        {collection && (<>
          <span className="mx-2">/</span>
          <Link to="/collections/$slug" params={{ slug: collection.slug }} className="hover:text-[color:var(--gold)]">{collection.name}</Link>
        </>)}
      </div>

      <section className="container-luxe px-3 grid lg:grid-cols-2 gap-4 md:gap-16 py-4 md:py-16">
        <div>
          <ProductGallery
            items={galleryMedia}
            onActiveChange={setActiveMediaId}
            onTryOn={() => setTryOnOpen(true)}
            tryOnLabel={tryOnMode === "room" ? "View in Room" : "Try-On"}
          />

          <VirtualTryOn
            open={tryOnOpen}
            onClose={() => setTryOnOpen(false)}
            mode={tryOnMode}
            shades={[{ slug: product.slug, name: product.name, image: selectedImage }]}
            activeSlug={product.slug}
            productName={product.name}
          />


          <PdpAdminUpload
            productId={product.id}
            productName={product.name}
            images={(product.images ?? []).filter(Boolean) as string[]}
          />
        </div>




        <div className="min-w-0">
          {collection && <p className="eyebrow mb-2">{collection.name}</p>}
          <h1 className="font-serif text-2xl md:text-5xl leading-tight">{product.name}</h1>
          {product.tagline && <p className="mt-2 text-sm md:text-base text-[color:var(--muted-foreground)]">{product.tagline}</p>}
          <div className="mt-2 md:mt-6 flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl md:text-3xl text-[color:var(--gold)] font-medium">{formatPrice(unitPrice)}</span>
            {product.compare_at_price && (
              <span className="text-base text-[color:var(--muted-foreground)] line-through">{formatPrice(product.compare_at_price)}</span>
            )}
            {addOnTotal > 0 && (
              <span className="text-xs text-[color:var(--muted-foreground)]">(incl. +{formatPrice(addOnTotal)} customization)</span>
            )}
          </div>

          <div className="mt-2 md:mt-4">
            <DeliveryEtaChecker />
          </div>

          {product.description && (
            <p className="mt-2 md:mt-6 text-sm md:text-base text-[color:var(--muted-foreground)] leading-relaxed">{product.description}</p>
          )}

          <GiftAndBouquetCustomizer
            basePrice={product.price}
            onChange={({ gift: g, bouquet: b, addOnTotal: a }) => {
              setGift(g);
              setBouquet(b);
              setAddOnTotal(a);
            }}
          />

          <div className="mt-3 md:mt-8 flex items-center gap-2">
            <div className="flex items-center hairline border rounded-full shrink-0">
              <button className="p-2.5" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease"><Minus className="h-4 w-4" /></button>
              <span className="px-3 min-w-8 text-center">{qty}</span>
              <button className="p-2.5" onClick={() => setQty((q) => q + 1)} aria-label="Increase"><Plus className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="mt-2 flex flex-row w-full gap-2">
            <button
              onClick={() => add({ id: product.id, slug: product.slug, name: product.name, price: unitPrice, image: selectedImage, gift, bouquet }, qty)}
              className="btn-gold flex-1 min-w-0 py-3 px-3 rounded-full text-sm inline-flex items-center justify-center gap-2"
            >
              <ShoppingBag className="h-4 w-4 shrink-0" /> Add to Bag
            </button>
            <a
              href={whatsappLink(waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline-gold flex-1 min-w-0 py-3 px-3 rounded-full text-sm inline-flex items-center justify-center gap-2"
            >
              <MessageCircle className="h-4 w-4 shrink-0" /> WhatsApp
            </a>
          </div>

          <CraftNote className="mt-2" />

          <div className="mt-3 md:mt-10 grid grid-cols-2 gap-2 text-xs">
            <Feature icon={Sparkles} title="Handmade to order" copy="Crafted by our artisans" />
            <Feature icon={Heart} title="Everlasting" copy="Made to last forever" />
            <Feature icon={Truck} title="Same-day delivery" copy="Order before 12 PM" />
            <Feature icon={ShieldCheck} title="Luxury packaging" copy="Signature gift box" />
          </div>
        </div>
      </section>

      <div className="container-luxe px-3 border-t hairline pt-6 md:pt-16 pb-2 space-y-6 md:space-y-14">

        <YouMightAlsoLike products={alsoLike} tone="dark" viewAllHref="/shop" />
        <PeopleAlsoViewed products={alsoViewed} tone="dark" viewAllHref="/shop" />
      </div>

      <ReviewSection productId={product.id} productName={product.name} />

      {related.length > 0 && (
        <section className="container-luxe px-3 pb-10 md:pb-20 border-t hairline pt-6 md:pt-16">
          <div className="flex items-end justify-between mb-3 md:mb-8">
            <div>
              <p className="eyebrow mb-1 md:mb-2">You may also love</p>
              <h2 className="font-serif text-2xl md:text-4xl">Complete the moment</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-8">

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

function resolveGallery(product: Product, collectionImg: string | undefined, related: Product[]): string[] {
  const uploaded = ((product as unknown as { images?: string[] | null }).images ?? [])
    .filter((s): s is string => typeof s === "string" && s.length > 0)
    .map((s) => resolveProductImage(s));
  if (uploaded.length > 0) {
    // Uploaded photos win over the placeholder cover image.
    return Array.from(new Set([...uploaded, resolveProductImage(product.image_url)])).slice(0, 6);
  }
  const fallback = [
    resolveProductImage(product.image_url),
    collectionImg,
    ...related.slice(0, 2).map((r) => resolveProductImage(r.image_url)),
  ].filter((s): s is string => Boolean(s));
  return Array.from(new Set(fallback)).slice(0, 4);
}

