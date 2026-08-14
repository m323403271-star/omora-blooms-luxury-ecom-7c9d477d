/**
 * Payment options — pure, dependency-free rules shared by client and server.
 *
 * Full payment online: 5% off the order.
 * Advance booking: pay 30% now, balance on dispatch.
 *
 * Self-contained on purpose: this module can be copied into another project
 * without pulling in UI, data or styling dependencies.
 */

export const FULL_PAYMENT_DISCOUNT_RATE = 0.05;
export const ADVANCE_PAYMENT_RATE = 0.3;

export type PaymentMode = "full" | "advance";

export interface PaymentOption {
  mode: PaymentMode;
  title: string;
  badge: string | null;
  description: string;
}

export const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    mode: "full",
    title: "Pay Full Amount Online",
    badge: "5% OFF",
    description: "Settle the whole order now and save 5% instantly.",
  },
  {
    mode: "advance",
    title: "Advance Booking (Pay 30%)",
    badge: null,
    description: "Reserve your bouquet with 30% now, pay the rest on dispatch.",
  },
];

export interface PaymentBreakdown {
  /** Order value before any payment-mode adjustment. */
  subtotalInr: number;
  /** Discount granted by the chosen payment mode. */
  modeDiscountInr: number;
  /** Order total after the payment-mode discount. */
  totalInr: number;
  /** Amount charged right now. */
  dueNowInr: number;
  /** Amount payable later (advance booking only). */
  balanceInr: number;
}

export function computePayment(subtotalInr: number, mode: PaymentMode): PaymentBreakdown {
  const subtotal = Math.max(0, Math.round(subtotalInr));

  if (mode === "full") {
    const modeDiscount = Math.round(subtotal * FULL_PAYMENT_DISCOUNT_RATE);
    const total = subtotal - modeDiscount;
    return {
      subtotalInr: subtotal,
      modeDiscountInr: modeDiscount,
      totalInr: total,
      dueNowInr: total,
      balanceInr: 0,
    };
  }

  const dueNow = Math.round(subtotal * ADVANCE_PAYMENT_RATE);
  return {
    subtotalInr: subtotal,
    modeDiscountInr: 0,
    totalInr: subtotal,
    dueNowInr: dueNow,
    balanceInr: subtotal - dueNow,
  };
}

export function paymentModeLabel(mode: PaymentMode): string {
  return PAYMENT_OPTIONS.find((option) => option.mode === mode)?.title ?? "Payment";
}
