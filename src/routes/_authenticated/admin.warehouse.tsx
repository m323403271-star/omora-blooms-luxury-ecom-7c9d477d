import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Crown,
  Plane,
  Zap,
  Package,
  Clock,
  RefreshCw,
  LogOut,
  MapPin,
  Phone,
  AlertTriangle,
  Truck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { findPickup } from "@/lib/pickup";
import { OrderPreviewSender } from "@/components/site/OrderPreviewSender";

type Priority = "airport" | "prestige" | "standard";

type OrderRow = {
  id: string;
  razorpay_order_id: string;
  amount: number;
  status: string;
  pincode: string | null;
  customer_tier: "regular" | "prestige" | null;
  pickup_point_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  priority: Priority;
  created_at: string;
  items: Array<{ name: string; quantity: number }> | null;
};

const SLA_MINUTES: Record<Priority, number> = {
  airport: 30,
  prestige: 60,
  standard: 180,
};

export const Route = createFileRoute("/_authenticated/admin/warehouse")({
  head: () => ({ meta: [{ title: "Warehouse Dispatch — OMORA BLOOMS" }, { name: "robots", content: "noindex" }] }),
  component: WarehouseDashboard,
});

function WarehouseDashboard() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) return navigate({ to: "/auth" });
      const { data, error } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" as never });
      if (error || !data) {
        toast.error("Admin access required");
        return navigate({ to: "/" });
      }
      setChecking(false);
    })();
  }, [navigate]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .in("status", ["created", "pending", "paid"])
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    setOrders(((data ?? []) as unknown) as OrderRow[]);
    setLoading(false);
  }

  useEffect(() => {
    if (checking) return;
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [checking]);

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

  const airportCount = orders.filter((o) => o.priority === "airport").length;
  const prestigeCount = orders.filter((o) => o.priority === "prestige").length;
  const standardCount = orders.filter((o) => o.priority === "standard").length;

  if (checking) {
    return <div className="container-luxe py-24 text-center text-[color:var(--muted-foreground)]">Verifying access…</div>;
  }

  return (
    <div className="container-luxe py-8 md:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="eyebrow mb-1">Dispatch Console</p>
          <h1 className="font-serif text-3xl md:text-4xl">Warehouse Priority Queue</h1>
          <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
            Airport Express and Prestige VIP orders auto-pin to the top. Live SLA countdowns below.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/agent" className="btn-outline-gold px-4 py-2 rounded-full text-xs tracking-widest uppercase inline-flex items-center gap-2">
            <Truck className="h-3.5 w-3.5" /> Agent View
          </Link>
          <button onClick={load} className="btn-outline-gold px-4 py-2 rounded-full text-xs tracking-widest uppercase inline-flex items-center gap-2">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}
            className="text-xs tracking-widest uppercase text-[color:var(--muted-foreground)] hover:text-[color:var(--gold)] inline-flex items-center gap-1"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard
          label="Airport Express"
          value={airportCount}
          icon={<Plane className="h-4 w-4" />}
          className="border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
        />
        <StatCard
          label="Prestige VIP"
          value={prestigeCount}
          icon={<Crown className="h-4 w-4" />}
          className="border-[color:var(--gold)]/50 bg-[color:var(--gold)]/10 text-[color:var(--gold)]"
        />
        <StatCard
          label="Standard Queue"
          value={standardCount}
          icon={<Package className="h-4 w-4" />}
          className="border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--muted-foreground)]"
        />
      </div>

      <div className="space-y-3">
        {sorted.length === 0 && (
          <div className="rounded-2xl border hairline p-10 text-center text-[color:var(--muted-foreground)]">
            No active orders in the queue.
          </div>
        )}
        {sorted.map((o, idx) => (
          <OrderRowCard key={o.id} order={o} now={now} position={idx + 1} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, className }: { label: string; value: number; icon: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border ${className ?? ""} px-5 py-4 flex items-center justify-between`}>
      <div>
        <p className="text-[11px] tracking-[0.2em] uppercase opacity-80">{label}</p>
        <p className="font-serif text-3xl mt-1">{value}</p>
      </div>
      <div className="opacity-80">{icon}</div>
    </div>
  );
}

function OrderRowCard({ order, now, position }: { order: OrderRow; now: number; position: number }) {
  const created = new Date(order.created_at).getTime();
  const slaMs = SLA_MINUTES[order.priority] * 60_000;
  const remaining = created + slaMs - now;
  const overdue = remaining < 0;
  const mins = Math.floor(Math.abs(remaining) / 60000);
  const secs = Math.floor((Math.abs(remaining) % 60000) / 1000);
  const timer = `${mins}m ${String(secs).padStart(2, "0")}s`;

  const pickup = findPickup(order.pickup_point_id);
  const itemsList = Array.isArray(order.items) ? order.items : [];

  const isAirport = order.priority === "airport";
  const isPrestige = order.priority === "prestige";

  const container = isAirport
    ? "border-emerald-400/60 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.25)]"
    : isPrestige
      ? "border-[color:var(--gold)]/60 bg-gradient-to-r from-[color:var(--gold)]/10 via-purple-500/5 to-[color:var(--gold)]/10 shadow-[0_0_30px_rgba(200,162,74,0.25)]"
      : "border-[color:var(--border)] bg-[color:var(--card)]/40";

  return (
    <div className={`rounded-2xl border ${container} p-5 relative overflow-hidden`}>
      {(isAirport || isPrestige) && (
        <span className={`absolute top-3 right-3 h-2.5 w-2.5 rounded-full ${isAirport ? "bg-emerald-400" : "bg-[color:var(--gold)]"} animate-pulse`} />
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="text-[10px] tracking-[0.2em] uppercase font-bold rounded-full border hairline px-2 py-1 text-[color:var(--muted-foreground)]">
            #{position}
          </div>
          <div>
            <PriorityBadge priority={order.priority} />
            <p className="mt-2 font-mono text-xs text-[color:var(--muted-foreground)]">{order.razorpay_order_id}</p>
            <p className="text-xs text-[color:var(--muted-foreground)]">
              Placed {new Date(order.created_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
            </p>
          </div>
        </div>

        <div className={`text-right ${overdue ? "text-red-400" : isAirport ? "text-emerald-300" : isPrestige ? "text-[color:var(--gold)]" : "text-[color:var(--foreground)]"}`}>
          <p className="text-[10px] tracking-[0.2em] uppercase flex items-center justify-end gap-1">
            <Clock className="h-3 w-3" /> {overdue ? "Overdue" : "SLA"}
          </p>
          <p className="font-mono text-2xl font-semibold tabular-nums">{overdue ? `+${timer}` : timer}</p>
          {overdue && (
            <p className="text-[10px] uppercase tracking-widest flex items-center justify-end gap-1 mt-1">
              <AlertTriangle className="h-3 w-3" /> Escalate now
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid md:grid-cols-3 gap-3 text-xs">
        <InfoBlock
          label="Deliver to"
          icon={<MapPin className="h-3 w-3" />}
          value={
            <>
              {order.pincode ?? "—"}
              {pickup && <span className="block text-[color:var(--muted-foreground)] mt-0.5">{pickup.label}</span>}
            </>
          }
        />
        <InfoBlock
          label="Customer"
          icon={<Phone className="h-3 w-3" />}
          value={
            <>
              {order.customer_name ?? "Guest"}
              {order.customer_phone && (
                <a href={`tel:${order.customer_phone}`} className="block text-[color:var(--gold)] mt-0.5">
                  {order.customer_phone}
                </a>
              )}
            </>
          }
        />
        <InfoBlock
          label="Status · Amount"
          icon={<Package className="h-3 w-3" />}
          value={
            <>
              <span className="uppercase tracking-widest">{order.status}</span>
              <span className="block text-[color:var(--gold)] mt-0.5">₹{order.amount.toLocaleString("en-IN")}</span>
            </>
          }
        />
      </div>

      {itemsList.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {itemsList.map((it, i) => (
            <span key={i} className="text-[11px] rounded-full border hairline px-2.5 py-1 text-[color:var(--muted-foreground)]">
              {it.name} × {it.quantity}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoBlock({ label, icon, value }: { label: string; icon: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border hairline bg-[color:var(--noir)]/40 p-3">
      <p className="text-[10px] tracking-[0.2em] uppercase text-[color:var(--muted-foreground)] flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="mt-1 text-sm text-[color:var(--foreground)]">{value}</p>
    </div>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === "airport") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/60 px-3 py-1 text-[11px] tracking-widest uppercase font-bold text-emerald-200">
        <Plane className="h-3.5 w-3.5" /> ✈️ Airport Express VIP · 20–30m SLA
      </span>
    );
  }
  if (priority === "prestige") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient text-[color:var(--noir)] border border-[color:var(--gold)] px-3 py-1 text-[11px] tracking-widest uppercase font-bold">
        <Crown className="h-3.5 w-3.5" /> ⭐ Prestige VIP · 45m – 1hr SLA
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border hairline px-3 py-1 text-[11px] tracking-widest uppercase text-[color:var(--muted-foreground)]">
      <Zap className="h-3.5 w-3.5" /> Standard
    </span>
  );
}
