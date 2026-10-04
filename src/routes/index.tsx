import { pageSeo, SITE_URL } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { productsQuery } from "@/lib/products";
import {
  DeliveryBand,
  FeatureGrid,
  FinalCta,
  Hero,
  Marquee,
  PackagingBand,
  StoryBand,
  TrustBanner,
  BestsellersSlider,
  NewlyLaunchedSlider,
} from "@/components/site/HomeSections";
import { HomeCategoryGrid } from "@/components/site/HomeCategoryGrid";
import { GiftFinder } from "@/components/site/GiftFinder";
import { HomeSearchBar } from "@/components/site/HomeSearchBar";
import { HomeCategoryStrip } from "@/components/site/HomeCategoryStrip";
import { HomeDealsGrid } from "@/components/site/HomeDealsGrid";
import { HomeShowcaseSection } from "@/components/site/HomeShowcaseSection";
import { HomeGiftingStories } from "@/components/site/HomeGiftingStories";
import { HOME_SHOWCASE } from "@/lib/home-showcase";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/site/ProductCard";


export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  head: () => ({
    ...pageSeo({
      path: "/",
      title: "OMORA BLOOMS — Luxury Handmade Bouquets",
      description:
        "Shop OMORA BLOOMS fresh and loose flowers, luxury handmade crochet bouquets, mother recovery kits, baby essentials and premium gift boxes.",
    }),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "OMORA BLOOMS",
          url: SITE_URL,
          potentialAction: {
            "@type": "SearchAction",
            target: `${SITE_URL}/shop?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
  component: HomePage,
});


function HomePage() {
  return (
    <div>
      <HomeSearchBar />
      <HomeCategoryStrip />
      <Hero />
      <TrustBanner />
      <Marquee />
      <GiftFinder />
      <HomeDealsGrid />
      <HomeCategoryGrid />
      <FreshFlowersSection />
      {HOME_SHOWCASE.map((s) => {
        // Bestsellers and new arrivals are driven by live catalog data.
        if (s.id === "bestsellers") return <BestsellersSlider key={s.id} />;
        if (s.id === "new") return <NewlyLaunchedSlider key={s.id} />;
        return <HomeShowcaseSection key={s.id} section={s} />;
      })}
      <HomeGiftingStories />
      <StoryBand />
      <FeatureGrid />
      <PackagingBand />
      <DeliveryBand />
      <FinalCta />
    </div>
  );
}

function FreshFlowersSection() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const flowers = products.filter((product) => product.category === "fresh-flowers");
  if (!flowers.length) return null;
  return (
    <section className="container-luxe px-3 py-5 md:py-14" aria-labelledby="fresh-flowers-title">
      <div className="mb-4 flex items-end justify-between gap-3 md:mb-8">
        <div>
          <p className="eyebrow mb-1 text-[color:var(--gold)]">Freshly gathered</p>
          <h2 id="fresh-flowers-title" className="font-serif text-2xl md:text-4xl">Fresh Flowers & Loose Flowers</h2>
        </div>
        <Link to="/collections/$slug" params={{ slug: "fresh-flowers" }} className="inline-flex shrink-0 items-center gap-1 text-xs text-[color:var(--gold)]">View all <ArrowRight className="h-4 w-4" /></Link>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
        {flowers.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}

