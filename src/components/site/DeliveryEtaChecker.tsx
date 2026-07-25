import { useEffect, useMemo, useState } from "react";
import { MapPin, Zap, Truck, Crown, XCircle, CheckCircle2, Lock } from "lucide-react";
import {
  checkDelivery,
  getCustomerTier,
  getStoredPincode,
  setStoredPincode,
  type DeliveryResult,
  type DeliveryTier,
} from "@/lib/delivery";

type Variant = "header" | "inline" | "checkout";

export function DeliveryEtaChecker({
  variant = "inline",
  title,
  locked = false,
}: {
  variant?: Variant;
  title?: string;
  locked?: boolean;
}) {
  const [pincode, setPincode] = useState<string>(() => getStoredPincode() ?? "");
  const [touched, setTouched] = useState(false);
  const [tier, setTier] = useState<DeliveryTier>("regular");

  useEffect(() => {
    setTier(getCustomerTier());
    const onPin = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setPincode(typeof detail === "string" ? detail : "");
    };
    const onTier = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setTier(detail === "prestige" ? "prestige" : "regular");
    };
    window.addEventListener("omora:pincode-changed", onPin);
    window.addEventListener("omora:tier-changed", onTier);
    return () => {
      window.removeEventListener("omora:pincode-changed", onPin);
      window.removeEventListener("omora:tier-changed", onTier);
    };
  }, []);

  const result = useMemo<DeliveryResult | null>(() => {
    if (!pincode) return null;
    if (!touched && pincode.length !== 6) return null;
    return checkDelivery(pincode, tier);
  }, [pincode, tier, touched]);

  function handleChange(v: string) {
    const cleaned = v.replace(/\D/g, "").slice(0, 6);
    setPincode(cleaned);
    if (cleaned.length === 6) {
      setTouched(true);
      setStoredPincode(cleaned);
    }
  }

  if (variant === "header") {
    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <MapPin className="h-3.5 w-3.5 text-[color:var(--gold)] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            inputMode="numeric"
            maxLength={6}
            value={pincode}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Pincode"
            aria-label="Check delivery pincode"
            className="w-[130px] pl-7 pr-2 py-1.5 rounded-full bg-[color:var(--noir)] border hairline text-[12px] tracking-widest uppercase text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)]"
          />
        </div>
        {result && <BadgePill result={result} compact />}
      </div>
    );
  }

  return (
    <div className={variant === "checkout" ? "rounded-2xl border hairline p-5 bg-[color:var(--noir)]/60" : "rounded-2xl border hairline p-5"}>
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-[color:var(--gold)]">
          <MapPin className="h-3.5 w-3.5" /> {title ?? "Check Delivery ETA"}
        </label>
        {variant === "checkout" && locked && result?.serviceable && (
          <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.2em] uppercase text-[color:var(--gold)]">
            <Lock className="h-3 w-3" /> SLA Locked
          </span>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          inputMode="numeric"
          maxLength={6}
          value={pincode}
          disabled={locked && !!result?.serviceable}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="Enter 6-digit pincode"
          aria-label="Enter delivery pincode"
          className="flex-1 px-4 py-2.5 rounded-lg bg-[color:var(--noir)] border hairline text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)] disabled:opacity-70"
        />
        <button
          type="button"
          onClick={() => setTouched(true)}
          className="btn-outline-gold px-4 py-2 rounded-lg text-xs tracking-widest uppercase"
        >
          Check
        </button>
      </div>
      {result && (
        <div className="mt-4">
          <BadgePill result={result} />
          <p className="mt-2 text-xs text-[color:var(--muted-foreground)] leading-relaxed">
            {result.message}
          </p>
        </div>
      )}
    </div>
  );
}

function BadgePill({ result, compact = false }: { result: DeliveryResult; compact?: boolean }) {
  const Icon =
    result.badge === "green" ? Zap :
    result.badge === "blue" ? Truck :
    result.badge === "vip" ? Crown :
    result.serviceable ? CheckCircle2 : XCircle;

  const styles =
    result.badge === "green"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
      : result.badge === "blue"
        ? "bg-sky-500/15 text-sky-300 border-sky-500/40"
        : result.badge === "vip"
          ? "bg-gold-gradient text-[color:var(--noir)] border-transparent"
          : "bg-[color:var(--muted)] text-[color:var(--muted-foreground)] border-[color:var(--border)]";

  return (
    <span className={`inline-flex items-center gap-1.5 border rounded-full ${styles} ${compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"} tracking-wider uppercase font-semibold`}>
      <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {result.eta}
      {result.tier === "prestige" && result.serviceable && result.badge === "vip" && (
        <span className="ml-1 opacity-90">· VIP</span>
      )}
    </span>
  );
}
