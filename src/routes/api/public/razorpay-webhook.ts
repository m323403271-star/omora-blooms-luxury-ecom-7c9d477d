import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay webhook receiver.
 * Configure in Razorpay Dashboard → Settings → Webhooks:
 *   URL:    https://<your-domain>/api/public/razorpay-webhook
 *   Events: payment.captured, payment.authorized, payment.failed, order.paid
 *   Secret: value stored as RAZORPAY_WEBHOOK_SECRET
 */
export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
          return new Response("Webhook not configured", { status: 500 });
        }

        const signature = request.headers.get("x-razorpay-signature");
        const rawBody = await request.text();
        if (!signature) {
          return new Response("Missing signature", { status: 401 });
        }

        const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
        const a = Buffer.from(expected);
        const b = Buffer.from(signature);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: any;
        try {
          payload = JSON.parse(rawBody);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const event: string = payload?.event ?? "";
        const paymentEntity = payload?.payload?.payment?.entity;
        const orderEntity = payload?.payload?.order?.entity;
        const orderId: string | undefined = paymentEntity?.order_id ?? orderEntity?.id;
        const paymentId: string | undefined = paymentEntity?.id;

        if (!orderId) {
          return Response.json({ ok: true, skipped: "no order id" });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Load current row so we don't overwrite a terminal state with a stale event
        const { data: existing } = await supabaseAdmin
          .from("payments")
          .select("id, status, ref_code, items")
          .eq("razorpay_order_id", orderId)
          .maybeSingle();

        if (!existing) {
          console.warn("Webhook for unknown order", orderId, event);
          return Response.json({ ok: true, skipped: "unknown order" });
        }

        // Never downgrade a paid row
        if (existing.status === "paid" && event !== "payment.failed") {
          return Response.json({ ok: true, skipped: "already paid" });
        }

        let nextStatus: string | null = null;
        let errorMessage: string | null = null;

        switch (event) {
          case "payment.captured":
          case "order.paid":
            nextStatus = "paid";
            break;
          case "payment.authorized":
            if (existing.status !== "paid") nextStatus = "pending";
            break;
          case "payment.failed":
            if (existing.status !== "paid") {
              nextStatus = "failed";
              errorMessage =
                paymentEntity?.error_description ??
                paymentEntity?.error_reason ??
                "Payment failed";
            }
            break;
          default:
            return Response.json({ ok: true, skipped: `unhandled ${event}` });
        }

        if (!nextStatus) {
          return Response.json({ ok: true });
        }

        const update: Record<string, unknown> = { status: nextStatus };
        if (paymentId) update.razorpay_payment_id = paymentId;
        if (errorMessage !== null) update.error_message = errorMessage;
        if (nextStatus === "paid") update.error_message = null;

        const { error: updateError } = await supabaseAdmin
          .from("payments")
          .update(update)
          .eq("razorpay_order_id", orderId);

        if (updateError) {
          console.error("Webhook payment update failed", updateError);
          return new Response("DB update failed", { status: 500 });
        }

        // If newly paid via webhook (tab closed before /verify ran), log referral
        if (
          nextStatus === "paid" &&
          existing.status !== "paid" &&
          existing.ref_code &&
          Array.isArray(existing.items) &&
          (existing.items as unknown[]).length > 0
        ) {
          try {
            await supabaseAdmin.rpc("log_referred_order", {
              _partner_code: existing.ref_code as string,
              _items: (existing.items as Array<{ id: string; quantity: number }>).map(
                (i) => ({ id: i.id, quantity: i.quantity }),
              ) as never,
            });
          } catch (e) {
            console.error("Webhook referral log failed", e);
          }
        }

        return Response.json({ ok: true, status: nextStatus });
      },
    },
  },
});
