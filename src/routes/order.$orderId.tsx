import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, XCircle, AlertCircle, RefreshCw, ArrowLeft, MapPin, Timer, StickyNote } from "lucide-react";
import { formatPrice } from "@/lib/products";
import { getPickupForOrder } from "@/lib/pickup";
import { getOrderPhone, saveOrderPhone, normalizeOrderPhone } from "@/lib/order-owner";


export const Route = createFileRoute("/order/$orderId")({
  head: () => ({ meta: [{ title: "Order Status — OMORA BLOOMS" }] }),
  component: OrderStatusPage,
});

type PaymentItem = { id: string; name: string; price: number; quantity: number };
type PaymentRow = {
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount: number;
  currency: string;
  status: "created" | "pending" | "paid" | "failed" | "cancelled" | string;
  items: PaymentItem[] | null;
  error_message: string | null;
  delivery_notes?: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_META: Record<string, { label: string; tone: string; icon: typeof Clock; blurb: string }> = {
  created:   { label: "Created",   tone: "bg-[color:var(--gold)]/15 text-[color:var(--gold)] border-[color:var(--gold)]/30", icon: Clock,        blurb: "Order created. Waiting for payment to begin." },
  pending:   { label: "Pending",   tone: "bg-amber-500/15 text-amber-400 border-amber-500/30",                                icon: Clock,        blurb: "Payment is being processed by your bank." },
  paid:      { label: "Paid",      tone: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",                          icon: CheckCircle2, blurb: "Payment successful. Our concierge will confirm shortly." },
  failed:    { label: "Failed",    tone: "bg-red-500/15 text-red-400 border-red-500/30",                                      icon: XCircle,      blurb: "Payment failed. Please try again or contact us." },
  cancelled: { label: "Cancelled", tone: "bg-neutral-500/15 text-neutral-300 border-neutral-500/30",                          icon: AlertCircle,  blurb: "Checkout was cancelled before payment completed." },
};

function OrderStatusPage() {
  const { orderId } = Route.useParams();
  const [data, setData] = useState<PaymentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const pickup = getPickupForOrder(orderId);
  const [phone, setPhone] = useState("");
  const [needsPhone, setNeedsPhone] = useState(false);

  async function load(phoneOverride?: string) {
    const proof = normalizeOrderPhone(phoneOverride ?? phone ?? "");
    if (proof.length !== 10) {
      setNeedsPhone(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/razorpay/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, phone: proof }),
      });
      if (!r.ok) {
        setNeedsPhone(true);
        setErr(r.status === 404 ? "We couldn't find an order matching that ID and phone number." : "Could not load status.");
        setData(null);
      } else {
        setNeedsPhone(false);
        saveOrderPhone(orderId, proof);
        setData((await r.json()) as PaymentRow);
      }
    } catch {
      setErr("Network error. Please retry.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const stored = getOrderPhone(orderId);
    if (stored) { setPhone(stored); void load(stored); }
    else { setNeedsPhone(true); setLoading(false); }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [orderId]);
  useEffect(() => {
    if (!data) return;
    if (data.status === "created" || data.status === "pending") {
      const t = setInterval(() => { void load(); }, 5000);
      return () => clearInterval(t);
    }
  }, [data?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const meta = data ? (STATUS_META[data.status] ?? STATUS_META.created) : STATUS_META.created;
  const Icon = meta.icon;

  return (
    <div className="container-luxe py-16 md:py-24">
      <Link to="/shop" className="inline-flex items-center gap-2 text-xs text-[color:var(--muted-foreground)] hover:text-[color:var(--gold)] mb-6">
        <ArrowLeft className="h-3.5 w-3.5" /> Continue shopping
      </Link>
      <p className="eyebrow mb-3">Order Status</p>
      <h1 className="font-serif text-4xl md:text-5xl mb-2">Your order</h1>
      <p className="text-[color:var(--muted-foreground)] text-sm mb-10">Order ID: <span className="font-mono">{orderId}</span></p>

      {needsPhone && !data ? (
        <div className="glass-card rounded-2xl p-8 max-w-md">
          <p className="eyebrow mb-2">Verify it's you</p>
          <p className="text-sm text-[color:var(--muted-foreground)] mb-4">
            For your privacy, enter the phone number used at checkout to view this order.
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); void load(phone); }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              className="flex-1 rounded-full bg-transparent border border-[color:var(--gold)]/30 px-5 py-2.5 text-sm outline-none focus:border-[color:var(--gold)]"
            />
            <button type="submit" className="btn-outline-gold px-6 py-2.5 rounded-full text-sm">View order</button>
          </form>
          {err ? <p className="text-xs text-red-400 mt-3">{err}</p> : null}
        </div>
      ) : loading && !data ? (
        <div className="glass-card rounded-2xl p-10 text-center text-[color:var(--muted-foreground)]">Loading status…</div>
      ) : err ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="font-serif text-2xl mb-2">{err}</p>
          <button onClick={() => { void load(); }} className="btn-outline-gold mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      ) : data ? (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className={`glass-card rounded-2xl p-6 border ${meta.tone}`}>
              <div className="flex items-start gap-4">
                <Icon className="h-8 w-8 mt-1" />
                <div className="flex-1">
                  <p className="eyebrow">Payment status</p>
                  <p className="font-serif text-3xl mt-1">{meta.label}</p>
                  <p className="text-sm opacity-80 mt-2">{meta.blurb}</p>
                </div>
                <button onClick={() => { void load(); }} className="p-2 rounded-full hover:bg-white/5" aria-label="Refresh">
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
              {data.error_message && (
                <p className="mt-4 text-xs opacity-80">Reason: {data.error_message}</p>
              )}
            </div>

            {pickup && (
              <div className="glass-card rounded-2xl p-6 border hairline">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)]">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="eyebrow">Airport Pickup Point</p>
                    <p className="font-serif text-2xl mt-1">{pickup.label}</p>
                    <p className="text-sm text-[color:var(--muted-foreground)] mt-1">{pickup.detail}</p>
                    <p className="mt-4 inline-flex items-center gap-2 text-xs text-[color:var(--gold)] border hairline rounded-full px-3 py-1.5">
                      <Timer className="h-3.5 w-3.5" /> Express 30–45 minute delivery window
                    </p>
                    <p className="mt-3 text-[11px] text-[color:var(--muted-foreground)]">
                      Security rules restrict delivery executives from entering gate check-in areas. Please meet our delivery agent at the Pickup Point above.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {data.delivery_notes && (
              <div className="glass-card rounded-2xl p-6 border hairline">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)]">
                    <StickyNote className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="eyebrow">Delivery Notes / Instructions</p>
                    <p className="text-sm text-[color:var(--foreground)] mt-2 whitespace-pre-wrap">{data.delivery_notes}</p>
                  </div>
                </div>
              </div>
            )}

            {data.items && data.items.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <p className="eyebrow mb-4">Items</p>
                <div className="space-y-3">
                  {data.items.map((i) => (
                    <div key={i.id} className="flex justify-between text-sm">
                      <span>{i.name} × {i.quantity}</span>
                      <span className="text-[color:var(--gold)]">{formatPrice(i.price * i.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="glass-card rounded-2xl p-6 h-fit space-y-3 text-sm">
            <p className="eyebrow mb-2">Details</p>
            <OrderDetailRow label="Amount" value={formatPrice(Number(data.amount))} gold />
            <OrderDetailRow label="Currency" value={data.currency} />
            <OrderDetailRow label="Order ID" value={data.razorpay_order_id} mono />
            {data.razorpay_payment_id && <OrderDetailRow label="Payment ID" value={data.razorpay_payment_id} mono />}
            <OrderDetailRow label="Created" value={new Date(data.created_at).toLocaleString()} />
            <OrderDetailRow label="Updated" value={new Date(data.updated_at).toLocaleString()} />
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function OrderDetailRow({ label, value, mono, gold }: { label: string; value: string; mono?: boolean; gold?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[color:var(--muted-foreground)]">{label}</span>
      <span className={`${mono ? "font-mono text-xs" : ""} ${gold ? "text-[color:var(--gold)]" : ""} text-right break-all`}>{value}</span>
    </div>
  );
}
