import { useEffect, useState } from "react";
import { LOGO_SRC } from "@/lib/logo";

const SESSION_KEY = "omora-intro-shown";

/**
 * Luxury intro splash — logo reveal on matte black, shown once per browser session.
 * Renders only after hydration so SSR markup stays stable.
 */
export function IntroSplash() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let seen = true;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      seen = true;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduced) return;

    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(true);
    document.body.style.overflow = "hidden";

    const fadeAt = window.setTimeout(() => setFading(true), 1600);
    const hideAt = window.setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = "";
    }, 2300);

    return () => {
      window.clearTimeout(fadeAt);
      window.clearTimeout(hideAt);
      document.body.style.overflow = "";
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] grid place-items-center bg-[color:var(--noir)] transition-opacity duration-700 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-5 animate-[omora-intro-in_900ms_ease-out_both]">
        <img
          src={LOGO_SRC}
          alt=""
          className="h-24 w-24 rounded-full object-cover border border-[color:var(--gold)]/60 shadow-[0_0_40px_-8px_var(--gold)]"
        />
        <p className="eyebrow text-[color:var(--gold)]">Crafted to last forever</p>
        <span className="block h-px w-24 bg-gradient-to-r from-transparent via-[color:var(--gold)] to-transparent" />
      </div>
    </div>
  );
}
