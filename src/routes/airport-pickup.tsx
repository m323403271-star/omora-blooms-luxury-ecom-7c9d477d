import { pageSeo } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Clock, ShieldCheck } from "lucide-react";
import { PICKUP_POINTS } from "@/lib/pickup";

export const Route = createFileRoute("/airport-pickup")({
  head: () => ({
    ...pageSeo({
      path: "/airport-pickup",
      title: 'Airport Pickup Points — OMORA BLOOMS',
      description: 'Express 20-30 minute delivery at Kempegowda International Airport (BLR). See our three designated pickup points.',
    }),
  }),
  component: AirportPickupPage,
});

function AirportPickupPage() {
  return (
    <div className="container-luxe py-16 md:py-24 max-w-4xl">
      <p className="eyebrow mb-3">Kempegowda International Airport · BLR</p>
      <h1 className="font-serif text-4xl md:text-6xl mb-4">Airport Pickup Points</h1>
      <p className="text-[color:var(--muted-foreground)] max-w-2xl">
        Express delivery in 20–30 minutes across Kempegowda International Airport. Due to airport security policies,
        our concierge cannot enter gate check-in areas — please meet us at one of the three designated pickup points below.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border hairline px-4 py-2 text-xs text-[color:var(--gold)]">
          <Clock className="h-3.5 w-3.5" /> 20–30 minute express window
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border hairline px-4 py-2 text-xs text-[color:var(--muted-foreground)]">
          <ShieldCheck className="h-3.5 w-3.5" /> Security-compliant hand-off
        </span>
      </div>

      <div className="mt-10 grid md:grid-cols-3 gap-5">
        {PICKUP_POINTS.map((p, i) => (
          <div key={p.id} className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 text-[color:var(--gold)]">
              <MapPin className="h-4 w-4" />
              <span className="eyebrow">Point {i + 1}</span>
            </div>
            <p className="font-serif text-2xl mt-3">{p.label.split("—")[1]?.trim() ?? p.label}</p>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-2">{p.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border hairline p-6 bg-[color:var(--card)]/40">
        <p className="eyebrow mb-2">Security note</p>
        <p className="text-sm text-[color:var(--muted-foreground)]">
          Security rules restrict delivery executives from entering gate check-in areas. Please meet our delivery agent at your chosen Pickup Point.
          You'll receive live updates once your order is dispatched.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/shop" className="btn-gold inline-block px-8 py-3 rounded-full text-sm">Shop now</Link>
        <Link to="/contact" className="btn-outline-gold inline-block px-8 py-3 rounded-full text-sm">Talk to concierge</Link>
      </div>
    </div>
  );
}
