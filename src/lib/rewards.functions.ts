import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { pointsForSpend, tierForPoints } from "@/lib/loyalty";

export interface LedgerEntry {
  id: string;
  delta: number;
  reason: string;
  created_at: string;
}

export interface RewardCode {
  id: string;
  code: string;
  points_cost: number;
  discount_inr: number;
  status: string;
  expires_at: string;
}

export interface RewardsOverview {
  balance: number;
  lifetimeEarned: number;
  ledger: LedgerEntry[];
  codes: RewardCode[];
}

/**
 * Awards missing points for the caller's paid orders. Runs with the service role
 * because the ledger is deliberately write-locked for every client role — the
 * caller's identity comes from the verified bearer token, never from input.
 */
async function syncEarnedPoints(userId: string, email: string | null) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const filters = [`user_id.eq.${userId}`];
  if (email) filters.push(`customer_email.eq.${email}`);

  const { data: paidOrders } = await supabaseAdmin
    .from("payments")
    .select("id, amount, created_at")
    .eq("status", "paid")
    .or(filters.join(","))
    .order("created_at", { ascending: false })
    .limit(100);

  if (!paidOrders?.length) return;

  const { data: existing } = await supabaseAdmin
    .from("loyalty_ledger")
    .select("payment_id")
    .eq("user_id", userId)
    .gt("delta", 0);

  const credited = new Set((existing ?? []).map((r) => r.payment_id));
  const rows = paidOrders
    .filter((o) => !credited.has(o.id) && pointsForSpend(Number(o.amount)) > 0)
    .map((o) => ({
      user_id: userId,
      delta: pointsForSpend(Number(o.amount)),
      reason: "Order paid",
      payment_id: o.id,
    }));

  if (rows.length) {
    await supabaseAdmin.from("loyalty_ledger").insert(rows);
  }
}

/** Balance, ledger and active reward codes for the signed-in shopper. */
export const getRewardsOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RewardsOverview> => {
    const email = (context.claims as { email?: string }).email?.toLowerCase() ?? null;
    try {
      await syncEarnedPoints(context.userId, email);
    } catch (e) {
      console.error("Loyalty sync failed", e);
    }

    const [ledgerRes, codesRes] = await Promise.all([
      context.supabase
        .from("loyalty_ledger")
        .select("id, delta, reason, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      context.supabase
        .from("reward_codes")
        .select("id, code, points_cost, discount_inr, status, expires_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (ledgerRes.error) throw new Error("Could not load your rewards");
    if (codesRes.error) throw new Error("Could not load your rewards");

    const ledger = ledgerRes.data ?? [];
    return {
      balance: ledger.reduce((sum, row) => sum + row.delta, 0),
      lifetimeEarned: ledger.filter((r) => r.delta > 0).reduce((s, r) => s + r.delta, 0),
      ledger,
      codes: (codesRes.data ?? []).map((c) => ({ ...c, discount_inr: Number(c.discount_inr) })),
    };
  });

function makeCode(): string {
  const raw = crypto.randomUUID().replace(/-/g, "").toUpperCase();
  return `BLOOM${raw.slice(0, 6)}`;
}

/** Spends points from the caller's balance and issues a one-time discount code. */
export const redeemPoints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { points: number }) => ({ points: Number(input.points) }))
  .handler(async ({ data, context }): Promise<{ code: string; discountInr: number }> => {
    const tier = tierForPoints(data.points);
    if (!tier) throw new Error("Invalid redemption tier");

    // Balance is recomputed server-side from the ledger — never trusted from the client.
    const { data: ledger, error } = await context.supabase.from("loyalty_ledger").select("delta");
    if (error) throw new Error("Could not read your points balance");
    const balance = (ledger ?? []).reduce((sum, r) => sum + r.delta, 0);
    if (balance < tier.points) throw new Error("Not enough points");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = makeCode();

    const { error: codeError } = await supabaseAdmin.from("reward_codes").insert({
      user_id: context.userId,
      code,
      points_cost: tier.points,
      discount_inr: tier.discountInr,
    });
    if (codeError) throw new Error("Could not issue your reward code");

    await supabaseAdmin.from("loyalty_ledger").insert({
      user_id: context.userId,
      delta: -tier.points,
      reason: `Redeemed ${tier.label}`,
    });

    // Mirror the reward as a single-use coupon so checkout can accept it.
    await supabaseAdmin.from("coupons").insert({
      code,
      discount_type: "flat",
      discount_value: tier.discountInr,
      max_uses: 1,
      active: true,
    });

    return { code, discountInr: tier.discountInr };
  });

/**
 * Checkout redemption: converts a chosen number of points into a single-use
 * discount code (1 point = ₹5, in blocks of 10, minimum 20 points).
 * The balance is always recomputed server-side.
 */
export const redeemPointsForCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { points: number }) => ({ points: Math.floor(Number(input.points) || 0) }))
  .handler(async ({ data, context }): Promise<{ code: string; discountInr: number; points: number }> => {
    const points = data.points;
    if (points < 20 || points % 10 !== 0) throw new Error("Redeem in blocks of 10 points (minimum 20)");

    const { data: ledger, error } = await context.supabase.from("loyalty_ledger").select("delta");
    if (error) throw new Error("Could not read your points balance");
    const balance = (ledger ?? []).reduce((sum, r) => sum + r.delta, 0);
    if (balance < points) throw new Error("Not enough points");

    const discountInr = points * 5;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = makeCode();

    const { error: codeError } = await supabaseAdmin.from("reward_codes").insert({
      user_id: context.userId,
      code,
      points_cost: points,
      discount_inr: discountInr,
    });
    if (codeError) throw new Error("Could not apply your points");

    await supabaseAdmin.from("loyalty_ledger").insert({
      user_id: context.userId,
      delta: -points,
      reason: `Redeemed ${points} points at checkout`,
    });

    await supabaseAdmin.from("coupons").insert({
      code,
      discount_type: "flat",
      discount_value: discountInr,
      max_uses: 1,
      active: true,
    });

    return { code, discountInr, points };
  });
