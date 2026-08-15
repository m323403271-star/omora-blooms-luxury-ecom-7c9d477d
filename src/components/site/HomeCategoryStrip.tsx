import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { siteImagesQuery, homepageImageFor } from "@/lib/site-images";
import { handleImageError } from "@/lib/image-fallback";


import crochetImg from "@/assets/collection-crochet.jpg";
import pipecleanerImg from "@/assets/collection-pipecleaner.jpg";
import airportImg from "@/assets/collection-airport.jpg";
import framesVasesImg from "@/assets/collection-frames-vases.jpg";
import eternalBondBanner from "@/assets/banner-eternal-bond.jpg";
import divineHeritageImg from "@/assets/divine-heritage-giftbox.jpg";
import indoorPlantsImg from "@/assets/collection-indoor-plants.jpg";
import giftboxImg from "@/assets/collection-giftbox.jpg";
import babyImg from "@/assets/collection-baby.jpg";
import motherImg from "@/assets/collection-mother.jpg";
import weddingImg from "@/assets/collection-wedding.jpg";

type CategoryCard = {
  title: string;
  subtitle: string;
  image: string;
  slug: string;
};

function Card({ card }: { card: CategoryCard }) {
  const { data: siteImages } = useQuery(siteImagesQuery);
  const src = homepageImageFor(siteImages, card.slug) ?? card.image;
  return (
    <Link
      to="/collections/$slug"
      params={{ slug: card.slug }}
      className="group relative block w-[62%] max-w-[280px] shrink-0 snap-start overflow-hidden rounded-2xl hairline border bg-[color:var(--card)] hover:ring-1 hover:ring-[color:var(--gold)]/60 transition sm:w-[44%] md:w-[32%] lg:w-[23%]"
      aria-label={`Explore ${card.title}`}
    >
      <div className="aspect-[4/5] overflow-hidden">
        <img
          src={src}
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

function Rail({ cards }: { cards: CategoryCard[] }) {
  return (
    <div
      className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory md:mx-0 md:px-0 md:gap-5"
      style={{ scrollbarWidth: "none" }}
    >
      {cards.map((c) => (
        <Card key={c.slug} card={c} />
      ))}
    </div>
  );
}

export function HomeCategoryGrid() {
  const topRow: CategoryCard[] = [
    { title: "Crochet Bouquets", subtitle: "Handcrafted, everlasting", image: crochetImg, slug: "crochet-bouquets" },
    { title: "Pipe Cleaner Bouquets", subtitle: "Whimsical florals", image: pipecleanerImg, slug: "pipe-cleaner-bouquets" },
    { title: "Luxury Airport Welcome Bouquets", subtitle: "Grand homecomings", image: airportImg, slug: "airport-collection" },
    { title: "Everlasting Floral Frames & Vases", subtitle: "Décor that lasts", image: framesVasesImg, slug: "frames-vases" },
    { title: "Mini Indoor Plants", subtitle: "Fresh greenery", image: indoorPlantsImg, slug: "indoor-plants" },
  ];
  const bottomRow: CategoryCard[] = [
    { title: "Divine Heritage Luxury Gift Box", subtitle: "Traditional & timeless", image: divineHeritageImg, slug: "divine-heritage" },
    { title: "OMora VIP Luxury Gift Boxes", subtitle: "The signature suite", image: giftboxImg, slug: "luxury-gift-boxes" },
    { title: "Baby Essentials Luxury Kit", subtitle: "Welcome the little one", image: babyImg, slug: "baby-collection" },
    { title: "Mother Recovery Kit", subtitle: "Postpartum care, elevated", image: motherImg, slug: "mother-recovery" },
    { title: "Omora Signature Boxes", subtitle: "A forever keepsake", image: weddingImg, slug: "wedding-gifts" },
  ];

  return (
    <section className="container-luxe py-7 md:py-16">
      <div className="text-center max-w-2xl mx-auto mb-5 md:mb-12">
        <p className="eyebrow mb-2 md:mb-3 text-[color:var(--gold)]">Shop by Collection</p>
        <h2 className="font-serif text-2xl md:text-5xl leading-tight tracking-tight">
          Handcrafted, Everlasting Luxury
        </h2>
      </div>


      <div className="space-y-3 md:space-y-5">
        <Rail cards={topRow} />

        {/* Row 3 — Full-width Eternal Bond banner */}
        <Link
          to="/collections/$slug"
          params={{ slug: "luxury-gift-boxes" }}
         
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

        <Rail cards={bottomRow} />
      </div>
    </section>
  );
}
