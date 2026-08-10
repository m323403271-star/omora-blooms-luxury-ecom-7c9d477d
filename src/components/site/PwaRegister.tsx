import { useEffect } from "react";

/** Registers the offline-shell service worker after hydration. */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (import.meta.env.DEV) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // registration is best-effort
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
