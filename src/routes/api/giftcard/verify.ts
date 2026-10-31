import { createFileRoute } from "@tanstack/react-router";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const VOUCHER_PREFIX = "BLOOM";
const VOUCHER_VALUE = 100; // flat ₹100 off — edit here to change the voucher value
const VOUCHER_VALID_DAYS = 90;
const VOUCHER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I

function newVoucherCode(): string {
  const bytes = randomBytes(8);
  let code = VOUCHER_PREFIX;
  for (const b of bytes) code += VOUCHER_ALPHABET[b % VOUCHER_ALPHABET.length];
  return code;
}

/** Verifies a paid ₹1 gift-card payment and issues the one-time discount voucher. */
export const Route = createFileRoute("/api/giftcard/verify")({
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
        };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
        if (
          typeof razorpay_order_id !== "string" ||
          typeof razorpay_payment_id !== "string" ||
          typeof razorpay_signature !== "string"
        ) {
          return Response.json({ error: "Missing payment details" }, { status: 400 });
        }

        // Verify Razorpay's HMAC signature — proves the payment is genuine.
        const expected = createHmac("sha256", keySecret)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest("hex");
        const sigA = Buffer.from(razorpay_signature, "hex");
        const sigB = Buffer.from(expected, "hex");
        if (sigA.length !== sigB.length || !timingSafeEqual(sigA, sigB)) {
          return Response.json({ error: "Payment verification failed" }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: lead } = await supabaseAdmin
          .from("gift_card_leads")
          .select("id, status, voucher_code")
          .eq("razorpay_order_id", razorpay_order_id)
          .maybeSingle();

        if (!lead) {
          return Response.json({ error: "Gift card request not found" }, { status: 404 });
        }

        // Idempotent: a retried verification returns the already-issued voucher.
        if (lead.status === "paid" && lead.voucher_code) {
          return Response.json({ ok: true, voucherCode: lead.voucher_code });
        }

        // Create the redeemable coupon (retry on the rare code collision).
        let voucherCode: string | null = null;
        for (let attempt = 0; attempt < 5 && !voucherCode; attempt++) {
          const code = newVoucherCode();
          const expiresAt = new Date(Date.now() + VOUCHER_VALID_DAYS * 24 * 60 * 60 * 1000).toISOString();
          const { data, error } = await supabaseAdmin
            .from("coupons")
            .insert({
              code,
              discount_type: "flat",
              discount_value: VOUCHER_VALUE,
              min_order_value: 0,
              max_uses: 1,
              active: true,
              expires_at: expiresAt,
            } as never)
            .select("code")
            .maybeSingle();
          if (!error && data) voucherCode = (data as { code: string }).code;
        }

        if (!voucherCode) {
          console.error("Gift card voucher creation failed for order", razorpay_order_id);
          return Response.json(
            { error: "Payment received but the voucher could not be issued. Please contact us." },
            { status: 502 },
          );
        }

        await supabaseAdmin
          .from("gift_card_leads")
          .update({
            status: "paid",
            razorpay_payment_id: razorpay_payment_id,
            voucher_code: voucherCode,
          })
          .eq("id", (lead as { id: string }).id);

        return Response.json({ ok: true, voucherCode });
      },
    },
  },
});
