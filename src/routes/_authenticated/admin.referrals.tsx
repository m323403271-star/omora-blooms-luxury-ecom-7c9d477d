import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Plus, LogOut, Save } from "lucide-react";
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
    const [p, o, s] = await Promise.all([
      supabase.from("partners").select("*").order("created_at", { ascending: false }),
      supabase.from("referred_orders").select("id, partner_code, total, commission_amount, status, created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("site_settings").select("default_commission_rate, razorpay_enabled, whatsapp_enabled").eq("id", true).maybeSingle(),
    ]);
    if (p.data) setPartners(p.data as Partner[]);
    if (o.data) setOrders(o.data as ReferredOrder[]);
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
        <div className="flex gap-2">
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
    </div>
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
