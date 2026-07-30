import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ChevronRight, CreditCard, MessageCircle, ShieldCheck,
  Truck, Sparkles, MapPin, User, Phone, Home, CheckCircle, Bell,
} from "lucide-react";
import { productsQuery, formatPrice } from "@/lib/products";
import { getVariantBySlug, getAllVariants, type ProductVariant } from "@/lib/variants";
import { DeliveryEtaChecker } from "@/components/site/DeliveryEtaChecker";
import { whatsappLink } from "@/lib/whatsapp";
import { toast } from "sonner";
import { NotifyMeModal } from "@/components/site/NotifyMeModal";
import { COMING_SOON } from "@/lib/launch-config";

export const Route = createFileRoute("/buy/$variant")({
  head: ({ params }) => {
    const variant = getVariantBySlug(params.variant);
    const title = variant?.name ?? "Checkout";
    return {
      meta: [
        { title: `${title} — OMORA BLOOMS` },
        {
          name: "description",
          content: `Order ${title} — luxury handmade bouquet with same-day delivery in Bengaluru.`,
        },
      ],
    };
  },
  loader: ({ context, params }) => {
    getAllVariants();
    return context.queryClient.ensureQueryData(productsQuery);
  },
  component: BuyPage,
});

// ─── Razorpay types ───────────────────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => {
      open: () => void;
      on: (e: string, cb: (r: unknown) => void) => void;
    };
  }
}

async function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (window.Razorpay) return true;
  const src = "https://checkout.razorpay.com/v1/checkout.js";
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
  if (existing)
    return new Promise((res) => {
      existing.onload = () => res(true);
      existing.onerror = () => res(false);
    });
  return new Promise((res) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => res(true);
    s.onerror = () => res(false);
    document.body.appendChild(s);
  });
}

// ─── Inline field component ───────────────────────────────────────────────────
function Field({
  label, icon: Icon, value, onChange, type = "text", placeholder, required, disabled,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase text-[color:var(--gold)] mb-1.5">
        <Icon className="h-3.5 w-3.5" />
        {label}
        {required && <span className="text-[color:var(--destructive)]">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full bg-[color:var(--noir)] hairline border rounded-xl px-4 py-3 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)]/60 focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)] transition disabled:opacity-40 disabled:cursor-not-allowed"
      />
    </div>
  );
}

