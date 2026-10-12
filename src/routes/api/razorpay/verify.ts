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
          // Unverified callers must not change stored order state.
          return Response.json({ ok: false, error: "Invalid signature" }, { status: 400 });
        }

        try {
          const { data: paid, error: paidError } = await supabaseAdmin
            .from("payments")
            .update({ razorpay_payment_id, status: "paid", error_message: null })
            .eq("razorpay_order_id", razorpay_order_id)
            .neq("status", "paid")
            .select("id, coupon_code, ref_code, items, customer_name, customer_phone, pincode, order_total, amount, priority")
            .maybeSingle();

          if (paidError) throw paidError;

          // Redeem the coupon and draw down shade stock once payment is confirmed.
          if (paid) {
            // Commission input comes only from this order's persisted checkout data,
            // never from fields the payment-verification caller can alter.
            const refCode = typeof paid.ref_code === "string" ? paid.ref_code : null;
            const persistedItems = Array.isArray(paid.items)
              ? paid.items as Array<{ id?: unknown; variant_slug?: unknown; quantity?: unknown }>
              : [];
            const variantSlugs = [...new Set(persistedItems
              .map((item) => typeof item.variant_slug === "string" ? item.variant_slug : null)
              .filter((slug): slug is string => Boolean(slug)))];
            const variantProductIds = new Map<string, string>();
            if (variantSlugs.length) {
              const { data: variantRows } = await supabaseAdmin
                .from("product_variants")
                .select("slug, product_id")
                .in("slug", variantSlugs);
              for (const row of variantRows ?? []) variantProductIds.set(row.slug, row.product_id);
            }
            const referralItems = persistedItems.flatMap((item) => {
              const id = typeof item.id === "string" && /^[0-9a-f-]{36}$/i.test(item.id)
                ? item.id
                : typeof item.variant_slug === "string" ? variantProductIds.get(item.variant_slug) : undefined;
              return id ? [{
                id,
                quantity: Math.max(1, Math.min(100, Math.floor(Number(item.quantity) || 1))),
              }] : [];
            });
            if (refCode && referralItems.length) {
              const { error: referralError } = await supabaseAdmin.rpc("log_referred_order", {
                _partner_code: refCode,
                _items: referralItems as never,
              });
              if (referralError) console.error("Referral log failed", referralError.message);
            }

            const { markCouponRedeemed } = await import("@/lib/coupon.server");
            await markCouponRedeemed((paid as { coupon_code: string | null }).coupon_code);

            const lines = Array.isArray((paid as { items?: unknown }).items)
              ? ((paid as { items: Array<{ id?: string; quantity?: number }> }).items)
              : [];
            for (const line of lines) {
              if (!line?.id) continue;
              const { data: v } = await supabaseAdmin
                .from("product_variants")
                .select("id, stock, track_stock")
                .eq("slug", String(line.id))
                .maybeSingle();
              if (v && (v as { track_stock: boolean }).track_stock) {
                const left = Math.max(0, Number((v as { stock: number }).stock) - (Number(line.quantity) || 1));
                await supabaseAdmin.from("product_variants").update({ stock: left }).eq("id", (v as { id: string }).id);
              }
            }
          }
        } catch (e) { console.error("Payment status update failed", e); }

        // Fire the high-priority alert fan-out (siren + push + SMS/WhatsApp/email).
        try {
          const { data: row } = await supabaseAdmin
            .from("payments")
            .select("id, items, customer_name, customer_phone, pincode, order_total, amount, priority")
            .eq("razorpay_order_id", razorpay_order_id)
            .maybeSingle();
          if (row) {
            const r = row as {
              id: string; items: unknown; customer_name: string | null; customer_phone: string | null;
              pincode: string | null; order_total: number | null; amount: number; priority: string | null;
            };
            const { dispatchNewOrderAlert } = await import("@/lib/alerts.server");
            await dispatchNewOrderAlert({
              razorpayOrderId: razorpay_order_id,
              paymentId: r.id,
              customerName: r.customer_name,
              customerPhone: r.customer_phone,
              pincode: r.pincode,
              amount: r.order_total ?? r.amount,
              priority: r.priority,
              items: Array.isArray(r.items) ? (r.items as Array<{ name?: string; quantity?: number }>) : [],
            });
          }
        } catch (e) { console.error("Order alert dispatch failed", e); }

        return Response.json({ ok: true, paymentId: razorpay_payment_id });
      },
    },
  },
});
