import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/razorpay/status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { orderId?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const orderId = body.orderId?.trim();
        if (!orderId) return Response.json({ error: "Missing orderId" }, { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("payments")
          .select("razorpay_order_id, razorpay_payment_id, amount, currency, status, items, error_message, delivery_notes, created_at, updated_at")
          .eq("razorpay_order_id", orderId)
          .maybeSingle();

        if (error) return Response.json({ error: "Lookup failed" }, { status: 500 });
        if (!data) return Response.json({ error: "Not found" }, { status: 404 });
        return Response.json(data);
      },
    },
  },
});
