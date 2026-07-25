import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

export const Route = createFileRoute("/api/razorpay/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) {
          return Response.json({ error: "Razorpay not configured" }, { status: 500 });
        }

        let body: {
          razorpay_order_id?: string;
          razorpay_payment_id?: string;
          razorpay_signature?: string;
          ref?: string | null;
          items?: Array<{ id: string; quantity: number }>;
        };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
          return Response.json({ error: "Missing fields" }, { status: 400 });
        }

        const expected = createHmac("sha256", keySecret)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest("hex");
        const a = Buffer.from(expected);
        const b = Buffer.from(razorpay_signature);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          try {
            await supabaseAdmin.from("payments").update({
              razorpay_payment_id,
              status: "failed",
              error_message: "Invalid signature",
            }).eq("razorpay_order_id", razorpay_order_id);
          } catch (e) { console.error("Payment status update failed", e); }
          return Response.json({ ok: false, error: "Invalid signature" }, { status: 400 });
        }

        // Log referred order if applicable (trusted server call recomputes totals)
        if (body.ref && Array.isArray(body.items) && body.items.length > 0) {
          try {
            await supabaseAdmin.rpc("log_referred_order", {
              _partner_code: body.ref,
              _items: body.items.map((i) => ({ id: i.id, quantity: i.quantity })) as never,
            });
          } catch (e) {
            console.error("Referral log failed", e);
          }
        }

        try {
          await supabaseAdmin.from("payments").update({
            razorpay_payment_id,
            status: "paid",
            error_message: null,
          }).eq("razorpay_order_id", razorpay_order_id);
        } catch (e) { console.error("Payment status update failed", e); }

        return Response.json({ ok: true, paymentId: razorpay_payment_id });
      },
    },
  },
});
