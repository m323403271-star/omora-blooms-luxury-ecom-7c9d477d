import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { productsQuery } from "@/lib/products";
import {
  BestSellers,
  DeliveryBand,
  EternalBondBanner,
  FeatureGrid,
  FinalCta,
  Hero,
  HomeThreeProductsSection,
  Marquee,
  PackagingBand,
  StoryBand,
} from "@/components/site/HomeSections";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  head: () => ({
    meta: [
      { title: "OMORA BLOOMS — Luxury Handmade Bouquets" },
      {
        name: "description",
        content: "Shop OMORA BLOOMS luxury handmade crochet bouquets, pipe cleaner flowers, mother recovery kits, baby essentials and premium gift boxes.",
      },
      { property: "og:title", content: "OMORA BLOOMS — Luxury Handmade Bouquets" },
      {
        property: "og:description",
        content: "Luxury handmade bouquets and premium gifts crafted to last forever, with express delivery options in Bengaluru.",
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

      {/* ಹೊಸದಾಗಿ ಸೇರಿಸಿದ 3 ಪ್ರಮುಖ ಪ್ರಾಡಕ್ಟ್‌ಗಳ ವಿಭಾಗ (ಕ್ಲಿಕ್ ಮಾಡಿದರೆ ಸಬ್-ಕ್ಯಾಟಗರಿ ಪೇಜ್‌ಗೆ ಹೋಗುತ್ತದೆ) */}
      <HomeThreeProductsSection />

      <EternalBondBanner />

      {/* ನಿಮ್ಮ ಹಳೆಯ ಎಲ್ಲಾ ಪ್ರಾಡಕ್ಟ್‌ಗಳು ಇಲ್ಲಿ 'Bestsellers' ಆಗಿ ಸುರಕ್ಷಿತವಾಗಿ ಕಾಣಿಸುತ್ತವೆ */}
      <Suspense fallback={<div className="container-luxe py-24 text-center text-sm text-[color:var(--muted-foreground)]">Loading products...</div>}>
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

