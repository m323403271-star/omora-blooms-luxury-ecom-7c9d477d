/** Server-only coupon validation. Never trust a client-sent discount. */

export type CouponResult =
  | { valid: true; code: string; discount: number; label: string }
  | { valid: false; reason: string };

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function validateCoupon(rawCode: string, amount: number): Promise<CouponResult> {
  const code = String(rawCode || "").trim().toUpperCase().slice(0, 40);
  if (!code) return { valid: false, reason: "Enter a coupon code" };
  if (!Number.isFinite(amount) || amount <= 0) return { valid: false, reason: "Invalid order amount" };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("coupons")
    .select("code, discount_type, discount_value, min_order_value, max_uses, used_count, active, expires_at")
    .eq("code", code)
    .maybeSingle();

  if (error) return { valid: false, reason: "Could not check that code" };
  if (!data || !data.active) return { valid: false, reason: "This coupon is not valid" };
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    return { valid: false, reason: "This coupon has expired" };
  }
  if (data.max_uses !== null && Number(data.used_count) >= Number(data.max_uses)) {
    return { valid: false, reason: "This coupon has been fully redeemed" };
  }
  if (amount < Number(data.min_order_value)) {
    return { valid: false, reason: `Valid on orders above ₹${Number(data.min_order_value).toLocaleString("en-IN")}` };
  }

  const value = Number(data.discount_value);
  const raw = data.discount_type === "percent" ? (amount * value) / 100 : value;
  const discount = round2(Math.max(0, Math.min(raw, amount)));
  if (discount <= 0) return { valid: false, reason: "This coupon is not valid" };

  return {
    valid: true,
    code: data.code,
    discount,
    label: data.discount_type === "percent" ? `${value}% off` : `₹${value.toLocaleString("en-IN")} off`,
  };
}

/** Best-effort redemption counter, called once a payment is confirmed. */
export async function markCouponRedeemed(code: string | null | undefined): Promise<void> {
  if (!code) return;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("coupons")
      .select("id, used_count")
      .eq("code", code)
      .maybeSingle();
    if (!data) return;
    await supabaseAdmin
      .from("coupons")
      .update({ used_count: Number(data.used_count) + 1 })
      .eq("id", data.id);
  } catch (e) {
    console.error("Coupon redeem failed", e);
  }
}
