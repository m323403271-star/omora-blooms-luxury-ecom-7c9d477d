import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  MessageCircle,
  Sparkles,
  Package,
  Truck,
  Heart,
  Gem,
  Award,
  Star,
} from "lucide-react";

import heroBouquet from "@/assets/hero-bouquet.jpg";
import eternalBondBanner from "@/assets/banner-eternal-bond.jpg";
import giftboxImg from "@/assets/collection-giftbox.jpg";
import crochetImg from "@/assets/collection-crochet.jpg";
import pipecleanerImg from "@/assets/collection-pipecleaner.jpg";
import airportImg from "@/assets/collection-airport.jpg";
import framesVasesImg from "@/assets/collection-frames-vases.jpg";
import divineHeritageImg from "@/assets/divine-heritage-giftbox.jpg";
import indoorPlantsImg from "@/assets/collection-indoor-plants.jpg";
import babyImg from "@/assets/collection-baby.jpg";
import motherImg from "@/assets/collection-mother.jpg";
import weddingImg from "@/assets/collection-wedding.jpg";

import { COLLECTIONS } from "@/lib/collections";
import {
  LOCAL_PRODUCTS,
  productsQuery,
  resolveProductImage,
  formatPrice,
} from "@/lib/products";
import { whatsappLink } from "@/lib/whatsapp";
import { handleImageError } from "@/lib/image-fallback";
import { HOME_SHOWCASE, type ShowcaseSection } from "@/lib/home-showcase";
import { ProductCard } from "@/components/site/ProductCard";
import { CraftNote } from "@/components/site/CraftNote";

