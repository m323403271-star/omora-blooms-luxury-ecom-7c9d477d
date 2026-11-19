import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AccountOrder = {
  razorpay_order_id: string;
  status: string;
  amount: number;
  order_total: number | null;
  balance_due: number;
  currency: string;
  payment_mode: string;
  items: Array<{ name?: string; image?: string | null; quantity?: number; price?: number }>;
  created_at: string;
};

/** Orders explicitly linked to the signed-in shopper's account. */
export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccountOrder[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("payments")
      .select(
        "razorpay_order_id, status, amount, order_total, balance_due, currency, payment_mode, items, created_at",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error("Could not load your orders");
    return (data ?? []) as AccountOrder[];
  });
