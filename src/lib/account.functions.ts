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

/** Orders belonging to the signed-in shopper, with verified mailbox matching when available. */
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

    const userOrdersResult = await supabaseAdmin
      .from("payments")
      .select(
        "razorpay_order_id, status, amount, order_total, balance_due, currency, payment_mode, items, created_at",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (userOrdersResult.error) throw new Error("Could not load your orders");

    const emailOrdersResult = verifiedEmail
      ? await supabaseAdmin
          .from("payments")
          .select(
            "razorpay_order_id, status, amount, order_total, balance_due, currency, payment_mode, items, created_at",
          )
          .eq("customer_email", verifiedEmail)
          .order("created_at", { ascending: false })
          .limit(50)
      : null;
    if (emailOrdersResult?.error) throw new Error("Could not load your orders");

    const ordersById = new Map<string, AccountOrder>();
    for (const order of [...(userOrdersResult.data ?? []), ...(emailOrdersResult?.data ?? [])]) {
      ordersById.set(order.razorpay_order_id, order as AccountOrder);
    }
    return [...ordersById.values()]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 50);
  });
