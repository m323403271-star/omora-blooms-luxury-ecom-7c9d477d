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
    meta: [
      { title: "OMORA BLOOMS — Luxury Handmade Bouquets" },
      {
        name: "description",
        content:
          "Shop OMORA BLOOMS luxury handmade crochet bouquets, pipe cleaner flowers, mother recovery kits, baby essentials and premium gift boxes.",
      },
      { property: "og:title", content: "OMORA BLOOMS — Luxury Handmade Bouquets" },
      {
        property: "og:description",
        content:
          "Luxury handmade bouquets and premium gifts crafted to last forever, with express delivery options in Bengaluru.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
