import { Zap, Truck, Crown } from "lucide-react";

export function DeliveryBanner() {
  return (
    <div className="bg-[color:var(--noir)] border-b hairline">
      <div className="container-luxe py-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[11px] tracking-[0.14em] uppercase">
        <span className="inline-flex items-center gap-1.5 text-emerald-300">
          <Zap className="h-3 w-3" /> Express Zone · 20–30 mins
        </span>
        <span className="inline-flex items-center gap-1.5 text-sky-300">
          <Truck className="h-3 w-3" /> Regional · 1–2 hours
        </span>
        <span className="inline-flex items-center gap-1.5 text-[color:var(--gold)]">
          <Crown className="h-3 w-3" /> Prestige Priority · 45 mins – 1 hour
        </span>
      </div>
    </div>
  );
}
