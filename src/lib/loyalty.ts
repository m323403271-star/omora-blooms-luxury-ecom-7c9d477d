/**
 * Blooms Rewards — pure loyalty rules shared by server and client.
 *
 * Earning: 1 point per ₹100 actually paid (after any discount).
 * Redeeming: fixed tiers converted into a one-time discount code.
 */

export const INR_PER_POINT = 100;

export interface RedemptionTier {
  points: number;
  discountInr: number;
  label: string;
}

export const REDEMPTION_TIERS: RedemptionTier[] = [
  { points: 100, discountInr: 500, label: "₹500 off" },
  { points: 250, discountInr: 1500, label: "₹1,500 off" },
  { points: 500, discountInr: 3500, label: "₹3,500 off" },
];

export function pointsForSpend(amountInr: number): number {
  if (!Number.isFinite(amountInr) || amountInr <= 0) return 0;
  return Math.floor(amountInr / INR_PER_POINT);
}

export function tierForPoints(points: number): RedemptionTier | undefined {
  return REDEMPTION_TIERS.find((tier) => tier.points === points);
}

export function nextTier(balance: number): RedemptionTier | undefined {
  return REDEMPTION_TIERS.find((tier) => tier.points > balance);
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
