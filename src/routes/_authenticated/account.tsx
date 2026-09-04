import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Package, Loader2, ArrowRight } from "lucide-react";
import { getMyOrders } from "@/lib/account.functions";
import { RewardsPanel } from "@/components/site/RewardsPanel";
import { OccasionsPanel } from "@/components/site/OccasionsPanel";
import { formatPrice } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My Orders — OMORA BLOOMS" },
      { name: "description", content: "View your OMORA BLOOMS order history, payment status and balance due on every handmade bouquet order." },
      { property: "og:title", content: "My Orders — OMORA BLOOMS" },
      { property: "og:description", content: "Your OMORA BLOOMS order history and live payment status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountPage,
});

const TONE: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  created: "bg-[color:var(--gold)]/15 text-[color:var(--gold)] border-[color:var(--gold)]/30",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  failed: "bg-red-500/15 text-red-400 border-red-500/30",
  cancelled: "bg-neutral-500/15 text-neutral-300 border-neutral-500/30",
};

function AccountPage() {
  const fetchOrders = useServerFn(getMyOrders);
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => fetchOrders({}),
  });

  return (
    <div className="container-luxe py-12 md:py-20">
      <p className="eyebrow mb-3">My Account</p>
      <h1 className="font-serif text-3xl md:text-5xl mb-3">Order history</h1>
      <p className="text-sm text-[color:var(--muted-foreground)] max-w-xl mb-8">
        Every order placed with the email address on your account appears here.
      </p>

      <RewardsPanel />

      <OccasionsPanel />


      {isLoading && (
        <div className="flex items-center gap-3 text-sm text-[color:var(--muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your orders…
        </div>
      )}

      {error && <p className="text-sm text-red-400">Could not load your orders. Please retry shortly.</p>}

      {data && data.length === 0 && (
        <div className="glass-card rounded-2xl p-8 text-center max-w-xl">
          <Package className="mx-auto h-8 w-8 text-[color:var(--gold)]" />
          <p className="mt-4 text-sm text-[color:var(--muted-foreground)]">
            No orders yet. Explore our handmade collections to begin.
          </p>
          <Link to="/collections" className="btn-gold mt-6 inline-block px-8 py-3 rounded-full text-sm">
            Browse Collections
          </Link>
        </div>
      )}

      <div className="grid gap-4 max-w-3xl">
        {data?.map((o) => {
          const items = Array.isArray(o.items) ? o.items : [];
          return (
            <div key={o.razorpay_order_id} className="glass-card rounded-2xl p-5 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] tracking-[0.2em] uppercase text-[color:var(--muted-foreground)]">
                    {new Date(o.created_at).toLocaleString("en-IN")}
                  </p>
                  <p className="mt-1 font-mono text-xs">{o.razorpay_order_id}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-widest ${TONE[o.status] ?? TONE.created}`}>
                  {o.status}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {items.map((it, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    {it.image ? (
                      <img src={it.image} alt={it.name ?? "Order item"} loading="lazy" className="h-12 w-12 rounded-lg object-cover" />
                    ) : null}
                    <span>{it.name}</span>
                    {it.quantity && it.quantity > 1 ? (
                      <span className="text-[color:var(--muted-foreground)]">× {it.quantity}</span>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t hairline pt-3 text-sm flex flex-wrap gap-x-6 gap-y-1">
                <span>Paid: <strong className="text-[color:var(--gold)]">{formatPrice(Number(o.amount))}</strong></span>
                {o.order_total ? <span className="text-[color:var(--muted-foreground)]">Order total: {formatPrice(Number(o.order_total))}</span> : null}
                {Number(o.balance_due) > 0 ? (
                  <span className="text-amber-400">Balance on delivery: {formatPrice(Number(o.balance_due))}</span>
                ) : null}
              </div>

              <Link
                to="/track"
                className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[color:var(--gold)] hover:opacity-80"
              >
                Track this order <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
