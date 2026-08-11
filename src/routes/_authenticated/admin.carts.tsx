import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MessageCircle, CheckCircle2, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/admin.carts")({
  head: () => ({
    meta: [
      { title: "Abandoned Carts — OMORA BLOOMS Admin" },
      { name: "description", content: "Follow up on incomplete OMORA BLOOMS checkouts with a one-tap WhatsApp nudge." },
      { property: "og:title", content: "Abandoned Carts — OMORA BLOOMS Admin" },
      { property: "og:description", content: "Recover incomplete checkouts with a WhatsApp nudge." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CartsAdmin,
});

type Cart = {
  id: string;
  customer_phone: string;
  customer_name: string | null;
  items: Array<{ name?: string; image?: string | null; price?: number }> | null;
  total: number;
  recovered: boolean;
  created_at: string;
};

function CartsAdmin() {
  const [rows, setRows] = useState<Cart[] | null>(null);

  async function load() {
    const { data, error } = await supabase
      .from("abandoned_carts")
      .select("id, customer_phone, customer_name, items, total, recovered, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) toast.error("Could not load carts");
    else setRows((data ?? []) as Cart[]);
  }

  useEffect(() => { void load(); }, []);

  async function markRecovered(c: Cart) {
    const { error } = await supabase.from("abandoned_carts").update({ recovered: true }).eq("id", c.id);
    if (error) toast.error(error.message);
    else void load();
  }

  function nudge(c: Cart) {
    const item = c.items?.[0]?.name ?? "your bouquet";
    const text = encodeURIComponent(
      `Hello ${c.customer_name ?? "there"} 🌸\n\nThis is OMORA BLOOMS. We noticed you were choosing ${item} but didn't finish checkout. Would you like us to reserve it for you?`,
    );
    window.open(`https://wa.me/${c.customer_phone.replace(/\D/g, "")}?text=${text}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="container-luxe py-12">
      <p className="eyebrow mb-3">Admin</p>
      <h1 className="font-serif text-3xl md:text-4xl mb-8">Abandoned carts</h1>

      {!rows && <p className="text-sm text-[color:var(--muted-foreground)]">Loading…</p>}
      {rows && rows.length === 0 && (
        <p className="text-sm text-[color:var(--muted-foreground)]">No incomplete checkouts right now.</p>
      )}

      <div className="grid gap-3">
        {rows?.map((c) => (
          <div key={c.id} className={`glass-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 ${c.recovered ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-3">
              {c.items?.[0]?.image ? (
                <img src={c.items[0].image!} alt={c.items[0].name ?? "Cart item"} loading="lazy" className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <ShoppingBag className="h-5 w-5 text-[color:var(--gold)]" />
              )}
              <div>
                <p className="text-sm">{c.customer_name ?? "Guest"} · {c.customer_phone}</p>
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  {c.items?.[0]?.name ?? "—"} · {formatPrice(Number(c.total))} · {new Date(c.created_at).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => nudge(c)} className="btn-outline-gold rounded-full px-4 py-2 text-[10px] uppercase tracking-widest inline-flex items-center gap-2">
                <MessageCircle className="h-3.5 w-3.5" /> Nudge
              </button>
              {!c.recovered && (
                <button onClick={() => markRecovered(c)} className="rounded-full border border-emerald-500/40 text-emerald-400 px-4 py-2 text-[10px] uppercase tracking-widest inline-flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Recovered
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
