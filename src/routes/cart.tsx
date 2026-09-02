import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CreditCard, MessageCircle, Minus, Plus, Trash2, MapPin, ShieldAlert, Plane, StickyNote, PhoneCall, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { saveCartAndCall } from "@/lib/bland.functions";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/products";
import { whatsappLink } from "@/lib/whatsapp";
import { getStoredRef } from "@/lib/referral";
import { supabase } from "@/integrations/supabase/client";
import { startRazorpayCheckout } from "@/lib/razorpay";
import {
  PICKUP_POINTS,
  getSelectedPickup,
  setSelectedPickup,
  savePickupForOrder,
  findPickup,
  isTalukPincode,
  pickupPointsForPincode,
} from "@/lib/pickup";
import { DeliveryEtaChecker } from "@/components/site/DeliveryEtaChecker";
import {  getStoredPincode , isAirportPincode as isAirportPincodeFn } from "@/lib/delivery";
import { formatGiftForWhatsApp } from "@/lib/gifting";
import { toast } from "sonner";
import { CraftNote } from "@/components/site/CraftNote";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Bag — OMORA BLOOMS" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, total, setQuantity, remove, clear } = useCart();
  const [paying, setPaying] = useState(false);
  const [pickup, setPickup] = useState<string>(() => getSelectedPickup() ?? "");
  const [pincode, setPincode] = useState<string | null>(() => getStoredPincode());
  const [airportOverride, setAirportOverride] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [savingCall, setSavingCall] = useState(false);
  const saveCartCall = useServerFn(saveCartAndCall);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string | null;
      setPincode(detail ?? null);
    };
    window.addEventListener("omora:pincode-changed", handler as EventListener);
    return () => window.removeEventListener("omora:pincode-changed", handler as EventListener);
  }, []);

  const isAirport = isAirportPincodeFn(pincode);
  const showPickup = isAirport || airportOverride || isTalukPincode(pincode);
  const pickupRequired = isAirport || airportOverride;
  const pickupOptions = showPickup
    ? (pickupPointsForPincode(pincode) .length > 0 ? pickupPointsForPincode(pincode) : PICKUP_POINTS)
    : [];

  // Payment may only start once every mandatory detail is present.
  const missing: string[] = [];
  if (fullName.trim().length < 2) missing.push("Full name");
  if (mobile.replace(/\D/g, "").length < 10) missing.push("Mobile number");
  if (!pincode || !/^[1-9]\d{5}$/.test(pincode)) missing.push("Delivery pincode");
  if (pickupRequired && !pickup) missing.push("Pickup location");
  if (!pickupRequired && address.trim().length < 8) missing.push("Full address");
  const canPay = missing.length === 0;

  const ref = typeof window !== "undefined" ? getStoredRef() : null;
  const refLine = ref ? `\n\nReferral code: ${ref}` : "";
  const pickupObj = findPickup(pickup);
  const pickupLine = showPickup && pickupObj ? `\n\nAirport Pickup Point: ${pickupObj.label} (${pickupObj.detail})` : "";

  const message = items.length === 0
    ? ""
    : `Hello OMORA BLOOMS! I'd like to order:\n\n${items.map((i) => {
        const line = `• ${i.name} × ${i.quantity} — ${formatPrice(i.price * i.quantity)}`;
        const extras = formatGiftForWhatsApp(i.gift, i.bouquet).replace(/^\n\n/, "\n").replace(/\n/g, "\n  ");
        return line + extras;
      }).join("\n")}\n\nTotal: ${formatPrice(total)}${pickupLine}${refLine}\n\nPlease confirm.`;

  function updatePickup(id: string) {
    setPickup(id);
    if (id) setSelectedPickup(id);
  }

  async function handleSaveToCart() {
    if (items.length === 0) return;
    if (fullName.trim().length < 2 || mobile.replace(/\D/g, "").length < 10) {
      toast.error("Please add your full name and mobile number first.");
      return;
    }
    setSavingCall(true);
    try {
      const itemsSummary = items
        .map((i) => `${i.name} × ${i.quantity}`)
        .join(", ")
        .slice(0, 1500);
      const res = await saveCartCall({
        data: { name: fullName.trim(), phone: mobile.trim(), items: itemsSummary },
      });
      if (res?.ok) {
        toast.success("Cart saved — our concierge will call you shortly.", {
          description: "Personal assistance in Kannada, English or Hindi.",
        });
      } else {
        toast.error(res?.error ?? "Could not reach our concierge line right now.");
      }
    } catch {
      toast.error("Could not reach our concierge line right now.");
    } finally {
      setSavingCall(false);
    }
  }


  function handleCheckout(e: React.MouseEvent<HTMLAnchorElement>) {
    if (items.length === 0) return;
    if (pickupRequired && !pickup) {
      e.preventDefault();
      toast.error("Please select an airport pickup point to continue.");
      return;
    }
    // Referral attribution for WhatsApp orders is reconciled server-side
    // after admin confirmation; never logged directly from the client.
  }

  async function startPay() {
    if (!canPay) { toast.error(`Please complete: ${missing.join(", ")}`); return; }
    setPaying(true);
    try {
      const { getCustomerTier } = await import("@/lib/delivery");
      await startRazorpayCheckout(items, (orderId) => {
        if (showPickup && pickup) savePickupForOrder(orderId, pickup);
        clear();
        navigate({ to: "/order/$orderId", params: { orderId } });
      }, {
        pincode: pincode,
        customerTier: getCustomerTier(),
        pickupPointId: showPickup ? pickup || null : null,
        customerName: fullName.trim(),
        customerPhone: mobile.replace(/\D/g, ""),
        deliveryNotes:
          [address.trim() ? `Address: ${address.trim()}` : "", deliveryNotes.trim()]
            .filter(Boolean)
            .join(" | ")
            .slice(0, 300) || null,
      });
    } finally {
      setPaying(false);
    }
  }


  return (
    <div className="w-full max-w-full overflow-x-hidden container-luxe px-3 py-4 md:py-24 pb-28 lg:pb-24">
      <p className="eyebrow mb-1 md:mb-3">Your Bag</p>
      <h1 className="font-serif text-2xl md:text-5xl mb-3 md:mb-10">Checkout</h1>

      {items.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-3xl">
          <p className="font-serif text-3xl">Your bag is empty</p>
          <p className="text-[color:var(--muted-foreground)] mt-2">Start with our bestselling collections.</p>
          <Link to="/shop" className="btn-gold mt-6 inline-block px-8 py-3 rounded-full text-sm">Shop now</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4 md:gap-10">
          <div className="lg:col-span-2 space-y-2 md:space-y-4">
            {items.map((i) => (
              <div key={i.id} className="flex gap-3 md:gap-5 p-2.5 md:p-4 hairline border rounded-2xl">
                <img src={i.image} alt={i.name} className="h-24 w-20 md:h-28 md:w-24 object-cover rounded-lg shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-base md:text-xl">{i.name}</p>
                  <p className="text-[color:var(--gold)] mt-1">{formatPrice(i.price)}</p>
                  {(i.gift || i.bouquet) && (
                    <div className="mt-2 rounded-lg border hairline bg-[color:var(--noir)]/60 px-3 py-2 text-[11px] space-y-0.5">
                      {i.gift && (
                        <>
                          <p className="text-[color:var(--gold)]">🎁 Gift · {i.gift.cardLabel}</p>
                          {i.gift.message && <p className="text-[color:var(--muted-foreground)] italic">"{i.gift.message}"</p>}
                        </>
                      )}
                      {i.bouquet && (
                        <p className="text-[color:var(--muted-foreground)]">
                          💐 Custom: {i.bouquet.flowers.filter((f) => f.qty > 0).map((f) => `${f.label}×${f.qty}`).join(", ") || "—"}
                          {i.bouquet.wrapping ? ` · ${i.bouquet.wrapping.label}` : ""}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-2 md:gap-4">
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
          <aside className="glass-card rounded-2xl p-3 md:p-6 h-fit lg:sticky lg:top-28">
            <p className="eyebrow mb-2 md:mb-4">Order Summary</p>

            {/* Airport pickup toggle for non-airport pincodes */}
            {!isAirport && (
              <label className="mb-3 flex items-center gap-2 text-xs text-[color:var(--muted-foreground)] cursor-pointer select-none">
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

            {/* Airport pickup */}
            {showPickup && (
              <div className="mb-3 rounded-xl border hairline p-3">
                <label className="flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-[color:var(--gold)]">
                  <MapPin className="h-3.5 w-3.5" /> Airport Pickup Point <span className="text-[color:var(--destructive)]">*</span>
                </label>
                <select
                  required
                  value={pickup}
                  onChange={(e) => updatePickup(e.target.value)}
                  className="mt-2 w-full bg-[color:var(--noir)] border hairline rounded-lg px-3 py-2.5 text-sm text-[color:var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)]"
                >
                  <option value="">Select a pickup point…</option>
                  {pickupOptions.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                {pickupObj && (
                  <p className="mt-2 text-[11px] text-[color:var(--muted-foreground)]">{pickupObj.detail}</p>
                )}
                <p className="mt-3 flex items-start gap-2 text-[11px] text-[color:var(--muted-foreground)]">
                  <ShieldAlert className="h-3.5 w-3.5 mt-0.5 text-[color:var(--gold)] flex-shrink-0" />
                  <span><strong className="text-[color:var(--foreground)]">Note:</strong> Security rules restrict delivery executives from entering gate check-in areas. Please meet our delivery agent at your chosen Pickup Point.</span>
                </p>
                <p className="mt-2 text-[11px] text-[color:var(--gold)]">⚡ Express 30–45 minute delivery window.</p>
              </div>
            )}

            <div className="mb-5 space-y-3">
              <p className="text-[11px] tracking-[0.18em] uppercase text-[color:var(--gold)]">
                Delivery Details <span className="text-[color:var(--destructive)]">*</span>
              </p>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                maxLength={120}
                autoComplete="name"
                aria-label="Full name"
                className="w-full bg-[color:var(--noir)] hairline border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)]"
              />
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/[^\d+ ]/g, "").slice(0, 15))}
                placeholder="Mobile number"
                inputMode="tel"
                autoComplete="tel"
                aria-label="Mobile number"
                className="w-full bg-[color:var(--noir)] hairline border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)]"
              />
              {!pickupRequired && (
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full delivery address (house/flat, street, area, landmark)"
                  rows={3}
                  maxLength={400}
                  aria-label="Full delivery address"
                  className="w-full bg-[color:var(--noir)] hairline border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)]"
                />
              )}
            </div>

            <div className="mb-3">
              <label className="flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase text-[color:var(--gold)] mb-1.5">
                <StickyNote className="h-3.5 w-3.5" />
                Delivery Notes / Instructions
              </label>
              <textarea
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Gate number, villa number, or flight details — anything that helps our delivery executive find you easily"
                rows={2}
                maxLength={300}
                className="w-full bg-[color:var(--noir)] hairline border rounded-xl px-4 py-3 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)]/60 focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)] transition resize-none"
              />
            </div>

            <div className="mb-3">
              <DeliveryEtaChecker variant="checkout" title="Delivery SLA" locked />
            </div>

            <div className="mb-3">
              <button
                type="button"
                disabled={savingCall || items.length === 0}
                onClick={handleSaveToCart}
                className="btn-outline-gold w-full inline-flex items-center justify-center gap-2 py-3 rounded-full text-sm disabled:opacity-60"
              >
                {savingCall
                  ? <><Loader2 className="h-4 w-4 shrink-0 animate-spin" /> Connecting concierge…</>
                  : <><PhoneCall className="h-4 w-4 shrink-0" /> Save to Cart & Get a Call</>}
              </button>
              <p className="mt-1.5 text-[11px] text-[color:var(--muted-foreground)] text-center">
                Our concierge calls you in Kannada, English or Hindi to finish your order.
              </p>
            </div>



            <div className="space-y-1.5 md:space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[color:var(--muted-foreground)]">Subtotal</span><span>{formatPrice(total)}</span></div>
              <div className="flex justify-between"><span className="text-[color:var(--muted-foreground)]">Shipping</span><span className="text-[color:var(--gold)]">Calculated at checkout</span></div>
              <div className="border-t hairline pt-3 flex justify-between font-serif text-xl">
                <span>Total</span><span className="text-[color:var(--gold)]">{formatPrice(total)}</span>
              </div>
            </div>
            {ref && <p className="mt-2 text-xs text-[color:var(--gold)]">Referral applied: {ref}</p>}
            <div className="mt-3 hidden sm:flex flex-row w-full gap-2">
              <button
                disabled={paying || items.length === 0 || !canPay}
                onClick={startPay}
                className="btn-gold flex-1 min-w-0 inline-flex items-center justify-center gap-2 py-3 rounded-full text-sm disabled:opacity-60"
              >
                <CreditCard className="h-4 w-4 shrink-0" /> {paying ? "Starting…" : "Proceed to Pay"}
              </button>
              <a href={whatsappLink(message)} onClick={handleCheckout} target="_blank" rel="noopener noreferrer" className="btn-outline-gold flex-1 min-w-0 inline-flex items-center justify-center gap-2 py-3 rounded-full text-sm">
                <MessageCircle className="h-4 w-4 shrink-0" /> WhatsApp
              </a>
            </div>
            {!canPay && items.length > 0 && (
              <p className="mt-2 text-center text-[11px] text-[color:var(--muted-foreground)]">
                Complete to pay: {missing.join(", ")}
              </p>
            )}

            <CraftNote className="mt-2" align="center" />
            <p className="mt-2 text-[11px] text-[color:var(--muted-foreground)] text-center">UPI, cards & net banking. Or confirm with our concierge on WhatsApp.</p>
          </aside>

          {/* Mobile sticky total + CTAs */}
          <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-background border-t sm:hidden w-full max-w-full">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-[color:var(--muted-foreground)]">Total</span>
              <span className="font-serif text-lg text-[color:var(--gold)]">{formatPrice(total)}</span>
            </div>
            <div className="flex flex-row w-full gap-2">
              <button
                disabled={paying || items.length === 0 || !canPay}
                onClick={startPay}
                className="btn-gold flex-1 min-w-0 inline-flex items-center justify-center gap-2 py-3 rounded-full text-sm disabled:opacity-60"
              >
                <CreditCard className="h-4 w-4 shrink-0" /> {paying ? "Starting…" : "Pay Now"}
              </button>
              <a href={whatsappLink(message)} onClick={handleCheckout} target="_blank" rel="noopener noreferrer" className="btn-outline-gold flex-1 min-w-0 inline-flex items-center justify-center gap-2 py-3 rounded-full text-sm">
                <MessageCircle className="h-4 w-4 shrink-0" /> WhatsApp
              </a>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
