import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  ChevronRight, CreditCard, MessageCircle, ShieldCheck,
  Truck, Sparkles, MapPin, User, Phone, Home, CheckCircle, Loader2, StickyNote, Mail, Tag,
} from "lucide-react";
import { productsQuery, formatPrice } from "@/lib/products";
import { variantBySlugQuery, isSoldOut } from "@/lib/product-variants";
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

type DeliveryMode = "local" | "airport" | "prestige";

const ETA_BY_MODE: Record<DeliveryMode, string> = {
  local: "30 – 45 Minutes",
  airport: "30 – 45 Minutes",
  prestige: "45 Minutes – 1 Hour",
};

const SHARED_PIN_OPTIONS: { value: DeliveryMode; label: string }[] = [
  { value: "local", label: "Devanahalli Local / General Customer" },
  { value: "airport", label: "Airport Customer (KIA Pickup)" },
  { value: "prestige", label: "Prestige Golfshire Customer" },
];

function BuyPage() {
  const { variant: variantSlug } = Route.useParams();
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: variant, isLoading } = useQuery(variantBySlugQuery(variantSlug));

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [pickup, setPickup] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [sharedMode, setSharedMode] = useState<DeliveryMode>("local");

  const [payMode, setPayMode] = useState<"full" | "advance">("full");
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number; label: string } | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const savedRef = useRef("");


  // Save an in-progress checkout so the concierge can nudge on WhatsApp later.
  useEffect(() => {
    if (success) return;
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || !variant) return;
    const payload = JSON.stringify({
      customerPhone: digits,
      customerName: name.trim() || null,
      items: [{ id: variant.slug, name: variant.name, price: variant.price, image: variant.images?.[0] ?? null }],
      total: variant.price,
    });
    if (savedRef.current === payload) return;
    const t = setTimeout(() => {
      savedRef.current = payload;
      fetch("/api/abandoned-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }, 2500);
    return () => clearTimeout(t);
  }, [phone, name, variant, success]);

  if (isLoading) {
    return (
      <div className="container-luxe py-24 text-center text-[color:var(--muted-foreground)]">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      </div>
    );
  }
  if (!variant) throw notFound();

  const soldOut = isSoldOut(variant);
  const parent = products.find((p) => p.id === variant.product_id);
  const media = [...(variant.images ?? []), ...(variant.video_url ? [variant.video_url] : [])].filter(Boolean);
  const displayImage = selectedImage || variant.images?.[0] || parent?.image_url || "";

  const pin = pincode.trim();
  const isSharedPin = pin === "562110";
  const autoMode: DeliveryMode | null =
    pin === "560300" || isAirportPincode(pin) ? "airport" : pin === "562164" ? "prestige" : null;
  const mode: DeliveryMode = autoMode ?? (isSharedPin ? sharedMode : "local");
  const airportOnly = mode === "airport";
  const isPrestige = mode === "prestige";
  const eta = ETA_BY_MODE[mode];

  const pickupObj = findPickup(pickup);
  const deliveryLine = airportOnly
    ? pickupObj
      ? `Airport Pickup: ${pickupObj.label} (${pickupObj.detail})`
      : "Airport Pickup: —"
    : isPrestige
      ? `Prestige Golfshire — Villa: ${address || "—"} (Pincode ${pincode || "—"})`
      : `Address: ${address || "—"}, ${city || "—"} — ${pincode || "—"}`;

  const isFormValid = Boolean(
    !soldOut &&
    name.trim() &&
    phone.trim().length >= 10 &&
    pin.length === 6 &&
    (airportOnly ? pickup : isPrestige ? address.trim() : address.trim() && city.trim()),
  );


  // Pricing (mirrors the authoritative server-side calculation)
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const listTotal = round2(variant.price);
  const discount = payMode === "full" ? round2(listTotal * 0.05) : 0;
  const couponDiscount = coupon ? Math.min(coupon.discount, round2(listTotal - discount)) : 0;
  const orderTotal = round2(listTotal - discount - couponDiscount);
  const payNow = payMode === "advance" ? round2(orderTotal * 0.3) : orderTotal;
  const balanceDue = round2(orderTotal - payNow);

  const waMessage =
    `Hello OMORA BLOOMS! I'd like to order:\n\n` +
    `• ${variant.name} — ${formatPrice(variant.price)}\n` +
    (payMode === "full"
      ? `\nPayment: Full online payment (5% OFF) — ${formatPrice(orderTotal)}`
      : `\nPayment: 30% advance booking — ${formatPrice(payNow)} now, ${formatPrice(balanceDue)} on delivery`) +
    `\n\nShipping Details:\n` +
    `Name: ${name || "—"}\nPhone: ${phone || "—"}\n${deliveryLine}` +
    (deliveryNotes.trim() ? `\nDelivery Notes: ${deliveryNotes.trim()}` : "") +
    `\n\nPlease confirm availability & delivery time.`;


  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setCouponBusy(true);
    try {
      const res = await fetch("/api/coupon/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, amount: round2(listTotal - discount) }),
      });
      const data = (await res.json()) as
        | { valid: true; code: string; discount: number; label: string }
        | { valid: false; reason: string };
      if (data.valid) {
        setCoupon({ code: data.code, discount: data.discount, label: data.label });
        toast.success(`Coupon ${data.code} applied — ${data.label}`);
      } else {
        setCoupon(null);
        toast.error(data.reason);
      }
    } catch {
      toast.error("Could not check that coupon");
    } finally {
      setCouponBusy(false);
    }
  }

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
          paymentMode: payMode,

          customerName: name,
          customerPhone: phone,
          pincode,
          address: airportOnly ? deliveryLine : `${address}, ${city} — ${pincode}`,
          pickupPointId: airportOnly ? pickup : null,
          deliveryNotes: deliveryNotes.trim() || null,

          customerEmail: email.trim() || null,
          couponCode: coupon?.code ?? null,

          selectedImage: displayImage,
          colorName: variant.color_name,
          colorHex: variant.color_hex,
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
            {media.length > 0 && (
              <VariantGallery
                media={media}
                alt={variant.name}
                onActiveImageChange={(img) => setSelectedImage(img)}
              />
            )}

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
                <Field label="Email (for order updates)" icon={Mail} value={email} onChange={setEmail} type="email" placeholder="you@email.com" />
                <Field label="Pincode" icon={MapPin} value={pincode} onChange={setPincode} placeholder="6-digit pincode" required />

                {isSharedPin && (
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-[color:var(--gold)]">
                      <MapPin className="h-3.5 w-3.5" /> Location / Customer Type <span className="text-[color:var(--destructive)]">*</span>
                    </label>
                    <select
                      value={sharedMode}
                      onChange={(e) => setSharedMode(e.target.value as DeliveryMode)}
                      className="w-full rounded-xl border hairline bg-[color:var(--noir)] px-4 py-3 text-sm text-[color:var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)]"
                    >
                      {SHARED_PIN_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label} — {ETA_BY_MODE[o.value]}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {pin.length === 6 && (
                  <p className="text-[11px] tracking-[0.2em] uppercase text-[color:var(--gold)]">
                    {isPrestige ? "Prestige Golfshire Customer · " : airportOnly ? "Airport Pickup · " : "Doorstep Delivery · "}
                    ETA {eta}
                  </p>
                )}

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
                      30–45 min handover. Security rules restrict entry to gate check-in areas — please meet our agent at your chosen point.
                    </p>
                  </div>
                ) : isPrestige ? (
                  <Field
                    label="Prestige Golfshire Villa Address"
                    icon={Home}
                    value={address}
                    onChange={setAddress}
                    placeholder="Villa / Block number, Prestige Golfshire"
                    required
                  />
                ) : (
                  <>
                    <Field label="Delivery Address" icon={Home} value={address} onChange={setAddress} placeholder="Flat / Building / Street" required />
                    <Field label="City" icon={MapPin} value={city} onChange={setCity} placeholder="City" required />
                  </>
                )}

                <div>
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
                {soldOut && (
                  <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                    This shade is currently sold out. Message us on WhatsApp and we'll craft it to order.
                  </div>
                )}
                <div className="flex gap-4 p-4 hairline border rounded-xl">
                  <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-black/40">
                    {displayImage ? (
                      <img src={displayImage} alt={variant.name} className="h-full w-full object-cover" />
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

              {/* Coupon */}
              <div className="border-t hairline pt-5">
                <p className="eyebrow mb-3 text-[color:var(--gold)]">Coupon Code</p>
                {coupon ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/5 px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-sm">
                      <Tag className="h-4 w-4 text-[color:var(--gold)]" />
                      {coupon.code} · {coupon.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setCoupon(null); setCouponInput(""); }}
                      className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)] hover:text-[color:var(--gold)]"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="flex-1 bg-[color:var(--noir)] hairline border rounded-xl px-4 py-2.5 text-sm uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)]"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponBusy || !couponInput.trim()}
                      className="btn-outline-gold px-5 rounded-xl text-xs disabled:opacity-50"
                    >
                      {couponBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
                    </button>
                  </div>
                )}
              </div>

              {/* Payment options */}
              <div className="border-t hairline pt-5">
                <p className="eyebrow mb-3 text-[color:var(--gold)]">Payment Option</p>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setPayMode("full")}
                    className={`w-full text-left rounded-xl border px-4 py-3.5 transition ${
                      payMode === "full"
                        ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10"
                        : "hairline hover:border-[color:var(--gold)]/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">Pay Full Amount Online</p>
                        <p className="text-xs text-[color:var(--muted-foreground)]">UPI · Cards · NetBanking</p>
                      </div>
                      <span className="rounded-full bg-[color:var(--gold)] px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase text-[color:var(--noir)]">
                        5% OFF
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMode("advance")}
                    className={`w-full text-left rounded-xl border px-4 py-3.5 transition ${
                      payMode === "advance"
                        ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10"
                        : "hairline hover:border-[color:var(--gold)]/50"
                    }`}
                  >
                    <p className="text-sm font-medium">Advance Booking — Pay 30% Now</p>
                    <p className="text-xs text-[color:var(--muted-foreground)]">
                      70% balance payable on delivery
                    </p>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 text-sm border-t hairline pt-4">
                <div className="flex justify-between">
                  <span className="text-[color:var(--muted-foreground)]">Subtotal</span>
                  <span>{formatPrice(listTotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[color:var(--muted-foreground)]">Online payment discount (5%)</span>
                    <span className="text-[color:var(--gold)]">− {formatPrice(discount)}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[color:var(--muted-foreground)]">Coupon {coupon?.code}</span>
                    <span className="text-[color:var(--gold)]">− {formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[color:var(--muted-foreground)]">Shipping</span>
                  <span className="text-[color:var(--gold)]">Calculated at dispatch</span>
                </div>
                <div className="border-t hairline pt-2.5 flex justify-between font-serif text-xl">
                  <span>Order Total</span>
                  <span className="text-[color:var(--gold)]">{formatPrice(orderTotal)}</span>
                </div>

                {payMode === "advance" ? (
                  <div className="mt-3 rounded-xl border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/5 p-3.5 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[color:var(--muted-foreground)]">Pay now (30% advance)</span>
                      <span className="text-[color:var(--gold)] font-medium">{formatPrice(payNow)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[color:var(--muted-foreground)]">Due on delivery (70%)</span>
                      <span className="font-medium">{formatPrice(balanceDue)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/5 p-3.5 flex justify-between">
                    <span className="text-[color:var(--muted-foreground)]">Pay now (full)</span>
                    <span className="text-[color:var(--gold)] font-medium">{formatPrice(payNow)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleRazorpay}
                  disabled={paying || soldOut}
                  className="btn-gold w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <CreditCard className="h-4 w-4" />
                  {soldOut
                    ? "Sold Out"
                    : paying
                    ? "Opening payment…"
                    : payMode === "advance"
                      ? `Pay ${formatPrice(payNow)} Advance`
                      : `Pay ${formatPrice(payNow)} & Save 5%`}
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
                  UPI · Cards · Net Banking · Wallets via Razorpay. Cash on delivery is not available.<br />
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
