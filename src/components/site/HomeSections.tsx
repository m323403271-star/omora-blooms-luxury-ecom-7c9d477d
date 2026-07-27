import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, MessageCircle, Sparkles, Package, Truck, Heart, Gem, Award } from "lucide-react";

import heroBouquet from "@/assets/hero-bouquet.jpg";
import eternalBondBanner from "@/assets/banner-eternal-bond.jpg";
import giftboxImg from "@/assets/collection-giftbox.jpg";
import { COLLECTIONS } from "@/lib/collections";
import { LOCAL_PRODUCTS, productsQuery, resolveProductImage } from "@/lib/products";
import { whatsappLink } from "@/lib/whatsapp";
import { ProductCard } from "@/components/site/ProductCard";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="container-luxe grid lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-14 pb-20 lg:pt-24 lg:pb-32">
        <div className="relative z-10 max-w-xl">
          <p className="eyebrow mb-6">Est. Handmade Luxury · India · Worldwide</p>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
            Luxury Handmade <span className="text-gold-gradient italic">Bouquets</span> That Last Forever
          </h1>
          <p className="mt-6 text-base md:text-lg text-[color:var(--muted-foreground)] leading-relaxed max-w-lg">
            Beautiful crochet flowers, pipe cleaner bouquets, mother recovery kits and baby essentials — thoughtfully handcrafted for every special occasion.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop" className="btn-gold px-8 py-3.5 rounded-full text-sm inline-flex items-center gap-2">
              Shop Now <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={whatsappLink("Hello OMORA BLOOMS! I'd like to place an order.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline-gold px-8 py-3.5 rounded-full text-sm inline-flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" /> Order on WhatsApp
            </a>
          </div>
          <div className="mt-10 flex items-center gap-6 text-xs text-[color:var(--muted-foreground)]">
            <span className="inline-flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-[color:var(--gold)]" /> Handmade to order</span>
            <span className="inline-flex items-center gap-2"><Package className="h-3.5 w-3.5 text-[color:var(--gold)]" /> Luxury packaging</span>
            <span className="inline-flex items-center gap-2 hidden sm:inline-flex"><Truck className="h-3.5 w-3.5 text-[color:var(--gold)]" /> Same-day delivery</span>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-10 bg-gradient-to-br from-[color:var(--gold)]/20 via-transparent to-[color:var(--blush)]/10 blur-3xl -z-10" />
          <div className="glass-card rounded-3xl p-3 md:p-4">
            <img
              src={heroBouquet}
              alt="Luxury OMORA BLOOMS handmade bouquet"
              className="w-full h-[520px] md:h-[620px] object-cover rounded-2xl"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 glass-card rounded-2xl px-5 py-4 hidden md:block">
            <p className="eyebrow">Bestseller</p>
            <p className="font-serif text-lg mt-1">Signature Crochet Bouquet</p>
            <p className="text-[color:var(--gold)] text-sm mt-0.5">from ₹3,499</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Marquee() {
  const items = ["Handmade with Love", "Crafted to Last Forever", "Luxury Packaging", "Worldwide Shipping", "Personalized Gifting", "Same-Day Delivery"];
  return (
    <div className="border-y hairline py-4 overflow-hidden bg-[color:var(--noir)]/60">
      <div className="flex gap-12 animate-[marquee_30s_linear_infinite] whitespace-nowrap">
        {[...items, ...items, ...items].map((t, i) => (
          <span key={`${t}-${i}`} className="eyebrow inline-flex items-center gap-3">
            <span className="text-[color:var(--gold)]">✦</span> {t}
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

export function HomeThreeProductsSection() {
  const featured = COLLECTIONS.filter((c) =>
    ["crochet-bouquets", "frames-vases", "pipe-cleaner-bouquets"].includes(c.slug)
  );
  return (
    <section className="container-luxe py-12 md:py-16">
      <div className="text-center max-w-2xl mx-auto mb-6 md:mb-10">
        <p className="eyebrow mb-3">Signature Collections</p>
        <h2 className="font-serif text-2xl md:text-4xl leading-tight">Handcrafted, Everlasting Luxury</h2>
      </div>
      <div
        className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth"
        style={{ scrollbarWidth: "thin" }}
      >
        {featured.map((c) => (
          <Link
            key={c.slug}
            to="/collections/$slug"
            params={{ slug: c.slug }}
            className="group relative snap-start shrink-0 w-[45%] sm:w-[32%] md:w-[24%] lg:w-[20%] rounded-2xl overflow-hidden hairline border bg-[color:var(--card)] hover:ring-1 hover:ring-[color:var(--gold)]/60 transition"
          >
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-2.5 md:p-3 bg-gradient-to-t from-black/90 via-black/55 to-transparent">
              <p className="eyebrow text-[color:var(--gold)] text-[9px] md:text-[10px] mb-0.5">{c.tagline}</p>
              <h3 className="font-serif text-[12px] md:text-sm text-white leading-snug line-clamp-2">{c.name}</h3>
              <span className="mt-1 inline-flex items-center gap-1 text-[10px] md:text-xs text-white/90">
                Explore <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function EternalBondBanner() {
  return (
    <section className="container-luxe pb-4 md:pb-8 -mt-6 md:-mt-10">
      <Link
        to="/products/$slug"
        params={{ slug: "eternal-bond-luxury-kit" }}
        className="group relative block overflow-hidden rounded-3xl hairline border ring-1 ring-[color:var(--gold)]/40 shadow-[0_30px_80px_-30px_rgba(200,162,74,0.55)] transition-shadow duration-500 hover:shadow-[0_40px_100px_-30px_rgba(200,162,74,0.7)]"
      >
        <div className="relative aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/9]">
          <img
            src={eternalBondBanner}
            alt="The Eternal Bond Luxury Kit — royal luxury gift combo for new mother and newborn baby | OMORA BLOOMS"
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/30 md:bg-gradient-to-r md:from-black/85 md:via-black/45 md:to-transparent" />
          <span className="hidden md:inline-flex absolute top-6 left-8 items-center gap-1.5 rounded-full bg-gold-gradient text-[color:var(--noir)] text-[10px] tracking-[0.22em] uppercase font-semibold px-3 py-1.5 shadow-lg">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--noir)]" /> Most Gifted for Naming Ceremonies
          </span>
          <div className="absolute inset-0 flex items-end md:items-center">
            <div className="p-5 sm:p-8 md:p-14 w-full md:max-w-2xl">
              <span className="md:hidden inline-flex items-center gap-1.5 rounded-full bg-gold-gradient text-[color:var(--noir)] text-[9px] tracking-[0.2em] uppercase font-semibold px-2.5 py-1 shadow-lg mb-3">
                <span className="h-1 w-1 rounded-full bg-[color:var(--noir)]" /> Most Gifted · Naming Ceremonies
              </span>
              <p className="eyebrow mb-2 md:mb-4 text-[color:var(--gold)] text-[0.6rem] md:text-[0.7rem]">Exclusively for Mom &amp; Baby</p>
              <h3 className="font-serif text-[1.75rem] leading-[1.1] sm:text-4xl md:text-5xl lg:text-6xl md:leading-[1.05] tracking-tight">
                The Eternal Bond<br className="hidden sm:block" /> Luxury Kit
              </h3>
              <p className="mt-3 md:mt-5 text-[13px] md:text-base text-white/85 max-w-lg leading-relaxed line-clamp-3 md:line-clamp-none">
                A royal luxury gift combo thoughtfully curated for both the New Mother and the Newborn Baby — everlasting crochet bouquet, mother recovery wellness, baby essentials, in a signature OMORA heritage box.
              </p>
              <div className="mt-5 md:mt-8 flex flex-wrap items-center gap-2.5 md:gap-3">
                <span className="btn-gold inline-flex items-center gap-2 px-6 md:px-7 py-3 md:py-3.5 rounded-full text-sm font-medium">
                  Buy Now <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="btn-outline-gold inline-flex items-center gap-2 px-6 md:px-7 py-3 md:py-3.5 rounded-full text-sm">
                  Shop the Kit
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}

export function FeaturedCarousel() {
  const items = [
    {
      key: "crochet",
      title: "Crochet Bouquets",
      image: COLLECTIONS.find((c) => c.slug === "crochet-bouquets")!.image,
      to: "/collections/$slug" as const,
      params: { slug: "crochet-bouquets" },
      price: "from ₹3,499",
    },
    {
      key: "frames",
      title: "Everlasting Floral Frames & Vases",
      image: COLLECTIONS.find((c) => c.slug === "frames-vases")!.image,
      to: "/collections/$slug" as const,
      params: { slug: "frames-vases" },
      price: "from ₹2,299",
    },
    {
      key: "pipecleaner",
      title: "Pipe Cleaner Flower Bouquets",
      image: COLLECTIONS.find((c) => c.slug === "pipe-cleaner-bouquets")!.image,
      to: "/collections/$slug" as const,
      params: { slug: "pipe-cleaner-bouquets" },
      price: "from ₹1,899",
    },
    {
      key: "divine",
      title: "Divine Heritage Luxury Gift Box",
      image: resolveProductImage(LOCAL_PRODUCTS.find((p) => p.slug === "divine-heritage-luxury-gift-box")!.image_url),
      to: "/products/$slug" as const,
      params: { slug: "divine-heritage-luxury-gift-box" },
      price: "₹3,999",
    },
    {
      key: "plants",
      title: "Mini Indoor Plants",
      image: COLLECTIONS.find((c) => c.slug === "indoor-plants")!.image,
      to: "/collections/$slug" as const,
      params: { slug: "indoor-plants" },
      price: "from ₹1,299",
    },
    {
      key: "airport",
      title: "Luxury Airport Welcome Bouquet",
      image: resolveProductImage(LOCAL_PRODUCTS.find((p) => p.slug === "luxury-airport-welcome-bouquet")!.image_url),
      to: "/products/$slug" as const,
      params: { slug: "luxury-airport-welcome-bouquet" },
      price: "₹2,499",
    },
  ];

  return (
    <section className="container-luxe py-10 md:py-14">
      <div className="flex items-end justify-between mb-5 md:mb-7">
        <div>
          <p className="eyebrow mb-2 text-[color:var(--gold)]">Curated Picks</p>
          <h2 className="font-serif text-2xl md:text-4xl leading-tight">Signature Highlights</h2>
        </div>
        <Link to="/shop" className="hidden md:inline-flex items-center gap-1.5 text-sm text-[color:var(--gold)] hover:opacity-80">
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div
        className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth"
        style={{ scrollbarWidth: "thin" }}
      >
        {items.map((it) => (
          <Link
            key={it.key}
            to={it.to}
            params={it.params}
            className="group relative snap-start shrink-0 w-[42%] sm:w-[30%] md:w-[22%] lg:w-[18%] rounded-2xl overflow-hidden hairline border bg-[color:var(--card)] hover:ring-1 hover:ring-[color:var(--gold)]/60 transition"
          >
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={it.image}
                alt={`${it.title} — OMORA BLOOMS`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-2.5 md:p-3 bg-gradient-to-t from-black/90 via-black/55 to-transparent">
              <h3 className="font-serif text-[12px] md:text-sm text-white leading-snug line-clamp-2">{it.title}</h3>
              <p className="mt-0.5 text-[color:var(--gold)] text-[11px] md:text-xs font-medium">{it.price}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}


export function BestSellers() {
  const { data } = useSuspenseQuery(productsQuery);
  const products = (data && data.length > 0 ? data : LOCAL_PRODUCTS).slice(0, 8);
  return (
    <section className="container-luxe py-16 md:py-24">
      <div className="flex items-end justify-between mb-8 md:mb-12">
        <div>
          <p className="eyebrow mb-3">Bestsellers</p>
          <h2 className="font-serif text-3xl md:text-5xl leading-tight">Loved by Our Customers</h2>
        </div>
        <Link to="/shop" className="hidden md:inline-flex items-center gap-1.5 text-sm text-[color:var(--gold)] hover:opacity-80">
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-5 md:gap-6 grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}


export function StoryBand() {
  return (
    <section className="container-luxe py-16 md:py-24">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div>
          <p className="eyebrow mb-4">Our Story</p>
          <h2 className="font-serif text-3xl md:text-5xl leading-tight">Handmade with Love, Crafted to Last Forever</h2>
          <p className="mt-5 text-[color:var(--muted-foreground)] leading-relaxed">
            Every OMORA piece is thoughtfully handcrafted in India by skilled artisans. From crochet bouquets to heritage gift boxes, our creations turn everyday moments into forever memories.
          </p>
          <Link to="/about" className="mt-6 inline-flex items-center gap-1.5 text-sm text-[color:var(--gold)]">
            Discover the Craft <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="glass-card rounded-3xl p-3">
          <img src={heroBouquet} alt="OMORA BLOOMS artisan craft" loading="lazy" decoding="async" className="w-full h-[420px] object-cover rounded-2xl" />
        </div>
      </div>
    </section>
  );
}

export function FeatureGrid() {
  const items = [
    { icon: Heart, title: "Handmade to Order", desc: "Each piece uniquely crafted for you" },
    { icon: Gem, title: "Premium Materials", desc: "Only the finest yarn, silk & metals" },
    { icon: Award, title: "Luxury Packaging", desc: "Signature OMORA heritage box" },
    { icon: Truck, title: "Fast Delivery", desc: "Same-day in Bengaluru, worldwide shipping" },
  ];
  return (
    <section className="container-luxe py-12 md:py-16">
      <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="glass-card rounded-2xl p-5 md:p-6 text-center">
            <Icon className="h-6 w-6 mx-auto text-[color:var(--gold)]" />
            <p className="mt-3 font-serif text-lg">{title}</p>
            <p className="mt-1.5 text-xs text-[color:var(--muted-foreground)] leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PackagingBand() {
  return (
    <section className="container-luxe py-16 md:py-24">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div className="glass-card rounded-3xl p-3 order-2 md:order-1">
          <img src={giftboxImg} alt="OMORA BLOOMS signature luxury packaging" loading="lazy" decoding="async" className="w-full h-[420px] object-cover rounded-2xl" />
        </div>
        <div className="order-1 md:order-2">
          <p className="eyebrow mb-4">Signature Packaging</p>
          <h2 className="font-serif text-3xl md:text-5xl leading-tight">Unboxing, Reimagined</h2>
          <p className="mt-5 text-[color:var(--muted-foreground)] leading-relaxed">
            Every order arrives in our signature OMORA heritage box — matte black finish, gold-foil crest, and satin ribbon. A gift within a gift.
          </p>
        </div>
      </div>
    </section>
  );
}

export function DeliveryBand() {
  return (
    <section className="container-luxe py-12 md:py-16">
      <div className="glass-card rounded-3xl p-6 md:p-10 text-center">
        <p className="eyebrow mb-3 text-[color:var(--gold)]">⚡ Express Delivery</p>
        <h3 className="font-serif text-2xl md:text-4xl">20–30 Mins at Kempegowda International Airport</h3>
        <p className="mt-3 text-sm md:text-base text-[color:var(--muted-foreground)] max-w-2xl mx-auto">
          Same-day delivery in Bengaluru. Prestige VIP 45m–1hr. Airport Express pickup at T1 / T2 / The Quad.
        </p>
        <Link to="/airport-pickup" className="mt-6 btn-outline-gold px-6 py-3 rounded-full text-sm inline-flex items-center gap-2">
          Check Airport Pickup Points <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="container-luxe py-16 md:py-24">
      <div className="relative overflow-hidden rounded-3xl hairline border p-10 md:p-16 text-center bg-[color:var(--noir)]/60">
        <p className="eyebrow mb-3">Ready to Gift Forever?</p>
        <h2 className="font-serif text-3xl md:text-5xl leading-tight">Create a Memory That Lasts</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/shop" className="btn-gold px-8 py-3.5 rounded-full text-sm inline-flex items-center gap-2">
            Shop Now <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={whatsappLink("Hello OMORA BLOOMS! I'd like to place an order.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline-gold px-8 py-3.5 rounded-full text-sm inline-flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" /> Order on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}