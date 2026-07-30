import { useState } from "react";
import { X, Bell, CheckCircle, Sparkles } from "lucide-react";

interface NotifyMeModalProps {
  open: boolean;
  onClose: () => void;
  productName?: string;
}

export function NotifyMeModal({ open, onClose, productName }: NotifyMeModalProps) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim() || phone.trim().length < 10) return;
    setLoading(true);
    // Simulate a short async save — wire to your DB here when going live
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={handleBackdrop}
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-md rounded-3xl border border-[color:var(--gold)]/30 bg-[color:var(--card)] shadow-2xl overflow-hidden"
        style={{ boxShadow: "0 0 60px rgba(200,162,74,0.15)" }}
      >
        {/* Gold top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-[color:var(--gold)] to-transparent" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[color:var(--muted-foreground)] hover:text-[color:var(--gold)] hover:bg-white/5 transition"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-8 pb-8 pt-7">
          {submitted ? (
            /* ── Success state ── */
            <div className="text-center py-4">
              <CheckCircle className="h-14 w-14 text-[color:var(--gold)] mx-auto mb-5" />
              <h2 className="font-serif text-2xl mb-2">You're on the list!</h2>
              <p className="text-[color:var(--muted-foreground)] text-sm leading-relaxed">
                Thank you! We will notify you as soon as we launch
                {productName ? (
                  <>
                    {" "}— including <span className="text-white font-medium">{productName}</span>
                  </>
                ) : null}
                .
              </p>
              <button
                onClick={onClose}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--gold)]/60 text-[color:var(--gold)] hover:bg-[color:var(--gold)] hover:text-[color:var(--noir)] px-6 py-2.5 text-sm font-semibold tracking-wide transition"
              >
                Close
              </button>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              {/* Header */}
              <div className="flex items-start gap-3 mb-6">
                <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--gold)]/10 border border-[color:var(--gold)]/30">
                  <Bell className="h-5 w-5 text-[color:var(--gold)]" />
                </span>
                <div>
                  <p className="eyebrow text-[color:var(--gold)] mb-1">Coming Soon</p>
                  <h2 className="font-serif text-2xl leading-tight">We're launching soon!</h2>
                </div>
              </div>

              <p className="text-[color:var(--muted-foreground)] text-sm mb-6 leading-relaxed">
                Enter your details to get notified via{" "}
                <span className="text-white">SMS&nbsp;/&nbsp;Email</span> the moment we go live.
                {productName && (
                  <span className="block mt-1 text-[color:var(--gold)]/80">
                    <Sparkles className="inline h-3 w-3 mr-1 mb-0.5" />
                    We'll save your interest in <em>{productName}</em>.
                  </span>
                )}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Phone */}
                <div>
                  <label className="block text-[11px] tracking-[0.18em] uppercase text-[color:var(--gold)] mb-1.5">
                    Phone Number <span className="text-[color:var(--destructive)]">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    required
                    maxLength={15}
                    className="w-full bg-[color:var(--noir)] hairline border rounded-xl px-4 py-3 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)]/50 focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)] transition"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] tracking-[0.18em] uppercase text-[color:var(--gold)] mb-1.5">
                    Email Address{" "}
                    <span className="text-[color:var(--muted-foreground)] normal-case tracking-normal text-[10px]">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[color:var(--noir)] hairline border rounded-xl px-4 py-3 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)]/50 focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)] transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || phone.trim().length < 10}
                  className="btn-gold w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  <Bell className="h-4 w-4" />
                  {loading ? "Saving…" : "Notify Me When We Launch"}
                </button>
              </form>

              <p className="mt-4 text-center text-[10px] text-[color:var(--muted-foreground)] leading-relaxed">
                No spam, ever. We'll only reach out when the store goes live.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
