import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ArrowRight, MessageCircle, Sparkles, Package, Truck, Heart, Gem, Award } from "lucide-react";
import heroBouquet from "@/assets/hero-bouquet.jpg";
import eternalBondBanner from "@/assets/banner-eternal-bond.jpg";
import giftboxImg from "@/assets/collection-giftbox.jpg";
import { COLLECTIONS } from "@/lib/collections";
import { productsQuery, LOCAL_PRODUCTS } from "@/lib/products";
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

