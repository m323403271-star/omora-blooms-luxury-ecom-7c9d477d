import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function PolicyLayout({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return (
    <div className="container-luxe py-16 md:py-24 max-w-3xl">
      <p className="eyebrow mb-4">{eyebrow}</p>
      <h1 className="font-serif text-5xl md:text-6xl mb-10">{title}</h1>
      <div className="prose prose-invert max-w-none text-[color:var(--muted-foreground)] leading-relaxed space-y-5 [&_h2]:text-[color:var(--foreground)] [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-2 [&_strong]:text-[color:var(--foreground)]">
        {children}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/shipping")({
  head: () => ({
    ...pageSeo({
      path: "/shipping",
      title: 'Shipping & Delivery — OMORA BLOOMS',
      description: 'Same-day Bengaluru delivery, pan-India shipping, worldwide DHL/FedEx and our signature airport welcome service.',
    }),
  }),
  component: () => (
    <PolicyLayout eyebrow="Policy" title="Shipping & Delivery">
      <p>We offer luxury delivery experiences across India and worldwide. Every parcel is dispatched in our signature packaging with tracking provided.</p>
      <h2>Same-Day Delivery</h2>
      <p>Available in Bengaluru for orders placed before 12 PM. Additional express charges apply.</p>
      <h2>Pan-India Delivery</h2>
      <p>Standard delivery across India takes 2–5 working days. Handmade-to-order pieces require 3–7 additional days of production time.</p>
      <h2>International Shipping</h2>
      <p>We ship worldwide via DHL and FedEx. Rates and transit times are calculated at checkout. Import duties are the customer's responsibility.</p>
      <h2>Airport Delivery</h2>
      <p>Our signature airport welcome service delivers a luxury bouquet directly to arrivals at select Indian airports. Contact us to arrange.</p>
    </PolicyLayout>
  ),
});
