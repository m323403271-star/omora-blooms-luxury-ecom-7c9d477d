import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ChevronRight, CreditCard, MessageCircle, ShieldCheck,
  Truck, Sparkles, MapPin, User, Phone, Home, CheckCircle, Loader2,
} from "lucide-react";
import { productsQuery, formatPrice } from "@/lib/products";
import { variantBySlugQuery } from "@/lib/product-variants";
import { VariantGallery } from "@/components/site/VariantGallery";
import { DeliveryEtaChecker } from "@/components/site/DeliveryEtaChecker";
import { whatsappLink } from "@/lib/whatsapp";
import { toast } from "sonner";
import { isAirportPincode } from "@/lib/delivery";
import { PICKUP_POINTS, findPickup } from "@/lib/pickup";

export const Route = createFileRoute("/buy/$variant")({
  head: ({ params }) => {
    const title = params.variant.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const description = `Order ${title} — luxury handmade bouquet with same-day delivery in Bengaluru.`;
    return {
      meta: [
        { title: `${title} — OMORA BLOOMS` },
        { name: "description", content: description },
        { property: "og:title", content: `${title} — OMORA BLOOMS` },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: BuyPage,
});

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

function Field({
  label, icon: Icon, value, onChange, type = "text", placeholder, required,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
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
        className="w-full bg-[color:var(--noir)] hairline border rounded-xl px-4 py-3 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)]/60 focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)] transition"
      />
    </div>
  );
}

function BuyPage() {
  const { variant: variantSlug } = Route.useParams();
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: variant, isLoading } = useQuery(variantBySlugQuery(variantSlug));

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [pickup, setPickup] = useState("");
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);

  if (isLoading) {
    return (
      <div className="container-luxe py-24 text-center text-[color:var(--muted-foreground)]">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      </div>
    );
  }
  if (!variant) throw notFound();

  const parent = products.find((p) => p.id === variant.product_id);
  const media = [...(variant.images ?? []), ...(variant.video_url ? [variant.video_url] : [])].filter(Boolean);

  const airportOnly = isAirportPincode(pincode.trim());
  const pickupObj = findPickup(pickup);
  const deliveryLine = airportOnly
    ? pickupObj
      ? `Airport Pickup: ${pickupObj.label} (${pickupObj.detail})`
      : "Airport Pickup: —"
    : `Address: ${address || "—"}, ${city || "—"} — ${pincode || "—"}`;

  const isFormValid = Boolean(
    name.trim() &&
    phone.trim().length >= 10 &&
    pincode.trim().length === 6 &&
    (airportOnly ? pickup : address.trim() && city.trim()),
  );

  const waMessage =
    `Hello OMORA BLOOMS! I'd like to order:\n\n` +
    `• ${variant.name} — ${formatPrice(variant.price)}\n` +
    `\nShipping Details:\n` +
    `Name: ${name || "—"}\nPhone: ${phone || "—"}\n${deliveryLine}` +
    `\n\nPlease confirm availability & delivery time.`;

  async function handleRazorpay() {
    if (!variant) return;
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
          customerName: name,
          customerPhone: phone,
          pincode,
          address: airportOnly ? deliveryLine : `${address}, ${city} — ${pincode}`,
          pickupPointId: airportOnly ? pickup : null,
        }),
      });

      if (!orderRes.ok) {
        toast.error("Could not start payment. Please order via WhatsApp.");
        return;
      }

      const order = (await orderRes.json()) as {
        orderId: string; amount: number; currency: string; keyId: string;
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
    <div>
      <div className="container-luxe pt-8 flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase text-[color:var(--muted-foreground)]">
        <Link to="/" className="hover:text-[color:var(--gold)] transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        {parent ? (
          <>
            <Link
              to="/varieties/$slug"
              params={{ slug: parent.slug }}
              className="hover:text-[color:var(--gold)] transition-colors"
            >
              {parent.name}
            </Link>
            <ChevronRight className="h-3 w-3" />
          </>
        ) : null}
        <span className="text-[color:var(--gold)]">Order</span>
      </div>

      <div className="container-luxe py-10 md:py-14">
        <p className="eyebrow mb-2">Direct Checkout</p>
        <h1 className="font-serif text-4xl md:text-5xl mb-10">{variant.name}</h1>

        <div className="grid lg:grid-cols-5 gap-10 md:gap-14">
          {/* Left: gallery + details + shipping */}
          <div className="lg:col-span-3 space-y-8">
            {media.length > 0 && <VariantGallery media={media} alt={variant.name} />}

            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  {variant.color_name ? (
                    <>
                      <span
                        className="h-4 w-4 rounded-full ring-1 ring-white/25"
                        style={{ backgroundColor: variant.color_hex }}
                      />
                      <span className="text-xs tracking-[0.16em] uppercase text-[color:var(--muted-foreground)]">
                        {variant.color_name}
                      </span>
                    </>
                  ) : null}
                </div>
                <p className="font-serif text-2xl text-[color:var(--gold)]">{formatPrice(variant.price)}</p>
              </div>
              {variant.description ? (
                <p className="mt-4 text-sm leading-relaxed text-[color:var(--muted-foreground)] whitespace-pre-line">
                  {variant.description}
                </p>
              ) : null}
            </div>

            <div className="glass-card rounded-2xl p-6">
              <p className="eyebrow mb-4 text-[color:var(--gold)]">Check Delivery</p>
              <DeliveryEtaChecker />
            </div>

            <div className="glass-card rounded-2xl p-6">
              <p className="eyebrow mb-5 text-[color:var(--gold)]">Shipping Details</p>
              <div className="space-y-4">
                <Field label="Full Name" icon={User} value={name} onChange={setName} placeholder="Your full name" required />
                <Field label="Phone Number" icon={Phone} value={phone} onChange={setPhone} type="tel" placeholder="10-digit mobile number" required />
                {airportOnly ? (
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-[color:var(--gold)]">
                      <MapPin className="h-3.5 w-3.5" /> Airport Pickup Point <span className="text-[color:var(--destructive)]">*</span>
                    </label>
                    <div className="space-y-2">
                      {PICKUP_POINTS.map((pt) => (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() => setPickup(pt.id)}
                          className={`w-full text-left rounded-xl border px-4 py-3 transition ${
                            pickup === pt.id
                              ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10"
                              : "hairline hover:border-[color:var(--gold)]/50"
                          }`}
                        >
                          <p className="text-sm font-medium">{pt.label}</p>
                          <p className="text-xs text-[color:var(--muted-foreground)]">{pt.detail}</p>
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] text-[color:var(--muted-foreground)]">
                      Express 20–30 min handover. Security rules restrict entry to gate check-in areas — please meet our agent at your chosen point.
                    </p>
                  </div>
                ) : (
                  <Field label="Delivery Address" icon={Home} value={address} onChange={setAddress} placeholder="Flat / Building / Street" required />
                )}
                <div className="grid grid-cols-2 gap-4">
                  {!airportOnly && (
                    <Field label="City" icon={MapPin} value={city} onChange={setCity} placeholder="City" required />
                  )}
                  <Field label="Pincode" icon={MapPin} value={pincode} onChange={setPincode} placeholder="6-digit pincode" required />
                </div>
              </div>
            </div>

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

          {/* Right: order summary */}
          <aside className="lg:col-span-2">
            <div className="glass-card rounded-2xl p-6 sticky top-28 space-y-6">
              <div>
                <p className="eyebrow mb-4 text-[color:var(--gold)]">Your Order</p>
                <div className="flex gap-4 p-4 hairline border rounded-xl">
                  <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-black/40">
                    {variant.images?.[0] ? (
                      <img src={variant.images[0]} alt={variant.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-base leading-snug">{variant.name}</p>
                    {variant.color_name ? (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span
                          className="h-3 w-3 rounded-full ring-1 ring-white/30"
                          style={{ backgroundColor: variant.color_hex }}
                        />
                        <span className="text-[11px] text-[color:var(--muted-foreground)] tracking-wide">
                          {variant.color_name}
                        </span>
                      </div>
                    ) : null}
                    <p className="mt-2 text-[color:var(--gold)] font-medium text-lg">{formatPrice(variant.price)}</p>
                  </div>
                </div>
              </div>

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

              <div className="space-y-3">
                <button
                  onClick={handleRazorpay}
                  disabled={paying}
                  className="btn-gold w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <CreditCard className="h-4 w-4" />
                  {paying ? "Opening payment…" : "Order Now — Pay Securely"}
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
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
