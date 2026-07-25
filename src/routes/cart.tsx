import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CreditCard, MessageCircle, Minus, Plus, Trash2, MapPin, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/products";
import { whatsappLink } from "@/lib/whatsapp";
import { getStoredRef } from "@/lib/referral";
import { supabase } from "@/integrations/supabase/client";
import { startRazorpayCheckout } from "@/lib/razorpay";
import { PICKUP_POINTS, getSelectedPickup, setSelectedPickup, savePickupForOrder, findPickup } from "@/lib/pickup";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Bag — OMORA BLOOMS" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, total, setQuantity, remove, clear } = useCart();
  const [paying, setPaying] = useState(false);
  const [pickup, setPickup] = useState<string>(() => getSelectedPickup() ?? "");
  const navigate = useNavigate();
  const ref = typeof window !== "undefined" ? getStoredRef() : null;
  const refLine = ref ? `\n\nReferral code: ${ref}` : "";
  const pickupObj = findPickup(pickup);
  const pickupLine = pickupObj ? `\n\nAirport Pickup Point: ${pickupObj.label} (${pickupObj.detail})` : "";

  const message = items.length === 0
    ? ""
    : `Hello OMORA BLOOMS! I'd like to order:\n\n${items.map((i) => `• ${i.name} × ${i.quantity} — ${formatPrice(i.price * i.quantity)}`).join("\n")}\n\nTotal: ${formatPrice(total)}${pickupLine}${refLine}\n\nPlease confirm.`;

  function updatePickup(id: string) {
    setPickup(id);
    if (id) setSelectedPickup(id);
  }

  async function handleCheckout(e: React.MouseEvent<HTMLAnchorElement>) {
    if (items.length === 0) return;
    if (!pickup) {
      e.preventDefault();
      toast.error("Please select an airport pickup point to continue.");
      return;
    }
    if (ref) {
      e.preventDefault();
      try {
        await supabase.rpc("log_referred_order", {
          _partner_code: ref,
          _items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
        });
      } catch {
        // ignore logging errors
      }
      window.open(whatsappLink(message), "_blank", "noopener,noreferrer");
    }
  }


  return (
    <div className="container-luxe py-16 md:py-24">
      <p className="eyebrow mb-3">Your Bag</p>
      <h1 className="font-serif text-4xl md:text-5xl mb-10">Checkout</h1>

      {items.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-3xl">
          <p className="font-serif text-3xl">Your bag is empty</p>
          <p className="text-[color:var(--muted-foreground)] mt-2">Start with our bestselling collections.</p>
          <Link to="/shop" className="btn-gold mt-6 inline-block px-8 py-3 rounded-full text-sm">Shop now</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-4">
            {items.map((i) => (
              <div key={i.id} className="flex gap-5 p-4 hairline border rounded-2xl">
                <img src={i.image} alt={i.name} className="h-28 w-24 object-cover rounded-lg" />
                <div className="flex-1">
                  <p className="font-serif text-xl">{i.name}</p>
                  <p className="text-[color:var(--gold)] mt-1">{formatPrice(i.price)}</p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center hairline border rounded-full">
                      <button className="p-2" onClick={() => setQuantity(i.id, i.quantity - 1)} aria-label="Decrease"><Minus className="h-3 w-3" /></button>
                      <span className="px-3 text-sm">{i.quantity}</span>
                      <button className="p-2" onClick={() => setQuantity(i.id, i.quantity + 1)} aria-label="Increase"><Plus className="h-3 w-3" /></button>
                    </div>
                    <button onClick={() => remove(i.id)} className="inline-flex items-center gap-1 text-xs text-[color:var(--muted-foreground)] hover:text-[color:var(--destructive)]">
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[color:var(--gold)] font-medium">{formatPrice(i.price * i.quantity)}</p>
                </div>
              </div>
            ))}
          </div>
          <aside className="glass-card rounded-2xl p-6 h-fit sticky top-28">
            <p className="eyebrow mb-4">Order Summary</p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[color:var(--muted-foreground)]">Subtotal</span><span>{formatPrice(total)}</span></div>
              <div className="flex justify-between"><span className="text-[color:var(--muted-foreground)]">Shipping</span><span className="text-[color:var(--gold)]">Calculated at checkout</span></div>
              <div className="border-t hairline pt-3 flex justify-between font-serif text-xl">
                <span>Total</span><span className="text-[color:var(--gold)]">{formatPrice(total)}</span>
              </div>
            </div>
            {ref && <p className="mt-3 text-xs text-[color:var(--gold)]">Referral applied: {ref}</p>}
            <button
              disabled={paying || items.length === 0}
              onClick={async () => {
                setPaying(true);
                try {
                  await startRazorpayCheckout(items, (orderId) => {
                    clear();
                    navigate({ to: "/order/$orderId", params: { orderId } });
                  });
                } finally {
                  setPaying(false);
                }
              }}
              className="btn-gold mt-6 w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full text-sm disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" /> {paying ? "Starting…" : "Pay with Razorpay"}
            </button>
            <a href={whatsappLink(message)} onClick={handleCheckout} target="_blank" rel="noopener noreferrer" className="btn-outline-gold mt-3 w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full text-sm">
              <MessageCircle className="h-4 w-4" /> Order via WhatsApp
            </a>
            <p className="mt-3 text-[11px] text-[color:var(--muted-foreground)] text-center">UPI, cards & net banking. Or confirm with our concierge on WhatsApp.</p>
          </aside>
        </div>
      )}
    </div>
  );
}
