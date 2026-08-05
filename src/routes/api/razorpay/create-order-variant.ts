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

        const { variantSlug } = body;
        if (!variantSlug || typeof variantSlug !== "string") {
          return Response.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Authoritative price/name resolved server-side; client-sent amount is ignored.
        let amount: number | null = null;
        let variantName = variantSlug;
        try {
          const { createClient } = await import("@supabase/supabase-js");
          const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
          const supabasePublic = createClient(process.env["SUPABASE_URL"]!, key, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: {
              fetch: (input: RequestInfo | URL, init?: RequestInit) => {
                const h = new Headers(init?.headers);
                if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
                h.set("apikey", key);
                return fetch(input, { ...init, headers: h });
              },
            },
          });
          const { data } = await supabasePublic
            .from("product_variants")
            .select("name, price")
            .eq("slug", variantSlug)
            .eq("active", true)
            .maybeSingle();
          if (data) {
            amount = Number((data as { price: number }).price);
            variantName = (data as { name: string }).name;
          }
        } catch (e) {
          console.error("Variant price lookup failed", e);
        }

        if (amount === null) {
          // Legacy static catalogue fallback
          const { getVariantBySlug } = await import("@/lib/variants");
          const variant = getVariantBySlug(variantSlug);
          if (!variant) {
            return Response.json({ error: "Unknown variant" }, { status: 400 });
          }
          amount = variant.price;
          variantName = variant.name;
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
