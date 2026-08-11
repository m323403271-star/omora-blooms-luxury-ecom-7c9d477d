import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin.coupons")({
  head: () => ({
    meta: [
      { title: "Coupon Manager — OMORA BLOOMS Admin" },
      { name: "description", content: "Create and manage discount coupons for OMORA BLOOMS checkout." },
      { property: "og:title", content: "Coupon Manager — OMORA BLOOMS Admin" },
      { property: "og:description", content: "Create and manage discount coupons for OMORA BLOOMS checkout." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CouponAdmin,
});

type Coupon = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_value: number;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  expires_at: string | null;
};

function CouponAdmin() {
  const [rows, setRows] = useState<Coupon[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "flat">("percent");
  const [value, setValue] = useState("10");
  const [minOrder, setMinOrder] = useState("0");
  const [maxUses, setMaxUses] = useState("");
  const [expires, setExpires] = useState("");

  async function load() {
    const { data, error } = await supabase
      .from("coupons")
      .select("id, code, discount_type, discount_value, min_order_value, max_uses, used_count, active, expires_at")
      .order("created_at", { ascending: false });
    if (error) toast.error("Could not load coupons");
    else setRows((data ?? []) as Coupon[]);
  }

  useEffect(() => { void load(); }, []);

  async function create() {
    if (!code.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("coupons").insert({
      code: code.trim().toUpperCase(),
      discount_type: type,
      discount_value: Number(value) || 0,
      min_order_value: Number(minOrder) || 0,
      max_uses: maxUses.trim() ? Math.max(1, Math.floor(Number(maxUses))) : null,
      expires_at: expires ? new Date(expires).toISOString() : null,
    } as never);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Coupon created");
    setCode(""); setMaxUses(""); setExpires("");
    void load();
  }

  async function toggle(c: Coupon) {
    const { error } = await supabase.from("coupons").update({ active: !c.active }).eq("id", c.id);
    if (error) toast.error(error.message);
    else void load();
  }

  async function remove(c: Coupon) {
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    const { error } = await supabase.from("coupons").delete().eq("id", c.id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); void load(); }
  }

  const input = "w-full bg-[color:var(--noir)] hairline border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)]";

  return (
    <div className="container-luxe py-12">
      <p className="eyebrow mb-3">Admin</p>
      <h1 className="font-serif text-3xl md:text-4xl mb-8">Coupon manager</h1>

      <div className="glass-card rounded-2xl p-5 md:p-6 mb-8">
        <h2 className="font-serif text-xl mb-4">New coupon</h2>
        <div className="grid gap-3 md:grid-cols-6">
          <label className="block md:col-span-2">
            <span className="text-[10px] tracking-widest uppercase text-[color:var(--muted-foreground)]">Code</span>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="LUXE10" className={`${input} mt-1 uppercase tracking-widest`} />
          </label>
          <label className="block">
            <span className="text-[10px] tracking-widest uppercase text-[color:var(--muted-foreground)]">Type</span>
            <select value={type} onChange={(e) => setType(e.target.value as "percent" | "flat")} className={`${input} mt-1`}>
              <option value="percent">Percent %</option>
              <option value="flat">Flat ₹</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] tracking-widest uppercase text-[color:var(--muted-foreground)]">Value</span>
            <input type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} className={`${input} mt-1`} />
          </label>
          <label className="block">
            <span className="text-[10px] tracking-widest uppercase text-[color:var(--muted-foreground)]">Min order ₹</span>
            <input type="number" min={0} value={minOrder} onChange={(e) => setMinOrder(e.target.value)} className={`${input} mt-1`} />
          </label>
          <label className="block">
            <span className="text-[10px] tracking-widest uppercase text-[color:var(--muted-foreground)]">Max uses</span>
            <input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="∞" className={`${input} mt-1`} />
          </label>
          <label className="block md:col-span-2">
            <span className="text-[10px] tracking-widest uppercase text-[color:var(--muted-foreground)]">Expires</span>
            <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className={`${input} mt-1`} />
          </label>
          <div className="md:col-span-4 flex items-end">
            <button onClick={create} disabled={saving || !code.trim()} className="btn-gold px-6 py-2.5 rounded-full text-xs inline-flex items-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Create coupon
            </button>
          </div>
        </div>
      </div>

      {!rows && <p className="text-sm text-[color:var(--muted-foreground)]">Loading…</p>}
      <div className="grid gap-3">
        {rows?.map((c) => (
          <div key={c.id} className="glass-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-[color:var(--gold)]" />
              <span className="tracking-widest text-sm">{c.code}</span>
              <span className="text-xs text-[color:var(--muted-foreground)]">
                {c.discount_type === "percent" ? `${c.discount_value}% off` : `₹${c.discount_value} off`}
                {Number(c.min_order_value) > 0 ? ` · min ₹${c.min_order_value}` : ""}
                {` · used ${c.used_count}${c.max_uses ? `/${c.max_uses}` : ""}`}
                {c.expires_at ? ` · till ${new Date(c.expires_at).toLocaleDateString("en-IN")}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => toggle(c)} className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-widest ${c.active ? "border-emerald-500/40 text-emerald-400" : "border-neutral-500/40 text-neutral-400"}`}>
                {c.active ? "Active" : "Paused"}
              </button>
              <button onClick={() => remove(c)} className="text-red-400 hover:text-red-300" aria-label={`Delete ${c.code}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
