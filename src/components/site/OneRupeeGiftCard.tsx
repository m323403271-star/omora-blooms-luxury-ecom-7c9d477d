import { useState } from "react";
import { Check, Copy, Gift, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import heroBouquet from "@/assets/hero-bouquet.jpg";
import { loadScript } from "@/lib/razorpay";
import {
  isLocalPaymentOrigin,
  isProductionPaymentOrigin,
  livePaymentUrl,
} from "@/lib/payment-origin";

type PayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

const VOUCHER_COPY = "Flat ₹100 off your next order · One-time use · Valid for 90 days";

/**
 * ₹1 Digital Gift Card & Discount Voucher.
 * Visitor enters name + WhatsApp number, pays exactly ₹1 through Razorpay and
 * instantly receives an exclusive handmade-bouquet digital wallpaper plus a
 * redeemable one-time discount voucher shown on screen.
 */
export function OneRupeeGiftCard() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [voucher, setVoucher] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const pay = async () => {
    if (busy) return;
    const cleanName = name.trim().replace(/\s+/g, " ");
    const digits = phone.replace(/\D/g, "");
    if (cleanName.length < 2) {
      toast.error("Please enter your name");
      return;
    }
    if (digits.length < 10 || digits.length > 13) {
      toast.error("Enter a valid WhatsApp number");
      return;
    }
    const checkoutOrigin = window.location.origin;
    if (!isProductionPaymentOrigin(checkoutOrigin) && !isLocalPaymentOrigin(checkoutOrigin)) {
      toast.error("Secure payment opens on the live OMORA BLOOMS website.");
      window.location.assign(livePaymentUrl("/"));
      return;
    }
    setBusy(true);
    try {
      const ok = await loadScript();
      if (!ok) {
        toast.error("Could not load payment. Check your connection.");
        return;
      }
      const res = await fetch("/api/giftcard/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName, whatsapp: digits, checkoutOrigin }),
      });
      if (!res.ok) {
        const failure = (await res.json().catch(() => null)) as
          | { error?: string; liveUrl?: string }
          | null;
        toast.error(failure?.error || "Could not start payment");
        if (failure?.liveUrl) window.location.assign(failure.liveUrl);
        return;
      }
      const order = (await res.json()) as {
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
      };

      await new Promise<void>((resolve) => {
        const rzp = new window.Razorpay!({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          order_id: order.orderId,
          name: "OMORA BLOOMS",
          description: "₹1 Digital Gift Card & Discount Voucher",
          theme: { color: "#C8A24A" },
          prefill: { name: cleanName, contact: digits },
          handler: async (response: PayResponse) => {
            try {
              const v = await fetch("/api/giftcard/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
              });
              const data = (await v.json().catch(() => null)) as
                | { ok?: boolean; voucherCode?: string; error?: string }
                | null;
              if (v.ok && data?.voucherCode) {
                setVoucher(data.voucherCode);
                toast.success("Your ₹1 gift card is ready!");
              } else {
                toast.error(data?.error || "Payment received but the voucher could not be issued. Please contact us on WhatsApp.");
              }
            } catch {
              toast.error("Could not confirm your voucher. Please contact us on WhatsApp.");
            }
            resolve();
          },
          modal: { ondismiss: () => resolve() },
        });
        rzp.open();
      });
    } catch {
      toast.error("Network error starting payment");
    } finally {
      setBusy(false);
    }
  };

  const copyVoucher = async () => {
    if (!voucher) return;
    try {
      await navigator.clipboard.writeText(voucher);
      setCopied(true);
      toast.success("Voucher code copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — please note the code down");
    }
  };

  return (
    <section id="gift-card" className="container-luxe py-3 md:py-10" aria-label="₹1 digital gift card and discount voucher">
      <div className="overflow-hidden rounded-3xl border hairline bg-[color:var(--card)] md:rounded-[2rem]">
        <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,380px)_minmax(0,1fr)] md:gap-8 md:p-8">
          {/* Digital wallpaper preview */}
          <div className="relative mx-auto w-full max-w-[280px] md:max-w-[360px]">
            <div className="relative overflow-hidden rounded-[1.75rem] border-2 border-[color:var(--gold)]/60 shadow-[0_24px_60px_-30px_rgba(200,162,74,0.7)] md:rounded-[2rem]">
              <img
                src={heroBouquet}
                alt="OMORA BLOOMS handmade floral bouquet digital wallpaper"
                className="aspect-[9/16] w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-center md:p-4">
                <p className="eyebrow text-[color:var(--gold)]">Digital Gift Card</p>
                <p className="font-serif text-xl leading-tight text-foreground md:text-2xl">OMORA BLOOMS</p>
                {voucher ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-3 py-1 text-xs font-bold tracking-wider text-[color:var(--noir)]">
                    <Sparkles className="h-3.5 w-3.5" /> {voucher}
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] text-muted-foreground md:text-xs">
                    Exclusive handmade bouquet wallpaper
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Details + form */}
          <div className="flex flex-col justify-center gap-3 md:gap-5">
            <div>
              <p className="eyebrow mb-1 text-[color:var(--gold)]">Limited Launch Offer</p>
              <h2 className="font-serif text-xl leading-tight tracking-tight md:text-3xl">
                ₹1 Digital Gift Card &amp; Discount Voucher
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground md:text-sm">
                Pay just ₹1 to own an exclusive OMORA BLOOMS handmade bouquet digital
                wallpaper — and receive a discount voucher for your next luxury order.
              </p>
            </div>

            <ul className="space-y-1.5 text-xs text-muted-foreground md:space-y-2 md:text-sm">
              <li className="flex items-start gap-2">
                <Gift className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--gold)]" />
                <span>Handmade floral bouquet wallpaper for your phone</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--gold)]" />
                <span>{VOUCHER_COPY}</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--gold)]" />
                <span>Instant — your voucher appears here the moment payment succeeds</span>
              </li>
            </ul>

            {voucher ? (
              <div className="rounded-2xl border border-[color:var(--gold)]/40 bg-[color:var(--noir)]/40 p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Your voucher code</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="font-serif text-2xl text-[color:var(--gold)] md:text-3xl">{voucher}</p>
                  <button
                    type="button"
                    onClick={copyVoucher}
                    aria-label="Copy voucher code"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border hairline text-[color:var(--gold)] transition hover:bg-[color:var(--gold)]/10"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground md:text-xs">
                  Use this code in the coupon box at checkout. {VOUCHER_COPY}. Saved to your
                  WhatsApp number {phone.replace(/\D/g, "")}.
                </p>
              </div>
            ) : (
              <form
                className="grid gap-2 md:gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void pay();
                }}
              >
                <div className="grid gap-2 sm:grid-cols-2 md:gap-3">
                  <label className="grid gap-1">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Your Name</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      maxLength={80}
                      autoComplete="name"
                      placeholder="Full name"
                      className="h-10 rounded-xl border hairline bg-transparent px-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-[color:var(--gold)] md:h-11"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">WhatsApp Number</span>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      type="tel"
                      inputMode="numeric"
                      maxLength={15}
                      autoComplete="tel"
                      placeholder="10-digit mobile"
                      className="h-10 rounded-xl border hairline bg-transparent px-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-[color:var(--gold)] md:h-11"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-gold-gradient px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--noir)] shadow-[0_14px_30px_-16px_rgba(200,162,74,0.9)] transition hover:opacity-90 disabled:opacity-60 md:text-sm"
                >
                  {busy ? "Opening secure payment…" : "Pay ₹1"}
                </button>
                <p className="text-center text-[11px] text-muted-foreground">
                  Secure payment via Razorpay · UPI, cards &amp; more · Only ₹1 charged
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
