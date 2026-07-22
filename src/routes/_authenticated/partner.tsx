import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Partner = { id: string; code: string; name: string; commission_rate: number; partner_type: string; active: boolean };
type Order = { id: string; total: number; commission_amount: number; status: string; created_at: string };

const BASE_URL = "https://omorablooms.com";

export const Route = createFileRoute("/_authenticated/partner")({
  head: () => ({ meta: [{ title: "Partner Dashboard — OMORA BLOOMS" }, { name: "robots", content: "noindex" }] }),
  component: PartnerDashboard,
});

function PartnerDashboard() {
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return navigate({ to: "/auth" });
      const { data: p } = await supabase.from("partners").select("*").eq("user_id", u.user.id).maybeSingle();
      if (!p) {
        toast.error("No partner account linked to this user. Contact OMORA BLOOMS.");
        setLoading(false);
        return;
      }
      setPartner(p as Partner);
      const { data: o } = await supabase.from("referred_orders").select("id, total, commission_amount, status, created_at").eq("partner_id", p.id).order("created_at", { ascending: false });
      if (o) setOrders(o as Order[]);
      setLoading(false);
    })();
  }, [navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (loading) return <div className="container-luxe py-24 text-center text-sm text-[color:var(--muted-foreground)]">Loading…</div>;

  if (!partner) {
    return (
      <div className="container-luxe py-24 max-w-lg text-center">
        <h1 className="font-serif text-3xl mb-3">No partner profile</h1>
        <p className="text-sm text-[color:var(--muted-foreground)] mb-6">This account isn't linked to a partner yet. Please contact the OMORA BLOOMS team.</p>
        <button onClick={signOut} className="btn-outline-gold px-5 py-2.5 rounded-full text-sm">Sign out</button>
      </div>
    );
  }

  const totalEarnings = orders.reduce((s, o) => s + Number(o.commission_amount || 0), 0);
  const paid = orders.filter((o) => o.status === "paid").reduce((s, o) => s + Number(o.commission_amount || 0), 0);
  const pending = totalEarnings - paid;
  const url = `${BASE_URL}/?ref=${partner.code}`;

  return (
    <div className="container-luxe py-16 md:py-20">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-10">
        <div>
          <p className="eyebrow mb-3">Partner Dashboard</p>
          <h1 className="font-serif text-4xl md:text-5xl">{partner.name}</h1>
          <p className="text-[color:var(--gold)] mt-2">{partner.code} · {partner.commission_rate}% commission</p>
        </div>
        <button onClick={signOut} className="btn-outline-gold px-4 py-2.5 rounded-full text-sm inline-flex items-center gap-2">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <Stat label="Total earnings" value={`₹${totalEarnings.toLocaleString("en-IN")}`} />
        <Stat label="Paid out" value={`₹${paid.toLocaleString("en-IN")}`} />
        <Stat label="Pending" value={`₹${pending.toLocaleString("en-IN")}`} />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass-card rounded-2xl p-6">
          <p className="eyebrow mb-3">Your QR Code</p>
          <div className="bg-white p-5 rounded-xl w-fit">
            <QRCodeCanvas value={url} size={200} level="H" />
          </div>
          <p className="text-[11px] text-[color:var(--muted-foreground)] mt-3 break-all">{url}</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <p className="eyebrow mb-4">Recent orders</p>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between text-sm border-b hairline pb-3 last:border-0">
                <div>
                  <p>{new Date(o.created_at).toLocaleDateString()}</p>
                  <p className="text-xs text-[color:var(--muted-foreground)] capitalize">{o.status}</p>
                </div>
                <div className="text-right">
                  <p>₹{Number(o.total).toLocaleString("en-IN")}</p>
                  <p className="text-[color:var(--gold)] text-xs">+ ₹{Number(o.commission_amount).toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
            {orders.length === 0 && <p className="text-sm text-[color:var(--muted-foreground)]">No orders yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <p className="eyebrow text-xs mb-2">{label}</p>
      <p className="font-serif text-3xl text-[color:var(--gold)]">{value}</p>
    </div>
  );
}
