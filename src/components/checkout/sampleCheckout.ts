import type { OrderLine, OrderTotals, PaymentOption, PickupPoint, PincodeResult } from "./types";

export const sampleOrderLines: OrderLine[] = [
  {
    id: "line-1",
    name: "Blush Peony Bouquet",
    variant: "Medium · 12 stems",
    quantity: 1,
    unitPrice: 1899,
  },
  {
    id: "line-2",
    name: "Signature Gift Packaging",
    variant: "Kraft box + ribbon",
    quantity: 1,
    unitPrice: 249,
  },
];

export const sampleTotals: OrderTotals = {
  currency: "INR",
  subtotal: 2148,
  shipping: 99,
  discount: 200,
  tax: 108,
  total: 2155,
};

export const samplePickupPoints: PickupPoint[] = [
  {
    id: "pp-1",
    name: "Omora Blooms Studio — Indiranagar",
    addressLine: "212, 12th Main Rd, Indiranagar",
    distanceLabel: "1.4 km away",
    timingsLabel: "Open 9:00 AM – 8:00 PM",
  },
  {
    id: "pp-2",
    name: "Omora Pickup Counter — Koramangala",
    addressLine: "5th Block, 80 Feet Rd, Koramangala",
    distanceLabel: "3.8 km away",
    timingsLabel: "Open 10:00 AM – 9:00 PM",
  },
  {
    id: "pp-3",
    name: "Partner Hub — MG Road Metro",
    addressLine: "Gate 2, MG Road Metro Station",
    distanceLabel: "6.1 km away",
    timingsLabel: "Open 8:00 AM – 10:00 PM",
  },
];

export const samplePaymentOptions: PaymentOption[] = [
  { id: "upi", label: "UPI", description: "Google Pay, PhonePe, Paytm & more", badge: "Instant" },
  { id: "card", label: "Credit / Debit card", description: "Visa, Mastercard, RuPay, Amex" },
  { id: "netbanking", label: "Net banking", description: "All major Indian banks" },
  { id: "cod", label: "Cash on delivery", description: "Pay when your order arrives" },
];

/** Mock pincode lookup — replace with a real API in the host project. */
export async function lookupPincode(pincode: string): Promise<PincodeResult> {
  await new Promise((r) => setTimeout(r, 550));
  const serviceable = /^[1-9]\d{5}$/.test(pincode);
  return {
    pincode,
    city: serviceable ? "Bengaluru" : "—",
    state: serviceable ? "Karnataka" : "—",
    etaLabel: serviceable ? "Delivery in 2–3 days" : "Not serviceable yet",
    serviceable,
  };
}
