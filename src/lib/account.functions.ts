import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
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

/** Orders belonging to the signed-in shopper, with email matching only after mailbox verification. */
export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccountOrder[]> => {
    const authorization = getRequestHeader("authorization");
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
    const { data: authData } = token ? await context.supabase.auth.getUser(token) : { data: { user: null } };
    const verifiedEmail = authData.user?.email_confirmed_at
      ? authData.user.email?.trim().toLowerCase() ?? null
      : null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("payments")
      .select(
        "razorpay_order_id, status, amount, order_total, balance_due, currency, payment_mode, items, created_at",
      );
    query = verifiedEmail
      ? query.or(`user_id.eq.${context.userId},customer_email.eq.${verifiedEmail}`)
      : query.eq("user_id", context.userId);
    const { data, error } = await query.order("created_at", { ascending: false }).limit(50);

    if (error) throw new Error("Could not load your orders");
    return (data ?? []) as AccountOrder[];
  });
