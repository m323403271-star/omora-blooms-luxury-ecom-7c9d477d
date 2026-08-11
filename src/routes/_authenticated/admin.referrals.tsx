import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Plus, LogOut, Save, RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Partner = {
  id: string;
  code: string;
  name: string;
  partner_type: string;
  contact_email: string | null;
  contact_phone: string | null;
  commission_rate: number;
  active: boolean;
};

type ReferredOrder = {
  id: string;
  partner_code: string;
  total: number;
  commission_amount: number;
  status: string;
  created_at: string;
};

type Payment = {
  id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount: number;
  currency: string;
  status: string;
  ref_code: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

const BASE_URL = "https://omorablooms.com";

export const Route = createFileRoute("/_authenticated/admin/referrals")({
  head: () => ({ meta: [{ title: "Referrals Admin — OMORA BLOOMS" }, { name: "robots", content: "noindex" }] }),
  component: AdminReferrals,
});

function AdminReferrals() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [orders, setOrders] = useState<ReferredOrder[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<"all" | "created" | "paid" | "failed" | "cancelled" | "pending">("all");
  const [refreshingPayments, setRefreshingPayments] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", partner_type: "driver", contact_email: "", contact_phone: "", commission_rate: 10 });
  const [settings, setSettings] = useState({ default_commission_rate: 10, razorpay_enabled: true, whatsapp_enabled: true });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return navigate({ to: "/auth" });
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      if (!roles?.some((r) => r.role === "admin")) {
        toast.error("Admin access required");
        return navigate({ to: "/partner" });
      }
      setChecking(false);
      await refresh();
    })();
  }, [navigate]);

  async function refresh() {
    const [p, o, s, pay] = await Promise.all([
      supabase.from("partners").select("*").order("created_at", { ascending: false }),
      supabase.from("referred_orders").select("id, partner_code, total, commission_amount, status, created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("site_settings").select("default_commission_rate, razorpay_enabled, whatsapp_enabled").eq("id", true).maybeSingle(),
      supabase.from("payments").select("id, razorpay_order_id, razorpay_payment_id, amount, currency, status, ref_code, error_message, created_at, updated_at").order("created_at", { ascending: false }).limit(100),
    ]);
    if (p.data) setPartners(p.data as Partner[]);
    if (o.data) setOrders(o.data as ReferredOrder[]);
    if (pay.data) setPayments(pay.data as Payment[]);
    if (s.data) {
      const sd = s.data;
      setSettings({
        default_commission_rate: Number(sd.default_commission_rate),
        razorpay_enabled: !!sd.razorpay_enabled,
        whatsapp_enabled: !!sd.whatsapp_enabled,
      });
      setForm((f) => ({ ...f, commission_rate: Number(sd.default_commission_rate) }));
    }
  }

  async function refreshPayments() {
    setRefreshingPayments(true);
    const { data } = await supabase.from("payments").select("id, razorpay_order_id, razorpay_payment_id, amount, currency, status, ref_code, error_message, created_at, updated_at").order("created_at", { ascending: false }).limit(100);
    if (data) setPayments(data as Payment[]);
    setRefreshingPayments(false);
  }


  async function saveSettings() {
    setSavingSettings(true);
    const { error } = await supabase.from("site_settings").update({
      default_commission_rate: settings.default_commission_rate,
      razorpay_enabled: settings.razorpay_enabled,
      whatsapp_enabled: settings.whatsapp_enabled,
    }).eq("id", true);
    setSavingSettings(false);
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
  }


  async function createPartner(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, code: form.code.toUpperCase().trim(), commission_rate: Number(form.commission_rate) };
    const { error } = await supabase.from("partners").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Partner created");
    setShowForm(false);
    setForm({ code: "", name: "", partner_type: "driver", contact_email: "", contact_phone: "", commission_rate: 10 });
    refresh();
  }

  async function toggleActive(p: Partner) {
    const { error } = await supabase.from("partners").update({ active: !p.active }).eq("id", p.id);
    if (error) return toast.error(error.message);
    refresh();
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (checking) return <div className="container-luxe py-24 text-center text-sm text-[color:var(--muted-foreground)]">Verifying admin access…</div>;

  const totalCommission = orders.reduce((s, o) => s + Number(o.commission_amount || 0), 0);

  return (
    <div className="container-luxe py-16 md:py-20">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-10">
        <div>
          <p className="eyebrow mb-3">Admin</p>
          <h1 className="font-serif text-4xl md:text-5xl">Referral Partners</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/admin/coupons" className="btn-outline-gold px-4 py-2.5 rounded-full text-sm inline-flex items-center gap-2">
            Coupons
          </Link>
          <Link to="/admin/carts" className="btn-outline-gold px-4 py-2.5 rounded-full text-sm inline-flex items-center gap-2">
            Abandoned Carts
          </Link>
          <Link to="/admin/products" className="btn-outline-gold px-4 py-2.5 rounded-full text-sm inline-flex items-center gap-2">
            Product photos
          </Link>
          <button onClick={() => setShowForm((s) => !s)} className="btn-gold px-5 py-2.5 rounded-full text-sm inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> New partner
          </button>
          <button onClick={signOut} className="btn-outline-gold px-4 py-2.5 rounded-full text-sm inline-flex items-center gap-2">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>

      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <StatCard label="Partners" value={String(partners.length)} />
        <StatCard label="Referred orders" value={String(orders.length)} />
        <StatCard label="Total commission" value={`₹${totalCommission.toLocaleString("en-IN")}`} />
      </div>

      <div className="glass-card rounded-2xl p-6 mb-10">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <p className="eyebrow mb-1">Commission & payment settings</p>
            <p className="text-xs text-[color:var(--muted-foreground)]">Applied as the default rate for new partners and checkout options shown to customers.</p>
          </div>
          <button onClick={saveSettings} disabled={savingSettings} className="btn-gold px-5 py-2.5 rounded-full text-sm inline-flex items-center gap-2 disabled:opacity-60">
            <Save className="h-4 w-4" /> {savingSettings ? "Saving…" : "Save settings"}
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs eyebrow block mb-2">Default commission %</label>
            <input
              type="number" min={0} max={100} step={0.5}
              value={settings.default_commission_rate}
              onChange={(e) => setSettings({ ...settings, default_commission_rate: Number(e.target.value) })}
              className="w-full bg-transparent hairline border rounded-full px-4 py-3 text-sm"
            />
          </div>
          <label className="flex items-center gap-3 hairline border rounded-full px-4 py-3 text-sm cursor-pointer">
            <input type="checkbox" checked={settings.razorpay_enabled} onChange={(e) => setSettings({ ...settings, razorpay_enabled: e.target.checked })} />
            <span>Razorpay checkout enabled</span>
          </label>
          <label className="flex items-center gap-3 hairline border rounded-full px-4 py-3 text-sm cursor-pointer">
            <input type="checkbox" checked={settings.whatsapp_enabled} onChange={(e) => setSettings({ ...settings, whatsapp_enabled: e.target.checked })} />
            <span>WhatsApp checkout enabled</span>
          </label>
        </div>
      </div>


      {showForm && (
        <form onSubmit={createPartner} className="glass-card rounded-2xl p-6 mb-10 grid md:grid-cols-2 gap-4">
          <Input label="Code (e.g. CAB001)" value={form.code} onChange={(v) => setForm({ ...form, code: v })} required />
          <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <div>
            <label className="text-xs eyebrow block mb-2">Type</label>
            <select value={form.partner_type} onChange={(e) => setForm({ ...form, partner_type: e.target.value })} className="w-full bg-transparent hairline border rounded-full px-4 py-3 text-sm">
              <option value="driver">Driver / Cab</option>
              <option value="hotel">Hotel</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Input label="Commission %" type="number" value={String(form.commission_rate)} onChange={(v) => setForm({ ...form, commission_rate: Number(v) })} />
          <Input label="Contact email" value={form.contact_email} onChange={(v) => setForm({ ...form, contact_email: v })} />
          <Input label="Contact phone" value={form.contact_phone} onChange={(v) => setForm({ ...form, contact_phone: v })} />
          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline-gold px-5 py-2.5 rounded-full text-sm">Cancel</button>
            <button type="submit" className="btn-gold px-5 py-2.5 rounded-full text-sm">Create partner</button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {partners.map((p) => (
          <PartnerCard key={p.id} partner={p} onToggle={() => toggleActive(p)} />
        ))}
        {partners.length === 0 && <p className="text-sm text-[color:var(--muted-foreground)]">No partners yet.</p>}
      </div>

      <h2 className="font-serif text-3xl mt-16 mb-6">Recent referred orders</h2>
      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs eyebrow border-b hairline">
            <tr><th className="p-3">Date</th><th className="p-3">Code</th><th className="p-3">Total</th><th className="p-3">Commission</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b hairline last:border-0">
                <td className="p-3">{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="p-3 text-[color:var(--gold)]">{o.partner_code}</td>
                <td className="p-3">₹{Number(o.total).toLocaleString("en-IN")}</td>
                <td className="p-3">₹{Number(o.commission_amount).toLocaleString("en-IN")}</td>
                <td className="p-3 capitalize">{o.status}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-[color:var(--muted-foreground)]">No referred orders yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <PaymentsPanel
        payments={payments}
        filter={paymentFilter}
        setFilter={setPaymentFilter}
        onRefresh={refreshPayments}
        refreshing={refreshingPayments}
      />
    </div>
  );
}

function PaymentsPanel({
  payments, filter, setFilter, onRefresh, refreshing,
}: {
  payments: Payment[];
  filter: "all" | "created" | "paid" | "failed" | "cancelled" | "pending";
  setFilter: (v: "all" | "created" | "paid" | "failed" | "cancelled" | "pending") => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const counts = payments.reduce(
    (acc, p) => { acc[p.status] = (acc[p.status] ?? 0) + 1; return acc; },
    {} as Record<string, number>,
  );
  const paidTotal = payments.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount || 0), 0);
  const filtered = filter === "all" ? payments : payments.filter((p) => p.status === filter);

  const chips: Array<{ key: typeof filter; label: string }> = [
    { key: "all", label: `All (${payments.length})` },
    { key: "created", label: `Created (${counts.created ?? 0})` },
    { key: "paid", label: `Paid (${counts.paid ?? 0})` },
    { key: "pending", label: `Pending (${counts.pending ?? 0})` },
    { key: "failed", label: `Failed (${counts.failed ?? 0})` },
    { key: "cancelled", label: `Cancelled (${counts.cancelled ?? 0})` },
  ];

  return (
    <section className="mt-16">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <p className="eyebrow mb-2">Razorpay</p>
          <h2 className="font-serif text-3xl">Payment status</h2>
        </div>
        <button onClick={onRefresh} disabled={refreshing} className="btn-outline-gold px-4 py-2 rounded-full text-xs inline-flex items-center gap-2 disabled:opacity-60">
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total attempts" value={String(payments.length)} />
        <StatCard label="Successful" value={String(counts.paid ?? 0)} />
        <StatCard label="Failed / cancelled" value={String((counts.failed ?? 0) + (counts.cancelled ?? 0))} />
        <StatCard label="Paid revenue" value={`₹${paidTotal.toLocaleString("en-IN")}`} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {chips.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`text-xs px-3 py-1.5 rounded-full hairline border transition ${filter === c.key ? "bg-[color:var(--gold)]/10 text-[color:var(--gold)] border-[color:var(--gold)]/40" : "text-[color:var(--muted-foreground)]"}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="text-left text-xs eyebrow border-b hairline">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Order ID</th>
                <th className="p-3">Payment ID</th>
                <th className="p-3">Ref</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b hairline last:border-0 align-top">
                  <td className="p-3 whitespace-nowrap">
                    {new Date(p.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td className="p-3"><StatusPill status={p.status} /></td>
                  <td className="p-3 whitespace-nowrap">₹{Number(p.amount).toLocaleString("en-IN")}</td>
                  <td className="p-3 font-mono text-[11px] break-all">{p.razorpay_order_id}</td>
                  <td className="p-3 font-mono text-[11px] break-all">{p.razorpay_payment_id ?? "—"}</td>
                  <td className="p-3 text-[color:var(--gold)] text-xs">{p.ref_code ?? "—"}</td>
                  <td className="p-3 text-xs text-[color:var(--muted-foreground)] max-w-[220px]">{p.error_message ?? "—"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-[color:var(--muted-foreground)]">No payments in this view.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
    paid:      { label: "Paid",      cls: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10", Icon: CheckCircle2 },
    created:   { label: "Created",   cls: "text-[color:var(--gold)] border-[color:var(--gold)]/40 bg-[color:var(--gold)]/10", Icon: Clock },
    pending:   { label: "Pending",   cls: "text-amber-400 border-amber-400/40 bg-amber-400/10", Icon: Clock },
    failed:    { label: "Failed",    cls: "text-red-400 border-red-400/40 bg-red-400/10", Icon: XCircle },
    cancelled: { label: "Cancelled", cls: "text-[color:var(--muted-foreground)] border-white/20 bg-white/5", Icon: AlertCircle },
  };
  const v = map[status] ?? { label: status, cls: "text-[color:var(--muted-foreground)] border-white/20 bg-white/5", Icon: AlertCircle };
  const Icon = v.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ${v.cls}`}>
      <Icon className="h-3 w-3" /> {v.label}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <p className="eyebrow text-xs mb-2">{label}</p>
      <p className="font-serif text-3xl text-[color:var(--gold)]">{value}</p>
    </div>
  );
}

function Input({ label, value, onChange, required, type = "text" }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string }) {
  return (
    <div>
      <label className="text-xs eyebrow block mb-2">{label}</label>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent hairline border rounded-full px-4 py-3 text-sm" />
    </div>
  );
}

function PartnerCard({ partner, onToggle }: { partner: Partner; onToggle: () => void }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const url = `${BASE_URL}/?ref=${partner.code}`;

  function download() {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `omora-ref-${partner.code}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-xs">{partner.partner_type}</p>
          <p className="font-serif text-2xl mt-1">{partner.name}</p>
          <p className="text-[color:var(--gold)] text-sm mt-1">{partner.code} · {partner.commission_rate}%</p>
          {partner.contact_phone && <p className="text-xs text-[color:var(--muted-foreground)] mt-1">{partner.contact_phone}</p>}
          {partner.contact_email && <p className="text-xs text-[color:var(--muted-foreground)]">{partner.contact_email}</p>}
        </div>
        <button onClick={onToggle} className={`text-xs px-3 py-1 rounded-full hairline border ${partner.active ? "text-[color:var(--gold)]" : "text-[color:var(--muted-foreground)]"}`}>
          {partner.active ? "Active" : "Inactive"}
        </button>
      </div>
      <div ref={canvasRef} className="mt-5 bg-white p-4 rounded-xl w-fit">
        <QRCodeCanvas value={url} size={160} level="H" includeMargin={false} />
      </div>
      <p className="text-[11px] text-[color:var(--muted-foreground)] mt-3 break-all">{url}</p>
      <button onClick={download} className="btn-outline-gold mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs">
        <Download className="h-3.5 w-3.5" /> Download PNG
      </button>
    </div>
  );
}
