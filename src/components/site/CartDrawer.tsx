import { Link, useNavigate } from "@tanstack/react-router";
import { X, Minus, Plus, MessageCircle, CreditCard, MapPin, ShieldAlert, Plane } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/products";
import { whatsappLink } from "@/lib/whatsapp";
import { getStoredRef } from "@/lib/referral";
import { supabase } from "@/integrations/supabase/client";
import { startRazorpayCheckout } from "@/lib/razorpay";
import { PICKUP_POINTS, getSelectedPickup, setSelectedPickup, savePickupForOrder, findPickup } from "@/lib/pickup";
import { EXPRESS_PINCODES, getStoredPincode } from "@/lib/delivery";

export function CartDrawer() {
  const { items, isOpen, close, remove, setQuantity, total, count, clear } = useCart();
  const [paying, setPaying] = useState(false);
  const [pickup, setPickup] = useState<string>(() => getSelectedPickup() ?? "");
  const [pincode, setPincode] = useState<string | null>(() => getStoredPincode());
  const [airportOverride, setAirportOverride] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string | null;
      setPincode(detail ?? null);
    };
    window.addEventListener("omora:pincode-changed", handler as EventListener);
    return () => window.removeEventListener("omora:pincode-changed", handler as EventListener);
  }, []);

  if (!isOpen) return null;

  const isAirportPincode = !!(pincode && EXPRESS_PINCODES[pincode]);
  const showPickup = isAirportPincode || airportOverride;
  const pickupRequired = showPickup;

  const ref = getStoredRef();
  const refLine = ref ? `\n\nReferral code: ${ref}` : "";
  const pickupObj = findPickup(pickup);
  const pickupLine = showPickup && pickupObj ? `\n\nAirport Pickup Point: ${pickupObj.label} (${pickupObj.detail})` : "";
  const message = `Hello OMORA BLOOMS! I'd like to order:\n\n${items
    .map((i) => `• ${i.name} × ${i.quantity} — ${formatPrice(i.price * i.quantity)}`)
    .join("\n")}\n\nTotal: ${formatPrice(total)}${pickupLine}${refLine}\n\nPlease confirm.`;

  function updatePickup(id: string) {
    setPickup(id);
    if (id) setSelectedPickup(id);
  }

  async function handleCheckout(e: React.MouseEvent<HTMLAnchorElement>) {
    if (items.length === 0) return;
    if (pickupRequired && !pickup) {
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
        // don't block checkout on logging errors
      }
      window.open(whatsappLink(message), "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
      <aside className="absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-[color:var(--noir)] border-l hairline flex flex-col animate-slide-in-right shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b hairline">
          <div>
            <p className="eyebrow">Your Bag</p>
            <h2 className="font-serif text-2xl">{count} {count === 1 ? "item" : "items"}</h2>
          </div>
          <button onClick={close} className="p-2 text-[color:var(--gold)]" aria-label="Close cart"><X className="h-5 w-5" /></button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 grid place-items-center px-6 text-center">
            <div>
              <p className="font-serif text-3xl mb-3">Your bag is empty</p>
              <p className="text-sm text-[color:var(--muted-foreground)] mb-6">Discover our handmade luxury collections.</p>
              <Link to="/shop" onClick={close} className="btn-gold inline-block px-6 py-3 rounded-full text-sm">Shop the collection</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.map((i) => (
                <div key={i.id} className="flex gap-4 pb-4 border-b hairline">
                  <img src={i.image} alt={i.name} width={80} height={100} className="h-24 w-20 object-cover rounded-md hairline border" />
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-base truncate">{i.name}</p>
                    <p className="text-[color:var(--gold)] text-sm mt-1">{formatPrice(i.price)}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center hairline border rounded-full">
                        <button onClick={() => setQuantity(i.id, i.quantity - 1)} className="p-1.5" aria-label="Decrease"><Minus className="h-3 w-3" /></button>
                        <span className="text-sm px-2 min-w-6 text-center">{i.quantity}</span>
                        <button onClick={() => setQuantity(i.id, i.quantity + 1)} className="p-1.5" aria-label="Increase"><Plus className="h-3 w-3" /></button>
                      </div>
                      <button onClick={() => remove(i.id)} className="text-xs text-[color:var(--muted-foreground)] hover:text-[color:var(--destructive)]">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t hairline px-6 py-5 space-y-4">
              {/* Airport pickup toggle for non-airport pincodes */}
              {!isAirportPincode && (
                <label className="flex items-center gap-2 text-[11px] text-[color:var(--muted-foreground)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={airportOverride}
                    onChange={(e) => {
                      setAirportOverride(e.target.checked);
                      if (!e.target.checked) setPickup("");
                    }}
                    className="accent-[color:var(--gold)]"
                  />
                  <Plane className="h-3.5 w-3.5 text-[color:var(--gold)]" />
                  <span>Deliver at Bengaluru Airport (BLR) instead</span>
                </label>
              )}

              {showPickup && (
                <div className="rounded-xl border hairline p-3">
                  <label className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[color:var(--gold)]">
                    <MapPin className="h-3.5 w-3.5" /> Airport Pickup <span className="text-[color:var(--destructive)]">*</span>
                  </label>
                  <select
                    required
                    value={pickup}
                    onChange={(e) => updatePickup(e.target.value)}
                    className="mt-2 w-full bg-[color:var(--noir)] border hairline rounded-lg px-2.5 py-2 text-xs text-[color:var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)]"
                  >
                    <option value="">Select a pickup point…</option>
                    {PICKUP_POINTS.map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                  <p className="mt-2 flex items-start gap-1.5 text-[10px] text-[color:var(--muted-foreground)] leading-relaxed">
                    <ShieldAlert className="h-3 w-3 mt-0.5 text-[color:var(--gold)] flex-shrink-0" />
                    <span>Security rules restrict entry to gate check-in areas. Meet our agent at your chosen Pickup Point.</span>
                  </p>
                  <p className="mt-1 text-[10px] text-[color:var(--gold)]">⚡ Express 20–30 min delivery window.</p>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-[color:var(--muted-foreground)]">Subtotal</span>
                <span className="text-[color:var(--gold)] font-medium">{formatPrice(total)}</span>
              </div>
              {ref && (
                <p className="text-[11px] text-[color:var(--gold)]">Referral applied: {ref}</p>
              )}
              <p className="text-xs text-[color:var(--muted-foreground)]">Shipping & taxes calculated at checkout. Complimentary luxury packaging included.</p>
              <button
                disabled={paying}
                onClick={async () => {
                  if (pickupRequired && !pickup) { toast.error("Please select an airport pickup point to continue."); return; }
                  setPaying(true);
                  try {
                    await startRazorpayCheckout(items, (orderId) => {
                      if (showPickup && pickup) savePickupForOrder(orderId, pickup);
                      clear();
                      close();
                      navigate({ to: "/order/$orderId", params: { orderId } });
                    });
                  } finally {
                    setPaying(false);
                  }
                }}
                className="btn-gold w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold disabled:opacity-60"
              >
                <CreditCard className="h-4 w-4" /> {paying ? "Starting…" : "Pay with Razorpay"}
              </button>

              <a
                href={whatsappLink(message)}
                onClick={handleCheckout}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline-gold w-full inline-flex items-center justify-center gap-2 py-3 rounded-full text-sm"
              >
                <MessageCircle className="h-4 w-4" /> Order via WhatsApp
              </a>
              <Link to="/cart" onClick={close} className="btn-outline-gold w-full inline-flex items-center justify-center py-3 rounded-full text-sm">
                View bag
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
