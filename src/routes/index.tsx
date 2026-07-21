import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ArrowRight, MessageCircle, Sparkles, Package, Truck, Heart, Gem, Award } from "lucide-react";
import heroBouquet from "@/assets/hero-bouquet.jpg";
import { COLLECTIONS } from "@/lib/collections";
import { productsQuery } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";
import { whatsappLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: HomePage,
});

function HomePage() {
  return (
    <div>
      <Hero />
      <Marquee />
      <FeaturedCollections />
      <Suspense fallback={<div className="container-luxe py-24 text-center text-sm text-[color:var(--muted-foreground)]">Loading...</div>}>
        <BestSellers />
      </Suspense>
      <StoryBand />
      <FeatureGrid />
      <PackagingBand />
      <DeliveryBand />
      <FinalCta />
    </div>
  );
}

function Hero() {
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

function Marquee() {
  const items = ["Handmade with Love", "Crafted to Last Forever", "Luxury Packaging", "Worldwide Shipping", "Personalized Gifting", "Same-Day Delivery"];
  return (
    <div className="border-y hairline py-4 overflow-hidden bg-[color:var(--noir)]/60">
      <div className="flex gap-12 animate-[marquee_30s_linear_infinite] whitespace-nowrap">
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} className="eyebrow inline-flex items-center gap-3">
            <span className="text-[color:var(--gold)]">✦</span> {t}
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

function FeaturedCollections() {
  const feats = COLLECTIONS.slice(0, 6);
  return (
    <section className="container-luxe py-20 md:py-28">
      <div className="flex items-end justify-between mb-12 gap-6">
        <div>
          <p className="eyebrow mb-3">Our Collections</p>
          <h2 className="font-serif text-4xl md:text-5xl max-w-xl leading-tight">Curated for every occasion</h2>
        </div>
        <Link to="/collections" className="hidden md:inline-flex items-center gap-2 text-sm text-[color:var(--gold)] hover:opacity-80">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {feats.map((c, i) => (
          <Link
            key={c.slug}
            to="/collections/$slug"
            params={{ slug: c.slug }}
            className={`group relative overflow-hidden rounded-2xl hairline border ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
          >
            <div className={`${i === 0 ? "aspect-[16/10] md:aspect-[16/12]" : "aspect-[4/5]"} relative`}>
              <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
                <p className="eyebrow mb-1">Collection</p>
                <h3 className="font-serif text-2xl md:text-3xl">{c.name}</h3>
                <p className="text-xs md:text-sm text-[color:var(--muted-foreground)] mt-1">{c.tagline}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-xs text-[color:var(--gold)] tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity">Explore <ArrowRight className="h-3 w-3" /></span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function BestSellers() {
  const { data } = useSuspenseQuery(productsQuery);
  const featured = data.filter((p) => p.featured).slice(0, 8);
  return (
    <section className="container-luxe py-20 md:py-28 border-t hairline">
      <div className="flex items-end justify-between mb-12 gap-6">
        <div>
          <p className="eyebrow mb-3">Bestsellers</p>
          <h2 className="font-serif text-4xl md:text-5xl max-w-xl leading-tight">Loved by our customers</h2>
        </div>
        <Link to="/shop" className="hidden md:inline-flex items-center gap-2 text-sm text-[color:var(--gold)] hover:opacity-80">
          Shop all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-8">
        {featured.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

function StoryBand() {
  return (
    <section className="container-luxe py-24 md:py-32">
      <div className="grid lg:grid-cols-2 gap-12 md:gap-20 items-center">
        <div className="glass-card rounded-3xl p-6 aspect-square">
          <img src={heroBouquet} alt="The OMORA atelier" className="h-full w-full object-cover rounded-2xl" />
        </div>
        <div>
          <p className="eyebrow mb-4">Our Story</p>
          <h2 className="font-serif text-4xl md:text-5xl leading-tight">Every bloom, made by hand — with love.</h2>
          <p className="mt-6 text-[color:var(--muted-foreground)] leading-relaxed">
            OMORA BLOOMS was born from a simple belief: the most meaningful gifts are the ones made by hand. Our artisans crochet every petal, twist every stem, and pack every box — so that each piece becomes a keepsake, treasured long after the moment has passed.
          </p>
          <p className="mt-4 text-[color:var(--muted-foreground)] leading-relaxed">
            From luxury bouquets to curated hampers for new mothers, newborns and homecomings, we craft the small details that make big moments unforgettable.
          </p>
          <div className="mt-8 flex gap-3">
            <Link to="/about" className="btn-outline-gold px-6 py-3 rounded-full text-sm inline-flex items-center gap-2">Read our story <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureGrid() {
  const feats = [
    { icon: Heart, title: "Handmade with love", copy: "Every piece stitched, twisted and finished by our artisans in India." },
    { icon: Gem, title: "Crafted to last", copy: "Everlasting florals — no wilting, no waste. A keepsake forever." },
    { icon: Package, title: "Signature packaging", copy: "Matte black magnetic boxes with soft pink tissue and gold ribbon." },
    { icon: Award, title: "Personalized gifting", copy: "Add handwritten notes, custom colors and bespoke arrangements." },
  ];
  return (
    <section className="border-y hairline">
      <div className="container-luxe py-20 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {feats.map((f) => (
          <div key={f.title} className="text-center md:text-left">
            <div className="inline-flex h-12 w-12 rounded-full bg-gold-gradient text-[color:var(--noir)] items-center justify-center mb-4">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-xl mb-2">{f.title}</h3>
            <p className="text-sm text-[color:var(--muted-foreground)]">{f.copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PackagingBand() {
  return (
    <section className="container-luxe py-24 md:py-32">
      <div className="grid lg:grid-cols-2 gap-12 md:gap-20 items-center">
        <div className="order-2 lg:order-1">
          <p className="eyebrow mb-4">Signature Packaging</p>
          <h2 className="font-serif text-4xl md:text-5xl leading-tight">The unboxing is part of the gift.</h2>
          <ul className="mt-8 space-y-4 text-[color:var(--muted-foreground)]">
            <li className="flex gap-3"><span className="text-[color:var(--gold)]">✦</span> Matte black magnetic gift box with gold foil detailing</li>
            <li className="flex gap-3"><span className="text-[color:var(--gold)]">✦</span> Soft blush pink tissue lining and gold satin ribbon</li>
            <li className="flex gap-3"><span className="text-[color:var(--gold)]">✦</span> Complimentary handwritten note card with every order</li>
            <li className="flex gap-3"><span className="text-[color:var(--gold)]">✦</span> Custom personalization & bespoke wrapping on request</li>
          </ul>
        </div>
        <div className="order-1 lg:order-2 relative">
          <img src="/src/assets/collection-giftbox.jpg" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} alt="OMORA BLOOMS luxury packaging" className="w-full aspect-square object-cover rounded-3xl hairline border" />
        </div>
      </div>
    </section>
  );
}

function DeliveryBand() {
  const opts = [
    { title: "Same-Day Delivery", copy: "Bengaluru city — order before 12 PM.", accent: "Local" },
    { title: "Next-Day Pan-India", copy: "Delivered to your doorstep across India.", accent: "India" },
    { title: "Airport Delivery", copy: "Meet them at arrivals with a luxury bouquet.", accent: "Signature" },
    { title: "International Shipping", copy: "Selected countries — DHL & FedEx.", accent: "Worldwide" },
  ];
  return (
    <section className="container-luxe pb-20">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {opts.map((o) => (
          <div key={o.title} className="glass-card rounded-2xl p-6">
            <p className="eyebrow">{o.accent}</p>
            <h3 className="font-serif text-xl mt-2">{o.title}</h3>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-2">{o.copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="container-luxe pb-24">
      <div className="relative overflow-hidden rounded-3xl p-10 md:p-16 text-center hairline border glass-card">
        <div className="absolute -inset-40 bg-gradient-to-br from-[color:var(--gold)]/20 via-transparent to-[color:var(--blush)]/10 blur-3xl -z-10" />
        <p className="eyebrow mb-4">Let's make it unforgettable</p>
        <h2 className="font-serif text-4xl md:text-6xl max-w-3xl mx-auto leading-tight">Bespoke gifting, crafted just for you</h2>
        <p className="mt-5 text-[color:var(--muted-foreground)] max-w-xl mx-auto">Chat with our artisans on WhatsApp for custom colors, personalized notes, corporate orders and bespoke arrangements.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={whatsappLink("Hi OMORA BLOOMS! I'd like a custom order.")} target="_blank" rel="noopener noreferrer" className="btn-gold px-8 py-3.5 rounded-full text-sm inline-flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
          </a>
          <Link to="/contact" className="btn-outline-gold px-8 py-3.5 rounded-full text-sm">Send an enquiry</Link>
        </div>
      </div>
    </section>
  );
}
