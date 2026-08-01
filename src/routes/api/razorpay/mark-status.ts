import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

const ALLOWED = new Set(["failed", "cancelled", "pending"]);

export const Route = createFileRoute("/api/razorpay/mark-status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) {
          return Response.json({ error: "Razorpay not configured" }, { status: 500 });
        }

        let body: { orderId?: string; status?: string; error?: string; orderToken?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const { orderId, status, error, orderToken } = body;
        if (!orderId || !status || !ALLOWED.has(status)) {
          return Response.json({ error: "Invalid input" }, { status: 400 });
        }

        // Capability check: only the browser that created this order holds the token.
        const expected = createHmac("sha256", keySecret).update(`mark-status:${orderId}`).digest("hex");
        const a = Buffer.from(expected);
        const b = Buffer.from(typeof orderToken === "string" ? orderToken : "");
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
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
