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
} from "@/components/site/HomeSections";
import { HomeCategoryGrid } from "@/components/site/HomeCategoryGrid";
import { HomeSearchBar } from "@/components/site/HomeSearchBar";
import { HomeCategoryStrip } from "@/components/site/HomeCategoryStrip";
import { HomeDealsGrid } from "@/components/site/HomeDealsGrid";


export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  head: () => ({
    ...pageSeo({
      path: "/",
      title: "OMORA BLOOMS — Luxury Handmade Bouquets",
      description:
        "Shop OMORA BLOOMS luxury handmade crochet bouquets, pipe cleaner flowers, mother recovery kits, baby essentials and premium gift boxes.",
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
      <Hero />
      <Marquee />
      <HomeCategoryGrid />
      <StoryBand />
      <FeatureGrid />
      <PackagingBand />
      <DeliveryBand />
      <FinalCta />
    </div>
  );
}
