import { pageSeo } from "@/lib/seo";
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

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  head: () => ({
    ...pageSeo({
      path: "/",
      title: "OMORA BLOOMS — Luxury Handmade Bouquets",
      description:
        "Shop OMORA BLOOMS luxury handmade crochet bouquets, pipe cleaner flowers, mother recovery kits, baby essentials and premium gift boxes.",
    }),
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
