import { createFileRoute } from "@tanstack/react-router";
import { createHmac } from "node:crypto";

type Item = { id: string; quantity: number };

export const Route = createFileRoute("/api/razorpay/create-order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret) {
          return Response.json({ error: "Razorpay not configured" }, { status: 500 });
        }

        let body: {
          items?: Item[];
          ref?: string | null;
          meta?: {
            pincode?: string | null;
            customerTier?: "regular" | "prestige" | null;
            pickupPointId?: string | null;
            customerName?: string | null;
            customerPhone?: string | null;
          };
        };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const items = Array.isArray(body.items) ? body.items : [];
        if (items.length === 0 || items.length > 100) {
          return Response.json({ error: "Invalid items" }, { status: 400 });
        }
        const meta = body.meta ?? {};
        const cleanTier = meta.customerTier === "prestige" ? "prestige" : "regular";
        const cleanPincode = typeof meta.pincode === "string" && /^[1-9]\d{5}$/.test(meta.pincode) ? meta.pincode : null;
        const cleanPickup = typeof meta.pickupPointId === "string" ? meta.pickupPointId.slice(0, 60) : null;
        const cleanName = typeof meta.customerName === "string" ? meta.customerName.slice(0, 120) : null;
        const cleanPhone = typeof meta.customerPhone === "string" ? meta.customerPhone.replace(/\D/g, "").slice(0, 15) : null;


        // Load trusted prices from DB
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const ids = items.map((i) => String(i.id));
        const { data: products, error } = await supabaseAdmin
          .from("products")
          .select("id, name, price")
          .in("id", ids);
        if (error || !products) {
          return Response.json({ error: "Product lookup failed" }, { status: 500 });
        }

        let totalRupees = 0;
        const clean: Array<{ id: string; name: string; price: number; quantity: number }> = [];
        for (const it of items) {
          const p = products.find((x) => x.id === it.id);
          if (!p) return Response.json({ error: "Unknown product" }, { status: 400 });
          const qty = Math.max(1, Math.min(100, Math.floor(Number(it.quantity) || 1)));
          totalRupees += Number(p.price) * qty;
          clean.push({ id: p.id, name: p.name, price: Number(p.price), quantity: qty });
        }

        const amountPaise = Math.round(totalRupees * 100);
        if (amountPaise < 100) {
          return Response.json({ error: "Amount too low" }, { status: 400 });
        }

        const receipt = `omora_${Date.now().toString(36)}`;
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
            notes: { ref: body.ref ?? "" },
          }),
        });

        if (!rzpRes.ok) {
          const txt = await rzpRes.text();
          console.error("Razorpay order create failed", rzpRes.status, txt);
          return Response.json({ error: "Could not create order" }, { status: 502 });
        }
        const order = (await rzpRes.json()) as { id: string; amount: number; currency: string };

        try {
          await supabaseAdmin.from("payments").insert({
            razorpay_order_id: order.id,
            amount: totalRupees,
            currency: order.currency,
            status: "created",
            ref_code: body.ref ?? null,
            items: clean as never,
            pincode: cleanPincode,
            customer_tier: cleanTier,
            pickup_point_id: cleanPickup,
            customer_name: cleanName,
            customer_phone: cleanPhone,
          } as never);
        } catch (e) {
          console.error("Payment log insert failed", e);
        }


        // Capability token: proves this browser created the order.
        const orderToken = createHmac("sha256", keySecret).update(`mark-status:${order.id}`).digest("hex");

        return Response.json({
          orderId: order.id,
          orderToken,
          amount: order.amount,
          currency: order.currency,
          keyId,
          items: clean,
          total: totalRupees,
        });
      },
    },
  },
});