// ─── Page component ───────────────────────────────────────────────────────────
function BuyPage() {
  const { variant: variantSlug } = Route.useParams();
  const { data: products } = useSuspenseQuery(productsQuery);
  const navigate = useNavigate();

  const allVariants = getAllVariants();
  const variant: ProductVariant | undefined =
    getVariantBySlug(variantSlug) ?? allVariants.find((v) => v.slug === variantSlug);

  if (!variant) throw notFound();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);

  const isFormValid =
    name.trim() &&
    phone.trim().length >= 10 &&
    address.trim() &&
    city.trim() &&
    pincode.trim().length === 6;

  const waMessage =
    `Hello OMORA BLOOMS! I'd like to order:\n\n` +
    `• ${variant.name} — ${formatPrice(variant.price)}\n` +
    `\nShipping Details:\n` +
    `Name: ${name || "—"}\nPhone: ${phone || "—"}\nAddress: ${address || "—"}, ${city || "—"} — ${pincode || "—"}` +
    `\n\nPlease confirm availability & delivery time.`;

  async function handleRazorpay() {
    // COMING_SOON guard — this path is unreachable while COMING_SOON=true
    if (COMING_SOON) { setNotifyOpen(true); return; }
    if (!isFormValid) {
      toast.error("Please fill in all shipping details before paying.");
      return;
    }
    setPaying(true);
    try {
      const ok = await loadRazorpay();
      if (!ok) {
        toast.error("Could not load payment gateway. Please try WhatsApp.");
        return;
      }

      const orderRes = await fetch("/api/razorpay/create-order-variant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantSlug: variant.slug,
          variantName: variant.name,
          amount: variant.price,
          customerName: name,
          customerPhone: phone,
          pincode,
          address: `${address}, ${city} — ${pincode}`,
        }),
      });

      if (!orderRes.ok) {
        toast.error("Could not start payment. Please order via WhatsApp.");
        return;
      }

      const order = (await orderRes.json()) as {
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
      };

      const rzp = new window.Razorpay!({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "OMORA BLOOMS",
        description: variant.name,
        theme: { color: "#C8A24A" },
        prefill: { name, contact: phone },
        handler: async (response: unknown) => {
          const r = response as {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          };
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...r, items: [{ id: variant.slug, quantity: 1 }] }),
            });
            const data = (await verifyRes.json()) as { ok?: boolean };
            if (data.ok) {
              toast.success("Payment successful! Our concierge will confirm shortly.");
              setSuccess(true);
            } else {
              toast.error("Payment verification failed. Please contact us on WhatsApp.");
            }
          } catch {
            toast.error("Could not verify payment. Please contact us.");
          }
        },
        modal: { ondismiss: () => toast.message("Payment cancelled") },
      });
      rzp.on("payment.failed", (resp: unknown) => {
        const r = resp as { error?: { description?: string } };
        toast.error(r?.error?.description || "Payment failed. Please try again.");
      });
      rzp.open();
    } finally {
      setPaying(false);
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="container-luxe py-24 text-center">
        <CheckCircle className="h-16 w-16 text-[color:var(--gold)] mx-auto mb-6" />
        <h1 className="font-serif text-4xl mb-3">Order Placed!</h1>
        <p className="text-[color:var(--muted-foreground)] max-w-md mx-auto">
          Thank you, {name}. Our concierge will call you shortly to confirm delivery details for your{" "}
          <strong className="text-white">{variant.name}</strong>.
        </p>
        <Link to="/" className="btn-gold mt-8 inline-block px-8 py-3 rounded-full text-sm">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Notify Me modal */}
      <NotifyMeModal
        open={notifyOpen}
        onClose={() => setNotifyOpen(false)}
        productName={variant.name}
      />

      <div>
        {/* ── Coming Soon banner ── */}
        {COMING_SOON && (
          <div className="border-b border-[color:var(--gold)]/20 bg-[color:var(--gold)]/5 py-3 px-4">
            <div className="container-luxe flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-[color:var(--gold)] animate-pulse flex-shrink-0" />
                <p className="text-[11px] tracking-[0.18em] uppercase text-[color:var(--gold)] font-semibold">
                  Launching Soon
                </p>
                <span className="hidden sm:block text-[color:var(--muted-foreground)] text-xs">
                  — Ordering & payments will be live shortly. Get notified first.
                </span>
              </div>
              <button
                onClick={() => setNotifyOpen(true)}
                className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full border border-[color:var(--gold)]/60 text-[color:var(--gold)] hover:bg-[color:var(--gold)] hover:text-[color:var(--noir)] px-4 py-1.5 text-[10px] tracking-[0.16em] uppercase font-semibold transition"
              >
                <Bell className="h-3 w-3" /> Notify Me
              </button>
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        <div className="container-luxe pt-8 flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase text-[color:var(--muted-foreground)]">
          <Link to="/" className="hover:text-[color:var(--gold)] transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link
            to="/varieties/$slug"
            params={{ slug: variant.parentSlug }}
            className="hover:text-[color:var(--gold)] transition-colors"
          >
            {variant.parentName}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[color:var(--gold)]">Checkout</span>
        </div>

        <div className="container-luxe py-10 md:py-14">
          <p className="eyebrow mb-2">Direct Checkout</p>
          <h1 className="font-serif text-4xl md:text-5xl mb-10">Complete Your Order</h1>

          <div className="grid lg:grid-cols-5 gap-10 md:gap-14">

            {/* ── Left: Shipping form ── */}
            <div className={`lg:col-span-3 space-y-8 ${COMING_SOON ? "opacity-50 pointer-events-none select-none" : ""}`}>

              {/* Delivery checker */}
              <div className="glass-card rounded-2xl p-6">
                <p className="eyebrow mb-4 text-[color:var(--gold)]">Check Delivery</p>
                <DeliveryEtaChecker />
              </div>

              {/* Shipping details */}
              <div className="glass-card rounded-2xl p-6">
                <p className="eyebrow mb-5 text-[color:var(--gold)]">Shipping Details</p>
                <div className="space-y-4">
                  <Field label="Full Name" icon={User} value={name} onChange={setName} placeholder="Your full name" required disabled={COMING_SOON} />
                  <Field label="Phone Number" icon={Phone} value={phone} onChange={setPhone} type="tel" placeholder="10-digit mobile number" required disabled={COMING_SOON} />
                  <Field label="Delivery Address" icon={Home} value={address} onChange={setAddress} placeholder="Flat / Building / Street" required disabled={COMING_SOON} />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="City" icon={MapPin} value={city} onChange={setCity} placeholder="City" required disabled={COMING_SOON} />
                    <Field label="Pincode" icon={MapPin} value={pincode} onChange={setPincode} type="text" placeholder="6-digit pincode" required disabled={COMING_SOON} />
                  </div>
                </div>
              </div>

              {/* Trust signals */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { icon: Sparkles, title: "Handmade to order", copy: "Crafted by artisans" },
                  { icon: Truck, title: "Same-day delivery", copy: "Order before 12 PM" },
                  { icon: ShieldCheck, title: "Secure payment", copy: "Razorpay encrypted" },
                  { icon: MessageCircle, title: "WhatsApp support", copy: "Concierge on call" },
                ].map((f) => (
                  <div key={f.title} className="hairline border rounded-xl p-3 flex items-start gap-3">
                    <f.icon className="h-4 w-4 text-[color:var(--gold)] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{f.title}</p>
                      <p className="text-[color:var(--muted-foreground)]">{f.copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Order summary + payment ── */}
            <aside className="lg:col-span-2">
              <div className="glass-card rounded-2xl p-6 sticky top-28 space-y-6">

                {/* Product card */}
                <div>
                  <p className="eyebrow mb-4 text-[color:var(--gold)]">Your Order</p>
                  <div className="flex gap-4 p-4 hairline border rounded-xl">
                    <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                      <img
                        src={variant.image}
                        alt={variant.name}
                        className="h-full w-full object-cover"
                      />
                      {/* Color tint */}
                      <div
                        className="absolute inset-0 rounded-lg pointer-events-none"
                        style={{
                          backgroundColor: variant.colorHex,
                          mixBlendMode: "multiply",
                          opacity: 0.4,
                        }}
                      />
                      {/* Coming Soon badge on product thumbnail */}
                      {COMING_SOON && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                          <span className="text-[8px] tracking-[0.15em] uppercase text-[color:var(--gold)] font-bold text-center px-1">
                            Coming<br />Soon
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-base leading-snug">{variant.name}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span
                          className="h-3 w-3 rounded-full ring-1 ring-white/30"
                          style={{ backgroundColor: variant.colorHex }}
                        />
                        <span className="text-[11px] text-[color:var(--muted-foreground)] tracking-wide">
                          {variant.colorName}
                        </span>
                      </div>
                      <p className="mt-2 text-[color:var(--gold)] font-medium text-lg">
                        {formatPrice(variant.price)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Price breakdown */}
                <div className="space-y-2.5 text-sm border-t hairline pt-4">
                  <div className="flex justify-between">
                    <span className="text-[color:var(--muted-foreground)]">Subtotal</span>
                    <span>{formatPrice(variant.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[color:var(--muted-foreground)]">Shipping</span>
                    <span className="text-[color:var(--gold)]">Calculated at dispatch</span>
                  </div>
                  <div className="border-t hairline pt-2.5 flex justify-between font-serif text-xl">
                    <span>Total</span>
                    <span className="text-[color:var(--gold)]">{formatPrice(variant.price)}</span>
                  </div>
                </div>

                {/* ── Payment CTAs — COMING_SOON toggles between Notify Me and live payment ── */}
                {COMING_SOON ? (
                  /* Coming Soon payment section */
                  <div className="space-y-3">
                    <button
                      onClick={() => setNotifyOpen(true)}
                      className="btn-gold w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full text-sm"
                    >
                      <Bell className="h-4 w-4" />
                      Notify Me When We Launch
                    </button>

                    {/* Greyed-out live payment buttons — structure kept for launch */}
                    <div className="relative">
                      <div className="pointer-events-none select-none opacity-30 space-y-3">
                        <button
                          disabled
                          className="btn-gold w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full text-sm"
                        >
                          <CreditCard className="h-4 w-4" /> Pay with Razorpay
                        </button>
                        <a
                          href="#"
                          onClick={(e) => e.preventDefault()}
                          className="btn-outline-gold w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full text-sm"
                        >
                          <MessageCircle className="h-4 w-4" /> Order via WhatsApp
                        </a>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] tracking-[0.18em] uppercase text-[color:var(--gold)]/60 font-semibold bg-[color:var(--card)] px-3 py-1 rounded-full border border-[color:var(--gold)]/20">
                          Available at Launch
                        </span>
                      </div>
                    </div>

                    <p className="text-[10px] text-[color:var(--muted-foreground)] text-center leading-relaxed">
                      UPI · Cards · Net Banking · Wallets via Razorpay will be available soon.
                    </p>
                  </div>
                ) : (
                  /* Live payment buttons — active when COMING_SOON = false */
                  <div className="space-y-3">
                    <button
                      onClick={handleRazorpay}
                      disabled={paying}
                      className="btn-gold w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <CreditCard className="h-4 w-4" />
                      {paying ? "Opening payment…" : "Pay with Razorpay"}
                    </button>

                    <a
                      href={whatsappLink(waMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline-gold w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full text-sm"
                    >
                      <MessageCircle className="h-4 w-4" /> Order via WhatsApp
                    </a>

                    <p className="text-[10px] text-[color:var(--muted-foreground)] text-center leading-relaxed">
                      UPI · Cards · Net Banking · Wallets via Razorpay<br />
                      Or confirm instantly with our concierge on WhatsApp.
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
