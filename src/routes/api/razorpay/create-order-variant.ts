import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/razorpay/create-order-variant")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret) {
          return Response.json({ error: "Razorpay not configured" }, { status: 500 });
        }

        let body: {
          variantSlug?: string;
          variantName?: string;
          amount?: number; // rupees
          customerName?: string | null;
          customerPhone?: string | null;
          pincode?: string | null;
          address?: string | null;
        };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const { variantSlug, variantName, amount } = body;
        if (!variantSlug || !variantName || !amount || amount < 1) {
          return Response.json({ error: "Missing required fields" }, { status: 400 });
        }

        const cleanName = typeof body.customerName === "string" ? body.customerName.slice(0, 120) : null;
        const cleanPhone = typeof body.customerPhone === "string" ? body.customerPhone.replace(/\D/g, "").slice(0, 15) : null;
        const cleanPincode = typeof body.pincode === "string" && /^[1-9]\d{5}$/.test(body.pincode) ? body.pincode : null;

        const amountPaise = Math.round(amount * 100);
        if (amountPaise < 100) {
          return Response.json({ error: "Amount too low" }, { status: 400 });
        }

        const receipt = `omora_var_${Date.now().toString(36)}`;
        const auth = btoa(`${keyId}:${keySecret}`);
        const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify({
            amount: amountPaise,
            currency: "INR",
            receipt,
            notes: { variant: variantSlug, name: variantName },
          }),
        });

        if (!rzpRes.ok) {
          const txt = await rzpRes.text();
          console.error("Razorpay variant order create failed", rzpRes.status, txt);
          return Response.json({ error: "Could not create order" }, { status: 502 });
        }

        const order = (await rzpRes.json()) as { id: string; amount: number; currency: string };

        // Log to payments table (best effort)
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("payments").insert({
            razorpay_order_id: order.id,
            amount,
            currency: order.currency,
            status: "created",
            items: [{ id: variantSlug, name: variantName, price: amount, quantity: 1 }] as never,
            pincode: cleanPincode,
            customer_name: cleanName,
            customer_phone: cleanPhone,
          } as never);
        } catch (e) {
          console.error("Payment log insert failed", e);
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
