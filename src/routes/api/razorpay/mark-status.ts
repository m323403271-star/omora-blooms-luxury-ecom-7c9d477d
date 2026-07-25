import { createFileRoute } from "@tanstack/react-router";

const ALLOWED = new Set(["failed", "cancelled", "pending"]);

export const Route = createFileRoute("/api/razorpay/mark-status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { orderId?: string; status?: string; error?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const { orderId, status, error } = body;
        if (!orderId || !status || !ALLOWED.has(status)) {
          return Response.json({ error: "Invalid input" }, { status: 400 });
        }
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          // Only overwrite if still in a non-terminal state (never overwrite "paid")
          await supabaseAdmin
            .from("payments")
            .update({ status, error_message: error ?? null })
            .eq("razorpay_order_id", orderId)
            .in("status", ["created", "pending"]);
        } catch (e) {
          console.error("mark-status failed", e);
          return Response.json({ ok: false }, { status: 500 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
