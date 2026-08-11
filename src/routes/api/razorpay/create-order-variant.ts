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
          paymentMode?: string;
          customerName?: string | null;
          customerPhone?: string | null;
          pincode?: string | null;
          address?: string | null;
          pickupPointId?: string | null;
          deliveryNotes?: string | null;
          selectedImage?: string | null;
          colorName?: string | null;
          colorHex?: string | null;
          couponCode?: string | null;
          customerEmail?: string | null;
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

        const paymentMode: "full" | "advance" = body.paymentMode === "advance" ? "advance" : "full";


        // Authoritative price/name/image/color resolved server-side; client-sent amount is ignored.
        let amount: number | null = null;
        let variantName = variantSlug;
        let variantImage: string | null = null;
        let variantColorName: string | null = null;
        let variantColorHex: string | null = null;
        let variantImages: string[] = [];
        let soldOut = false;
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
            .select("name, price, color_name, color_hex, images, stock, track_stock")
            .eq("slug", variantSlug)
            .eq("active", true)
            .maybeSingle();
          if (data) {
            amount = Number((data as { price: number }).price);
            variantName = (data as { name: string }).name;
            variantColorName = (data as { color_name: string }).color_name || null;
            variantColorHex = (data as { color_hex: string }).color_hex || null;
            variantImages = Array.isArray((data as { images: string[] }).images) ? (data as { images: string[] }).images : [];
            variantImage = variantImages[0] ?? null;
            const row = data as { stock?: number; track_stock?: boolean };
            soldOut = Boolean(row.track_stock) && Number(row.stock ?? 0) <= 0;
          }
        } catch (e) {
          console.error("Variant price lookup failed", e);
        }

        if (soldOut) {
          return Response.json({ error: "This shade is sold out" }, { status: 409 });
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
          variantColorName = variant.colorName || null;
          variantColorHex = variant.colorHex || null;
          variantImage = variant.image || null;
          variantImages = variant.image ? [variant.image] : [];
        }

        // Validate client-sent selectedImage against the variant's actual images.
        // Only accept it if it matches one of the variant's real images (prevents spoofing).
        let resolvedImage = variantImage;
        if (
          typeof body.selectedImage === "string" &&
          body.selectedImage.length > 0 &&
          body.selectedImage.length < 2048 &&
          variantImages.some((img) => img === body.selectedImage || img.split("?")[0] === body.selectedImage!.split("?")[0])
        ) {
          resolvedImage = body.selectedImage;
        }
        const resolvedColorName = variantColorName ?? (typeof body.colorName === "string" ? body.colorName.slice(0, 60) : null);
        const resolvedColorHex = variantColorHex ?? (typeof body.colorHex === "string" ? body.colorHex.slice(0, 20) : null);


        const cleanName = typeof body.customerName === "string" ? body.customerName.slice(0, 120) : null;
        const cleanPhone = typeof body.customerPhone === "string" ? body.customerPhone.replace(/\D/g, "").slice(0, 15) : null;
        const cleanPincode = typeof body.pincode === "string" && /^[1-9]\d{5}$/.test(body.pincode) ? body.pincode : null;
        const cleanNotes = typeof body.deliveryNotes === "string" ? body.deliveryNotes.slice(0, 300) : null;

        // Authoritative pricing rules (never trust the client):
        //  - full    → 5% discount on the whole order, paid now
        //  - advance → 30% booking amount now, 70% due on delivery (no discount)
        const round2 = (n: number) => Math.round(n * 100) / 100;
        const listTotal = round2(amount);
        const discountAmount = paymentMode === "full" ? round2(listTotal * 0.05) : 0;
        let couponCode: string | null = null;
        let couponDiscount = 0;
        if (typeof body.couponCode === "string" && body.couponCode.trim()) {
          const { validateCoupon } = await import("@/lib/coupon.server");
          const result = await validateCoupon(body.couponCode, round2(listTotal - discountAmount));
          if (result.valid) {
            couponCode = result.code;
            couponDiscount = result.discount;
          }
        }
        const orderTotal = round2(listTotal - discountAmount - couponDiscount);
        const payNow = paymentMode === "advance" ? round2(orderTotal * 0.3) : orderTotal;
        const balanceDue = round2(orderTotal - payNow);

        const amountPaise = Math.round(payNow * 100);
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
            notes: {
              variant: variantSlug,
              name: variantName,
              payment_mode: paymentMode,
              order_total: String(orderTotal),
              balance_due: String(balanceDue),
            },
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
            amount: payNow,
            currency: order.currency,
            status: "created",
            payment_mode: paymentMode,
            discount_amount: round2(discountAmount + couponDiscount),
            coupon_code: couponCode,
            customer_email:
              typeof body.customerEmail === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.customerEmail)
                ? body.customerEmail.slice(0, 255).toLowerCase()
                : null,
            order_total: orderTotal,
            balance_due: balanceDue,
            items: [{ id: variantSlug, name: variantName, price: listTotal, quantity: 1, image: resolvedImage, color_name: resolvedColorName, color_hex: resolvedColorHex }] as never,
            pincode: cleanPincode,
            customer_name: cleanName,
            customer_phone: cleanPhone,
            pickup_point_id: typeof body.pickupPointId === "string" ? body.pickupPointId.slice(0, 60) : null,
            delivery_notes: cleanNotes,
          } as never);
        } catch (e) {
          console.error("Payment log insert failed", e);
        }


        return Response.json({
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId,
          couponCode,
          couponDiscount,
          orderTotal,
          balanceDue,
        });
      },
    },
  },
});
