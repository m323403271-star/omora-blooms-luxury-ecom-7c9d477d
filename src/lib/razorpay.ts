import { toast } from "sonner";
import { getStoredRef } from "@/lib/referral";
import type { CartItem } from "@/lib/cart";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
  }
}

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  image?: string;
  theme?: { color?: string };
  prefill?: { name?: string; email?: string; contact?: string };
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
};

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export type CheckoutMeta = {
  pincode?: string | null;
  customerTier?: "regular" | "prestige" | null;
  pickupPointId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
};

export async function startRazorpayCheckout(
  items: CartItem[],
  onSuccess: (orderId: string) => void,
  meta: CheckoutMeta = {},
): Promise<void> {
  if (items.length === 0) return;
  const ref = getStoredRef();

  const ok = await loadScript();
  if (!ok) {
    toast.error("Could not load Razorpay. Check your connection.");
    return;
  }

  let orderRes: Response;
  try {
    orderRes = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
        ref,
        meta,
      }),
    });

  } catch {
    toast.error("Network error starting payment");
    return;
  }
  if (!orderRes.ok) {
    toast.error("Could not start payment");
    return;
  }
  const order = (await orderRes.json()) as {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
  };

  const markStatus = (status: "failed" | "cancelled" | "pending", err?: string) => {
    fetch("/api/razorpay/mark-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.orderId, status, error: err }),
      keepalive: true,
    }).catch(() => {});
  };

  const rzp = new window.Razorpay!({
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    order_id: order.orderId,
    name: "OMORA BLOOMS",
    description: "Luxury handmade order",
    theme: { color: "#C8A24A" },
    handler: async (response) => {
      try {
        const verifyRes = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...response,
            ref,
            items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
          }),
        });
        const data = (await verifyRes.json()) as { ok?: boolean };
        if (data.ok) {
          toast.success("Payment successful! Our concierge will confirm shortly.");
          onSuccess(order.orderId);
        } else {
          toast.error("Payment verification failed. Please contact us.");
        }
      } catch {
        toast.error("Could not verify payment. Please contact us.");
      }
    },
    modal: {
      ondismiss: () => {
        toast.message("Payment cancelled");
        markStatus("cancelled", "User dismissed checkout");
      },
    },
  });
  rzp.on("payment.failed", (resp: unknown) => {
    const r = resp as { error?: { description?: string; reason?: string } };
    const desc = r?.error?.description || r?.error?.reason || "Payment failed";
    toast.error(desc);
    markStatus("failed", desc);
  });
  rzp.open();
}