const RAIL =
  "-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory md:mx-0 md:px-0 md:gap-5";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="container-luxe grid lg:grid-cols-2 gap-6 lg:gap-16 items-center pt-8 pb-10 lg:pt-24 lg:pb-32">
        <div className="relative z-10 max-w-xl">
          <p className="eyebrow mb-3 md:mb-6">Est. Handmade Luxury · India · Worldwide</p>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl lg:text-7xl leading-[1.08] md:leading-[1.05] tracking-tight">
            Luxury Handmade <span className="text-gold-gradient italic">Bouquets</span> That Last Forever
          </h1>
          <p className="mt-3 md:mt-6 text-sm md:text-lg text-[color:var(--muted-foreground)] leading-relaxed max-w-lg line-clamp-3 md:line-clamp-none">
            Beautiful crochet flowers, pipe cleaner bouquets, mother recovery kits and baby essentials — thoughtfully handcrafted for every special occasion.
          </p>
          <CraftNote className="mt-4" />
          <div className="mt-4 md:mt-6 flex flex-wrap gap-2.5 md:gap-3">
            <Link
              to="/shop"
              className="btn-gold px-6 md:px-8 py-3 md:py-3.5 rounded-full text-sm inline-flex items-center gap-2"
            >
              Shop Now <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={whatsappLink("Hello OMORA BLOOMS! I'd like to place an order.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline-gold px-6 md:px-8 py-3 md:py-3.5 rounded-full text-sm inline-flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" /> Order on WhatsApp
            </a>
          </div>
          <div className="mt-5 md:mt-10 flex items-center gap-4 md:gap-6 text-[11px] md:text-xs text-[color:var(--muted-foreground)]">
            <span className="inline-flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-[color:var(--gold)]" /> Handmade to order</span>
            <span className="inline-flex items-center gap-2"><Package className="h-3.5 w-3.5 text-[color:var(--gold)]" /> Luxury packaging</span>
            <span className="inline-flex items-center gap-2 hidden sm:inline-flex"><Truck className="h-3.5 w-3.5 text-[color:var(--gold)]" /> Same-day delivery</span>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-10 bg-gradient-to-br from-[color:var(--gold)]/20 via-transparent to-[color:var(--blush)]/10 blur-3xl -z-10" />
          <div className="glass-card rounded-3xl p-2 md:p-4">
            <img
              src={heroBouquet}
              alt="Luxury OMORA BLOOMS handmade bouquet"
              className="w-full h-[300px] sm:h-[420px] md:h-[620px] object-cover rounded-2xl"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 glass-card rounded-2xl px-5 py-4 hidden md:block">
            <p className="eyebrow">Bestseller</p>
            <p className="font-serif text-lg mt-1">Signature Crochet Bouquet</p>
            <p className="text-[color:var(--gold)] text-sm mt-0.5">from {formatPrice(3499)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TrustBanner() {
  const stars = Array.from({ length: 5 });
  const items = Array.from({ length: 6 });
  return (
    <div className="border-b hairline overflow-hidden bg-[color:var(--noir)]/40">
      <div className="flex animate-[trustMarquee_28s_linear_infinite] whitespace-nowrap py-3 md:py-3.5">
        {items.map((_, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 px-8 md:px-12 text-[11px] md:text-xs tracking-[0.18em] uppercase text-[color:var(--muted-foreground)]"
          >
            <span className="inline-flex items-center gap-0.5">
              {stars.map((_, s) => (
                <Star
                  key={s}
                  className="h-3 w-3 md:h-3.5 md:w-3.5 fill-[color:var(--gold)] text-[color:var(--gold)]"
                />
              ))}
            </span>
            <span className="text-[color:var(--foreground)] font-medium">
              Trusted by 1000+ happy customers
            </span>
          </span>
        ))}
      </div>
      <style>{`@keyframes trustMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

export function Marquee() {
  const items = [
    "Handmade with Love",
    "Crafted to Last Forever",
    "Luxury Packaging",
    "Worldwide Shipping",
    "Personalized Gifting",
    "Same-Day Delivery",
  ];
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

function SectionHeader({
  section,
  href,
}: {
  section: ShowcaseSection;
  href?: string;
}) {
  return (
    <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 md:mb-6">
      <div className="min-w-0">
        <p className="eyebrow mb-1 text-[color:var(--gold)]">{section.eyebrow}</p>
        <h2 className="font-serif text-xl leading-tight tracking-tight md:text-3xl">
          {section.title}
        </h2>
      </div>
      {href ? (
        <Link
          to="/collections/$slug"
          params={{ slug: href }}
          className="shrink-0 inline-flex items-center gap-1.5 text-xs text-[color:var(--gold)] hover:opacity-80 md:text-sm"
        >
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <Link
          to="/shop"
          className="shrink-0 inline-flex items-center gap-1.5 text-xs text-[color:var(--gold)] hover:opacity-80 md:text-sm"
        >
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function IconOnlySection({ section }: { section: ShowcaseSection }) {
  return (
    <section className="container-luxe py-3 md:py-10" aria-label={section.title}>
      <SectionHeader section={section} />
      <div
        className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0 md:gap-8"
        style={{ scrollbarWidth: "none" }}
      >
        {section.tabs.map((t) => (
          <Link
            key={t.id}
            to="/collections/$slug"
            params={{ slug: t.collection ?? "crochet-bouquets" }}
            className="group flex w-[80px] shrink-0 flex-col items-center gap-2 md:w-[112px]"
          >
            <span className="relative block h-[72px] w-[72px] overflow-hidden rounded-full ring-2 ring-[color:var(--gold)] shadow-[0_10px_28px_-14px_rgba(200,162,74,0.8)] transition group-hover:ring-[color:var(--gold)] group-hover:shadow-[0_14px_32px_-12px_rgba(200,162,74,0.95)] md:h-[96px] md:w-[96px]">
              <img
                src={t.image}
                alt={t.label}
                loading="lazy"
                decoding="async"
                onError={handleImageError}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </span>
            <span className="line-clamp-2 text-center text-[11px] leading-tight text-[color:var(--muted-foreground)] group-hover:text-[color:var(--gold)] md:text-xs">
              {t.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProductSlider({
  title,
  eyebrow,
  products,
  href = "/shop",
}: {
  title: string;
  eyebrow: string;
  products: typeof LOCAL_PRODUCTS;
  href?: string;
}) {
  return (
    <section className="container-luxe py-3 md:py-14">
      <div className="mb-4 flex items-end justify-between gap-4 md:mb-7">
        <div className="min-w-0">
          <p className="eyebrow mb-1.5 text-[color:var(--gold)]">{eyebrow}</p>
          <h2 className="font-serif text-2xl leading-tight tracking-tight md:text-4xl">{title}</h2>
        </div>
        <Link
          to={href as any}
          className="shrink-0 inline-flex items-center gap-1.5 text-xs text-[color:var(--gold)] hover:opacity-80 md:text-sm"
        >
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className={RAIL} style={{ scrollbarWidth: "none" }}>
        {products.map((p) => {
          const off =
            p.compare_at_price && p.compare_at_price > p.price
              ? Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100)
              : null;
          return (
            <Link
              key={p.id}
              to="/products/$slug"
              params={{ slug: p.slug }}
              className="group flex w-[46%] max-w-[220px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border hairline bg-[color:var(--card)] transition hover:ring-1 hover:ring-[color:var(--gold)]/60 sm:w-[38%] md:w-[26%] lg:w-[23%]"
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={resolveProductImage(p.image_url)}
                  alt={`${p.name} — OMORA BLOOMS`}
                  loading="lazy"
                  decoding="async"
                  onError={handleImageError}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {off ? (
                  <span className="absolute left-2 top-2 rounded-full bg-gold-gradient px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--noir)] shadow">
                    {off}% Off
                  </span>
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-2.5 md:p-3.5">
                <h3 className="line-clamp-2 font-serif text-[13px] leading-snug md:text-base">
                  {p.name}
                </h3>
                <div className="mt-auto flex items-baseline gap-1.5 pt-1">
                  <span className="text-base font-semibold text-[color:var(--gold)] md:text-lg">
                    {formatPrice(p.price)}
                  </span>
                  {p.compare_at_price ? (
                    <span className="text-[11px] text-[color:var(--muted-foreground)] line-through">
                      {formatPrice(p.compare_at_price)}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/** Live catalog rows, with the bundled fallback only when the DB is empty. */
function useCatalog() {
  const { data } = useSuspenseQuery(productsQuery);
  return data && data.length > 0 ? data : LOCAL_PRODUCTS;
}

export function TrendingSlider() {
  const products = useCatalog();
  const flagged = products.filter((p) => p.is_trending);
  const items = (flagged.length > 0 ? flagged : products).slice(0, 8);
  if (items.length === 0) return null;
  return <ProductSlider title="Trending Now" eyebrow="Handpicked for you" products={items} />;
}

export function BestsellersSlider() {
  const products = useCatalog();
  const flagged = products.filter((p) => p.is_bestseller);
  const items = (flagged.length > 0 ? flagged : products.filter((p) => p.featured)).slice(0, 8);
  if (items.length === 0) return null;
  return (
    <ProductSlider title="Shop by Bestsellers" eyebrow="Loved by our customers" products={items} />
  );
}

export function NewlyLaunchedSlider() {
  const products = useCatalog();
  const items = [...products]
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    .slice(0, 8);
  if (items.length === 0) return null;
  return <ProductSlider title="Newly Launched" eyebrow="Fresh from the atelier" products={items} />;
}


export function IconCategories() {
  const iconSections = HOME_SHOWCASE.filter((s) => s.variant === "icons");
  return (
    <>
      {iconSections.map((section) => (
        <IconOnlySection key={section.id} section={section} />
      ))}
    </>
  );
}

type CategoryCard = {
  title: string;
  subtitle: string;
  image: string;
  slug: string;
};

function CollectionCard({ card }: { card: CategoryCard }) {
  return (
    <Link
      to="/collections/$slug"
      params={{ slug: card.slug }}
      className="group relative block w-[62%] max-w-[280px] shrink-0 snap-start overflow-hidden rounded-2xl hairline border bg-[color:var(--card)] hover:ring-1 hover:ring-[color:var(--gold)]/60 transition sm:w-[44%] md:w-[32%] lg:w-[23%]"
      aria-label={`Explore ${card.title}`}
    >
      <div className="aspect-[4/5] overflow-hidden">
        <img
          src={card.image}
          alt={`${card.title} — OMORA BLOOMS`}
          loading="lazy"
          decoding="async"
          onError={handleImageError}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
        <h3 className="font-serif text-lg md:text-xl text-white leading-snug tracking-tight line-clamp-2">
          {card.title}
        </h3>
        <p className="mt-1 text-xs text-white/60 line-clamp-1">{card.subtitle}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold-gradient text-[color:var(--noir)] text-[10px] tracking-[0.18em] uppercase font-semibold px-3 py-1.5 shadow-lg transition-transform group-hover:translate-x-1">
          Explore <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

function CollectionRail({ cards }: { cards: CategoryCard[] }) {
  return (
    <div
      className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory md:mx-0 md:px-0 md:gap-5"
      style={{ scrollbarWidth: "none" }}
    >
      {cards.map((c) => (
        <CollectionCard key={c.slug} card={c} />
      ))}
    </div>
  );
}

export function ShopByCollection() {
  const topRow: CategoryCard[] = [
    {
      title: "Crochet Bouquets",
      subtitle: "Handcrafted, everlasting",
      image: crochetImg,
      slug: "crochet-bouquets",
    },
    {
      title: "Pipe Cleaner Bouquets",
      subtitle: "Whimsical florals",
      image: pipecleanerImg,
      slug: "pipe-cleaner-bouquets",
    },
    {
      title: "Airport Welcome Bouquets",
      subtitle: "Grand homecomings",
      image: airportImg,
      slug: "airport-collection",
    },
    {
      title: "Everlasting Floral Frames & Vases",
      subtitle: "Décor that lasts",
      image: framesVasesImg,
      slug: "frames-vases",
    },
    {
      title: "Mini Indoor Plants",
      subtitle: "Fresh greenery",
      image: indoorPlantsImg,
      slug: "indoor-plants",
    },
  ];

  const bottomRow: CategoryCard[] = [
    {
      title: "Divine Heritage Luxury Gift Box",
      subtitle: "Traditional & timeless",
      image: divineHeritageImg,
      slug: "divine-heritage",
    },
    {
      title: "OMora VIP Luxury Gift Boxes",
      subtitle: "The signature suite",
      image: giftboxImg,
      slug: "luxury-gift-boxes",
    },
    {
      title: "Baby Essentials Luxury Kit",
      subtitle: "Welcome the little one",
      image: babyImg,
      slug: "baby-collection",
    },
    {
      title: "Mother Recovery Kit",
      subtitle: "Postpartum care, elevated",
      image: motherImg,
      slug: "mother-recovery",
    },
    {
      title: "Omora Signature Boxes",
      subtitle: "A forever keepsake",
      image: weddingImg,
      slug: "wedding-gifts",
    },
  ];

  return (
    <section className="container-luxe py-3 md:py-16">
      <div className="text-center max-w-2xl mx-auto mb-5 md:mb-12">
        <p className="eyebrow mb-2 md:mb-3 text-[color:var(--gold)]">Shop by Collection</p>
        <h2 className="font-serif text-2xl md:text-5xl leading-tight tracking-tight">
          Handcrafted, Everlasting Luxury
        </h2>
      </div>

      <div className="space-y-3 md:space-y-5">
        <CollectionRail cards={topRow} />

        <Link
          to="/products/$slug"
          params={{ slug: "eternal-bond-luxury-kit" }}
          className="group relative block overflow-hidden rounded-3xl hairline border ring-1 ring-[color:var(--gold)]/40 shadow-[0_30px_80px_-30px_rgba(200,162,74,0.55)] transition-shadow duration-500 hover:shadow-[0_40px_100px_-30px_rgba(200,162,74,0.75)]"
          aria-label="Explore The Eternal Bond Luxury Kit"
        >
          <div className="relative aspect-[5/4] sm:aspect-[16/9] md:aspect-[21/9]">
            <img
              src={eternalBondBanner}
              alt="The Eternal Bond Luxury Kit — OMORA BLOOMS"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/20 md:bg-gradient-to-r md:from-black/85 md:via-black/45 md:to-transparent" />
            <div className="absolute inset-0 flex items-end md:items-center">
              <div className="p-4 sm:p-8 md:p-14 w-full md:max-w-2xl">
                <p className="eyebrow mb-1.5 md:mb-4 text-[color:var(--gold)] text-[0.55rem] md:text-[0.7rem]">
                  Featured Collection
                </p>
                <h3 className="font-serif text-[1.45rem] leading-[1.05] sm:text-4xl md:text-5xl lg:text-6xl tracking-tight">
                  The Eternal Bond<br className="hidden sm:block" /> Luxury Kit
                </h3>
                <p className="mt-2 md:mt-5 text-[12px] md:text-base text-white/80 max-w-lg leading-relaxed line-clamp-2 md:line-clamp-none">
                  A royal luxury combo curated for Mother &amp; Baby — everlasting bouquet, wellness essentials, and heirloom keepsakes in a signature OMORA heritage box.
                </p>
                <span className="mt-3 md:mt-8 inline-flex items-center gap-2 btn-gold px-5 md:px-8 py-2.5 md:py-3.5 rounded-full text-[13px] md:text-sm font-semibold">
                  Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </div>
        </Link>

        <CollectionRail cards={bottomRow} />
      </div>
    </section>
  );
}

export function HomeThreeProductsSection() {
  const featured = COLLECTIONS.filter((c) =>
    ["crochet-bouquets", "frames-vases", "pipe-cleaner-bouquets"].includes(c.slug)
  );
  return (
    <section className="container-luxe py-3 md:py-16">
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
      key: "divine",
      title: "Divine Heritage Luxury Gift Box",
      image: resolveProductImage(
        LOCAL_PRODUCTS.find((p) => p.slug === "divine-heritage-luxury-gift-box")!.image_url
      ),
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
      price: `from ${formatPrice(1299)}`,
    },
    {
      key: "airport",
      title: "Luxury Airport Welcome Bouquet",
      image: resolveProductImage(
        LOCAL_PRODUCTS.find((p) => p.slug === "luxury-airport-welcome-bouquet")!.image_url
      ),
      to: "/products/$slug" as const,
      params: { slug: "luxury-airport-welcome-bouquet" },
      price: "₹2,499",
    },
  ];

  return (
    <section className="container-luxe py-3 md:py-14">
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
    <section className="container-luxe py-3 md:py-24">
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
    <section className="container-luxe py-3 md:py-24">
      <div className="grid md:grid-cols-2 gap-5 md:gap-16 items-center">
        <div>
          <p className="eyebrow mb-2 md:mb-4">Our Story</p>
          <h2 className="font-serif text-2xl md:text-5xl leading-tight">Handmade with Love, Crafted to Last Forever</h2>
          <p className="mt-3 md:mt-5 text-sm md:text-base text-[color:var(--muted-foreground)] leading-relaxed">
            Every OMORA piece is thoughtfully handcrafted in India by skilled artisans. From crochet bouquets to heritage gift boxes, our creations turn everyday moments into forever memories.
          </p>
          <Link to="/about" className="mt-4 md:mt-6 inline-flex items-center gap-1.5 text-sm text-[color:var(--gold)]">
            Discover the Craft <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="glass-card rounded-3xl p-2 md:p-3">
          <img
            src={heroBouquet}
            alt="OMORA BLOOMS artisan craft"
            loading="lazy"
            decoding="async"
            className="w-full h-[220px] sm:h-[320px] md:h-[420px] object-cover rounded-2xl"
          />
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
    <section className="container-luxe py-3 md:py-16">
      <div className="grid gap-3 md:gap-6 grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="glass-card rounded-2xl p-3.5 md:p-6 text-center">
            <Icon className="h-5 w-5 md:h-6 md:w-6 mx-auto text-[color:var(--gold)]" />
            <p className="mt-2 md:mt-3 font-serif text-base md:text-lg leading-snug">{title}</p>
            <p className="mt-1 text-[11px] md:text-xs text-[color:var(--muted-foreground)] leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PackagingBand() {
  return (
    <section className="container-luxe py-3 md:py-24">
      <div className="grid md:grid-cols-2 gap-5 md:gap-16 items-center">
        <div className="glass-card rounded-3xl p-2 md:p-3 order-2 md:order-1">
          <img
            src={giftboxImg}
            alt="OMORA BLOOMS signature luxury packaging"
            loading="lazy"
            decoding="async"
            className="w-full h-[220px] sm:h-[320px] md:h-[420px] object-cover rounded-2xl"
          />
        </div>
        <div className="order-1 md:order-2">
          <p className="eyebrow mb-2 md:mb-4">Signature Packaging</p>
          <h2 className="font-serif text-2xl md:text-5xl leading-tight">Unboxing, Reimagined</h2>
          <p className="mt-3 md:mt-5 text-sm md:text-base text-[color:var(--muted-foreground)] leading-relaxed">
            Every order arrives in our signature OMORA heritage box — matte black finish, gold-foil crest, and satin ribbon. A gift within a gift.
          </p>
        </div>
      </div>
    </section>
  );
}

export function DeliveryBand() {
  return (
    <section className="container-luxe py-3 md:py-16">
      <div className="glass-card rounded-3xl p-4 md:p-10 text-center">
        <p className="eyebrow mb-2 md:mb-3 text-[color:var(--gold)]">⚡ Express Delivery</p>
        <h3 className="font-serif text-xl md:text-4xl leading-snug">30–45 Mins at Kempegowda International Airport</h3>
        <p className="mt-2 md:mt-3 text-[13px] md:text-base text-[color:var(--muted-foreground)] max-w-2xl mx-auto">
          Same-day delivery in Bengaluru. Prestige VIP 45m–1hr. Airport Express pickup at T1 / T2 / The Quad.
        </p>
        <Link to="/airport-pickup" className="mt-4 md:mt-6 btn-outline-gold px-5 md:px-6 py-2.5 md:py-3 rounded-full text-sm inline-flex items-center gap-2">
          Check Airport Pickup Points <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="container-luxe py-3 md:py-24">
      <div className="relative overflow-hidden rounded-3xl hairline border p-6 md:p-16 text-center bg-[color:var(--noir)]/60">
        <p className="eyebrow mb-2 md:mb-3">Ready to Gift Forever?</p>
        <h2 className="font-serif text-2xl md:text-5xl leading-tight">Create a Memory That Lasts</h2>
        <div className="mt-4 md:mt-6 flex flex-wrap justify-center gap-2.5 md:gap-3">
          <Link to="/shop" className="btn-gold px-6 md:px-8 py-3 md:py-3.5 rounded-full text-sm inline-flex items-center gap-2">
            Shop Now <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={whatsappLink("Hello OMORA BLOOMS! I'd like to place an order.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline-gold px-6 md:px-8 py-3 md:py-3.5 rounded-full text-sm inline-flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" /> Order on WhatsApp
          </a>
        </div>
        <CraftNote className="mt-4" align="center" />
      </div>
    </section>
  );
}

/** Self-contained homepage layout using only this file. */
export default function HomeSections() {
  return (
    <>
      <Hero />
      <TrustBanner />
      <Marquee />
      <TrendingSlider />
      <IconCategories />
      <BestsellersSlider />
      <NewlyLaunchedSlider />
      <ShopByCollection />
      <StoryBand />
      <FeatureGrid />
      <PackagingBand />
      <DeliveryBand />
      <FinalCta />
    </>
  );
}
