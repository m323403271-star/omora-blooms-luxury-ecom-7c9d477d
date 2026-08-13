import { DELIVERY_PARTNER_EMAIL } from "@/lib/whatsapp";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Crown,
  Plane,
  Phone,
  Navigation,
  CloudRain,
  Clock,
  RefreshCw,
  LogOut,
  MapPin,
  Package,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { findPickup } from "@/lib/pickup";
import { PriorityBadge } from "./admin.warehouse";

type Priority = "airport" | "prestige" | "standard";

type OrderRow = {
  id: string;
  razorpay_order_id: string;
  amount: number;
  status: string;
  pincode: string | null;
  pickup_point_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  priority: Priority;
  created_at: string;
  items: Array<{ name: string; quantity: number }> | null;
};

const SLA_MINUTES: Record<Priority, number> = { airport: 30, prestige: 60, standard: 180 };
const DELAY_KEY = "omora_agent_delay_";

export const Route = createFileRoute("/_authenticated/agent")({
  head: () => ({ meta: [{ title: "Agent Runsheet — OMORA BLOOMS" }, { name: "robots", content: "noindex" }] }),
  component: AgentApp,
});

function AgentApp() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [delays, setDelays] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const rec: Record<string, boolean> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(DELAY_KEY)) rec[k.slice(DELAY_KEY.length)] = localStorage.getItem(k) === "1";
      }
      setDelays(rec);
    } catch { /* ignore */ }
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .in("status", ["created", "pending", "paid"])
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) toast.error(error.message);
    setOrders(((data ?? []) as unknown) as OrderRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const iv = setInterval(load, 20000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const sorted = useMemo(() => {
    const rank: Record<Priority, number> = { airport: 0, prestige: 1, standard: 2 };
    return [...orders].sort((a, b) => {
      const r = rank[a.priority] - rank[b.priority];
      if (r !== 0) return r;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [orders]);

  function toggleDelay(id: string) {
    const next = !delays[id];
    setDelays((d) => ({ ...d, [id]: next }));
    try {
      if (next) localStorage.setItem(DELAY_KEY + id, "1");
      else localStorage.removeItem(DELAY_KEY + id);
    } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen bg-[color:var(--noir)] pb-20">
      <div className="sticky top-0 z-30 bg-[color:var(--noir)]/95 backdrop-blur border-b hairline">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="eyebrow">Runsheet</p>
            <h1 className="font-serif text-xl">Delivery Agent</h1>
            <a
              href={`mailto:${DELIVERY_PARTNER_EMAIL}`}
              className="text-[10px] tracking-widest uppercase text-[color:var(--muted-foreground)] hover:text-[color:var(--gold)]"
            >
              {DELIVERY_PARTNER_EMAIL}
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/admin/referrals" className="text-[11px] tracking-widest uppercase text-[color:var(--muted-foreground)] hover:text-[color:var(--gold)]">Admin</Link>
            <button onClick={load} aria-label="Refresh" className="p-2 rounded-full border hairline text-[color:var(--gold)]">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }} aria-label="Sign out" className="p-2 rounded-full border hairline text-[color:var(--muted-foreground)]">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
        {sorted.length === 0 && (
          <div className="rounded-2xl border hairline p-8 text-center text-[color:var(--muted-foreground)]">
            No active deliveries.
          </div>
        )}
        {sorted.map((o) => (
          <AgentCard key={o.id} order={o} now={now} delayed={!!delays[o.id]} onToggleDelay={() => toggleDelay(o.id)} />
        ))}
      </div>
    </div>
  );
}

function AgentCard({ order, now, delayed, onToggleDelay }: { order: OrderRow; now: number; delayed: boolean; onToggleDelay: () => void }) {
  const created = new Date(order.created_at).getTime();
  const slaMs = (SLA_MINUTES[order.priority] + (delayed ? 15 : 0)) * 60_000;
  const remaining = created + slaMs - now;
  const overdue = remaining < 0;
  const mins = Math.floor(Math.abs(remaining) / 60000);
  const secs = Math.floor((Math.abs(remaining) % 60000) / 1000);
  const timer = `${mins}m ${String(secs).padStart(2, "0")}s`;

  const pickup = findPickup(order.pickup_point_id);
  const isAirport = order.priority === "airport";
  const isPrestige = order.priority === "prestige";

  const container = isAirport
    ? "border-emerald-400/60 bg-emerald-500/15 shadow-[0_0_24px_rgba(16,185,129,0.3)]"
    : isPrestige
      ? "border-[color:var(--gold)]/60 bg-gradient-to-br from-[color:var(--gold)]/15 via-purple-500/10 to-[color:var(--gold)]/15 shadow-[0_0_24px_rgba(200,162,74,0.28)]"
      : "border-[color:var(--border)] bg-[color:var(--card)]/40";

  const mapQuery = encodeURIComponent(
    pickup?.detail ? `${pickup.detail}, Kempegowda International Airport` : `${order.pincode ?? ""} India`
  );

  return (
    <div className={`rounded-2xl border ${container} p-4 relative`}>
      {(isAirport || isPrestige) && (
        <span className={`absolute top-3 right-3 h-2 w-2 rounded-full ${isAirport ? "bg-emerald-400" : "bg-[color:var(--gold)]"} animate-pulse`} />
      )}
      <PriorityBadge priority={order.priority} />

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-lg leading-tight">{order.customer_name ?? "Guest customer"}</p>
          <p className="text-xs text-[color:var(--muted-foreground)] font-mono mt-0.5">{order.razorpay_order_id.slice(-10)}</p>
        </div>
        <div className={`text-right ${overdue ? "text-red-400" : isAirport ? "text-emerald-300" : isPrestige ? "text-[color:var(--gold)]" : "text-[color:var(--foreground)]"}`}>
          <p className="text-[10px] tracking-widest uppercase flex items-center justify-end gap-1"><Clock className="h-3 w-3" /> {overdue ? "Late" : "SLA"}</p>
          <p className="font-mono text-xl font-semibold tabular-nums">{overdue ? `+${timer}` : timer}</p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 text-xs">
        <p className="flex items-center gap-2 text-[color:var(--muted-foreground)]">
          <MapPin className="h-3.5 w-3.5 text-[color:var(--gold)]" />
          {pickup?.label ?? (order.pincode ? `Pincode ${order.pincode}` : "Address on file")}
        </p>
        {pickup?.detail && <p className="pl-6 text-[color:var(--muted-foreground)]">{pickup.detail}</p>}
        <p className="flex items-center gap-2 text-[color:var(--muted-foreground)]">
          <Package className="h-3.5 w-3.5 text-[color:var(--gold)]" />
          {(order.items ?? []).map((i) => `${i.name}×${i.quantity}`).join(" · ") || "Order details"}
          <span className="ml-auto text-[color:var(--gold)] font-medium">₹{order.amount.toLocaleString("en-IN")}</span>
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <a
          href={order.customer_phone ? `tel:${order.customer_phone}` : "#"}
          onClick={(e) => { if (!order.customer_phone) { e.preventDefault(); toast.message("No phone on file"); } }}
          className="rounded-xl border hairline bg-[color:var(--noir)]/60 py-2.5 flex flex-col items-center gap-1 text-[10px] tracking-widest uppercase text-[color:var(--foreground)] hover:bg-[color:var(--gold)]/10"
        >
          <Phone className="h-4 w-4 text-[color:var(--gold)]" /> Call
        </a>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border hairline bg-[color:var(--noir)]/60 py-2.5 flex flex-col items-center gap-1 text-[10px] tracking-widest uppercase hover:bg-[color:var(--gold)]/10"
        >
          <Navigation className="h-4 w-4 text-[color:var(--gold)]" /> Navigate
        </a>
        <button
          onClick={onToggleDelay}
          className={`rounded-xl border py-2.5 flex flex-col items-center gap-1 text-[10px] tracking-widest uppercase ${
            delayed
              ? "border-amber-400/70 bg-amber-500/20 text-amber-200"
              : "hairline bg-[color:var(--noir)]/60 hover:bg-[color:var(--gold)]/10"
          }`}
        >
          <CloudRain className={`h-4 w-4 ${delayed ? "text-amber-300" : "text-[color:var(--gold)]"}`} />
          {delayed ? "+15m Delay" : "Delay +15"}
        </button>
      </div>
    </div>
  );
}
