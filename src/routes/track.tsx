import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Package, CheckCircle2, Clock, XCircle, AlertCircle, MapPin, StickyNote } from "lucide-react";
import { formatPrice } from "@/lib/products";
import { PICKUP_POINTS } from "@/lib/pickup";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track Your Order — OMORA BLOOMS" },
      { name: "description", content: "Check the live status of your OMORA BLOOMS order using your Order ID or the phone number used at checkout." },
      { property: "og:title", content: "Track Your Order — OMORA BLOOMS" },
      { property: "og:description", content: "Check the live status of your OMORA BLOOMS order using your Order ID or phone number." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrackPage,
});

type Item = { id: string; name: string; price: number; quantity: number };
type Order = {
  razorpay_order_id: string;
  amount: number;
  currency: string;
  status: string;
  items: Item[] | null;
  delivery_notes: string | null;
  pickup_point_id: string | null;
  priority: string;
  created_at: string;
  updated_at: string;
};

const STATUS: Record<string, { label: string; tone: string; icon: typeof Clock; blurb: string }> = {
  created:   { label: "Created",   tone: "bg-[color:var(--gold)]/15 text-[color:var(--gold)] border-[color:var(--gold)]/30", icon: Clock,        blurb: "Order created. Awaiting payment." },
  pending:   { label: "Pending",   tone: "bg-amber-500/15 text-amber-400 border-amber-500/30",                                icon: Clock,        blurb: "Payment is being processed." },
  paid:      { label: "Paid",      tone: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",                          icon: CheckCircle2, blurb: "Payment received — your bouquet is being prepared." },
  failed:    { label: "Failed",    tone: "bg-red-500/15 text-red-400 border-red-500/30",                                      icon: XCircle,      blurb: "Payment failed. Please retry or contact us." },
  cancelled: { label: "Cancelled", tone: "bg-neutral-500/15 text-neutral-300 border-neutral-500/30",                          icon: AlertCircle,  blurb: "Checkout was cancelled." },
};

function TrackPage() {
  const [mode, setMode] = useState<"order" | "phone">("order");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    setErr(null);
    setOrders(null);
    try {
      const r = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "order" ? { orderId: value.trim() } : { phone: value.trim() }),
      });
      const j = await r.json();
      if (!r.ok) setErr(j.error ?? "Could not look up your order.");
      else setOrders(j.orders as Order[]);
    } catch {
      setErr("Network error. Please retry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-luxe py-12 md:py-20">
      <p className="eyebrow mb-3">Order Tracking</p>
      <h1 className="font-serif text-3xl md:text-5xl mb-3">Track your order</h1>
      <p className="text-sm text-[color:var(--muted-foreground)] max-w-xl mb-8">
        Enter your Order ID or the phone number you used at checkout to see the live status of your OMORA BLOOMS order.
      </p>

      <form onSubmit={search} className="glass-card rounded-2xl p-5 md:p-6 max-w-2xl">
        <div className="flex gap-2 mb-4">
          {(["order", "phone"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setValue(""); setOrders(null); setErr(null); }}
              className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest border hairline ${
                mode === m ? "btn-gold" : "text-[color:var(--muted-foreground)]"
              }`}
            >
              {m === "order" ? "Order ID" : "Phone number"}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode={mode === "phone" ? "tel" : "text"}
            maxLength={mode === "phone" ? 15 : 80}
            placeholder={mode === "order" ? "order_XXXXXXXXXXXX" : "10-digit mobile number"}
            className="flex-1 bg-transparent border hairline rounded-full px-5 py-3 text-sm outline-none focus:border-[color:var(--gold)]"
            aria-label={mode === "order" ? "Order ID" : "Phone number"}
          />
          <button type="submit" disabled={loading} className="btn-gold inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full text-sm disabled:opacity-60">
            <Search className="h-4 w-4" /> {loading ? "Checking…" : "Track"}
          </button>
        </div>
        {err && <p className="mt-3 text-xs text-red-400">{err}</p>}
      </form>

      {orders && orders.length === 0 && (
        <div className="glass-card rounded-2xl p-8 mt-8 max-w-2xl text-center">
          <Package className="h-8 w-8 mx-auto mb-3 text-[color:var(--gold)]" />
          <p className="font-serif text-2xl mb-1">No order found</p>
          <p className="text-sm text-[color:var(--muted-foreground)]">
            Double-check your details, or <Link to="/contact" className="text-[color:var(--gold)]">contact our concierge</Link>.
          </p>
        </div>
      )}

      {orders && orders.length > 0 && (
        <div className="mt-10 space-y-5 max-w-3xl">
          <h2 className="font-serif text-2xl">{orders.length > 1 ? "Your recent orders" : "Order details"}</h2>
          {orders.map((o) => {
            const meta = STATUS[o.status] ?? STATUS.created;
            const Icon = meta.icon;
            const pickup = PICKUP_POINTS.find((p) => p.id === o.pickup_point_id);
            return (
              <div key={o.razorpay_order_id} className={`glass-card rounded-2xl p-6 border ${meta.tone}`}>
                <div className="flex items-start gap-4">
                  <Icon className="h-7 w-7 mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="eyebrow">Payment status</p>
                    <p className="font-serif text-2xl mt-1">{meta.label}</p>
                    <p className="text-sm opacity-80 mt-1">{meta.blurb}</p>
                    <p className="text-xs font-mono mt-3 break-all opacity-70">{o.razorpay_order_id}</p>
                    <p className="text-xs opacity-70 mt-1">
                      Placed {new Date(o.created_at).toLocaleString()} · {formatPrice(Number(o.amount))}
                    </p>

                    {pickup && (
                      <p className="mt-3 inline-flex items-center gap-2 text-xs border hairline rounded-full px-3 py-1.5">
                        <MapPin className="h-3.5 w-3.5" /> {pickup.label}
                      </p>
                    )}

                    {o.items && o.items.length > 0 && (
                      <div className="mt-4 space-y-1.5 text-sm">
                        {o.items.map((i, idx) => (
                          <div key={`${i.id}-${idx}`} className="flex justify-between gap-3">
                            <span className="opacity-90">{i.name} × {i.quantity}</span>
                            <span>{formatPrice(i.price * i.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {o.delivery_notes && (
                      <p className="mt-4 flex items-start gap-2 text-xs opacity-80">
                        <StickyNote className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span className="whitespace-pre-wrap">{o.delivery_notes}</span>
                      </p>
                    )}

                    <Link
                      to="/order/$orderId"
                      params={{ orderId: o.razorpay_order_id }}
                      className="btn-outline-gold inline-block mt-5 px-5 py-2 rounded-full text-xs"
                    >
                      View full status
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
