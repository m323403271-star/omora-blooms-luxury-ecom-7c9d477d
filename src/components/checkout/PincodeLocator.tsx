import { useState } from "react";
import { lookupPincode } from "./sampleCheckout";
import type { PincodeResult } from "./types";

interface PincodeLocatorProps {
  value: string;
  onChange: (pincode: string) => void;
  onResolved?: (result: PincodeResult) => void;
}

export function PincodeLocator({ value, onChange, onResolved }: PincodeLocatorProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [result, setResult] = useState<PincodeResult | null>(null);
  const [detecting, setDetecting] = useState(false);

  async function check(pincode: string) {
    if (!/^\d{6}$/.test(pincode)) return;
    setStatus("loading");
    const res = await lookupPincode(pincode);
    setResult(res);
    setStatus("done");
    onResolved?.(res);
  }

  function detect() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setDetecting(false);
        onChange("560038");
        void check("560038");
      },
      () => setDetecting(false),
      { timeout: 8000 },
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          inputMode="numeric"
          maxLength={6}
          value={value}
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, "").slice(0, 6);
            onChange(next);
            setStatus("idle");
            setResult(null);
          }}
          placeholder="Enter 6-digit PIN code"
          aria-label="PIN code"
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 sm:max-w-[220px]"
        />
        <button
          type="button"
          onClick={() => void check(value)}
          disabled={value.length !== 6 || status === "loading"}
          className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "loading" ? "Checking…" : "Check"}
        </button>
        <button
          type="button"
          onClick={detect}
          className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
        >
          {detecting ? "Detecting…" : "Detect my location"}
        </button>
      </div>

      {result ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            result.serviceable
              ? "bg-emerald-50 text-emerald-800"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          {result.serviceable
            ? `Delivering to ${result.city}, ${result.state} · ${result.etaLabel}`
            : `We don't deliver to ${result.pincode} yet. Try a pickup point below.`}
        </p>
      ) : null}
    </div>
  );
}
