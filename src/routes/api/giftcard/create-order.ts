import { createFileRoute } from "@tanstack/react-router";
import {
  isLocalPaymentOrigin,
  isProductionPaymentOrigin,
  livePaymentUrl,
  paymentOriginFromRequest,
} from "@/lib/payment-origin";

/**
 * Creates the ₹1 Razorpay order for the Digital Gift Card & Discount Voucher.
 * The requester's name + WhatsApp number are stored so the owner can see every
 * request, paid or abandoned. Amount is fixed server-side (100 paise) — the
 * client cannot change it.
 */
export const Route = createFileRoute("/api/giftcard/create-order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret) {
          return Response.json({ error: "Razorpay not configured" }, { status: 500 });
        }

        let body: { name?: string; whatsapp?: string; checkoutOrigin?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const requestOrigin = paymentOriginFromRequest(request);
        const originMatches = body.checkoutOrigin === requestOrigin;
        if (
          !originMatches ||
          (!isProductionPaymentOrigin(requestOrigin) && !isLocalPaymentOrigin(requestOrigin))
        ) {
          return Response.json(
            {
              error: "Payment is available only on the official OMORA BLOOMS website.",
              code: "payment_domain_mismatch",
              liveUrl: livePaymentUrl("/"),
            },
            { status: 409 },
          );
        }

        const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ").slice(0, 80) : "";
        const whatsapp = typeof body.whatsapp === "string" ? body.whatsapp.replace(/\D/g, "").slice(0, 13) : "";
        if (name.length < 2) {
          return Response.json({ error: "Please enter your name" }, { status: 400 });
        }
        if (whatsapp.length < 10 || whatsapp.length > 13) {
          return Response.json({ error: "Enter a valid WhatsApp number" }, { status: 400 });
        }

        const receipt = `omora_gift_${Date.now().toString(36)}`;
        const auth = btoa(`${keyId}:${keySecret}`);
        const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify({
            amount: 100, // exactly ₹1, never client-controlled
            currency: "INR",
            receipt,
            notes: {
              gift_card: "digital_gift_card_voucher",
              customer_name: name,
              customer_whatsapp: whatsapp,
              website: requestOrigin ?? "",
            },
          }),
        });

        if (!rzpRes.ok) {
          const txt = await rzpRes.text();
          console.error("Gift card order create failed", rzpRes.status, txt);
          return Response.json({ error: "Could not start payment" }, { status: 502 });
        }

        const order = (await rzpRes.json()) as { id: string; amount: number; currency: string };

        // Best-effort lead record so the owner sees every request.
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("gift_card_leads").insert({
            name,
            whatsapp,
            status: "created",
            razorpay_order_id: order.id,
          } as never);
        } catch (e) {
          console.error("Gift card lead insert failed", e);
        }

        return Response.json({
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId,
        });
      },
    },
  },
});
