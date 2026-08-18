import { createFileRoute } from "@tanstack/react-router";
import { createHmac } from "node:crypto";

type Item = {
  id: string;
  quantity: number;
  image?: string | null;
  variantSlug?: string | null;
  colorName?: string | null;
  colorHex?: string | null;
};


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
            deliveryNotes?: string | null;
            couponCode?: string | null;
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
        const cleanNotes = typeof meta.deliveryNotes === "string" ? meta.deliveryNotes.slice(0, 300) : null;
        const rawCoupon = typeof meta.couponCode === "string" ? meta.couponCode : null;


        // Load trusted prices from DB
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const ids = items.map((i) => String(i.id));
        const { data: products, error } = await supabaseAdmin
          .from("products")
          .select("id, name, price, image_url, images")
          .in("id", ids);
        if (error || !products) {
          return Response.json({ error: "Product lookup failed" }, { status: 500 });
        }

        // Authoritative variant (shade) data, when any line carries a variant slug.
        const variantSlugs = Array.from(
          new Set(items.map((i) => (typeof i.variantSlug === "string" ? i.variantSlug : "")).filter(Boolean)),
        );
        type VariantRow = {
          slug: string;
          name: string;
          price: number;
          color_name: string | null;
          color_hex: string | null;
          images: string[] | null;
        };
        let variants: VariantRow[] = [];
        if (variantSlugs.length > 0) {
          const { data: vRows } = await supabaseAdmin
            .from("product_variants")
            .select("slug, name, price, color_name, color_hex, images")
            .in("slug", variantSlugs)
            .eq("active", true);
          variants = (vRows ?? []) as unknown as VariantRow[];
        }

        const sameImage = (a: string, b: string) => a === b || a.split("?")[0] === b.split("?")[0];

        let totalRupees = 0;
        const clean: Array<{
          id: string;
          name: string;
          price: number;
          quantity: number;
          image: string | null;
          variant_slug: string | null;
          color_name: string | null;
          color_hex: string | null;
        }> = [];
        for (const it of items) {
          const p = products.find((x) => x.id === it.id);
          if (!p) return Response.json({ error: "Unknown product" }, { status: 400 });
          const qty = Math.max(1, Math.min(100, Math.floor(Number(it.quantity) || 1)));

          const variant = it.variantSlug ? variants.find((v) => v.slug === it.variantSlug) : undefined;
          const unitPrice = variant ? Number(variant.price) : Number(p.price);
          totalRupees += unitPrice * qty;

          // Allowed images come from the server: the variant's own gallery when a
          // variant is selected, otherwise the product's gallery. The client-sent
          // image is honoured only when it matches one of them (prevents spoofing).
          const productImages = [
            ...(Array.isArray((p as { images?: string[] }).images) ? ((p as { images?: string[] }).images as string[]) : []),
            ...((p as { image_url?: string }).image_url ? [(p as { image_url?: string }).image_url as string] : []),
          ].filter(Boolean);
          const allowed = variant
            ? (Array.isArray(variant.images) ? variant.images : []).filter(Boolean)
            : productImages;
          const fallbackImage = allowed[0] ?? (p as { image_url?: string }).image_url ?? null;
          const requested = typeof it.image === "string" && it.image.length > 0 && it.image.length < 2048 ? it.image : null;
          const image = requested && allowed.some((img) => sameImage(img, requested)) ? requested : fallbackImage;

          clean.push({
            id: p.id,
            name: variant ? `${p.name} — ${variant.name}` : p.name,
            price: unitPrice,
            quantity: qty,
            image,
            variant_slug: variant?.slug ?? null,
            color_name: variant?.color_name ?? null,
            color_hex: variant?.color_hex ?? null,
          });
        }


        // Coupons / loyalty reward codes are always re-validated server-side.
        const listTotal = totalRupees;
        let couponCode: string | null = null;
        let discountAmount = 0;
        if (rawCoupon) {
          const { validateCoupon } = await import("@/lib/coupon.server");
          const result = await validateCoupon(rawCoupon, listTotal);
          if (result.valid) {
            couponCode = result.code;
            discountAmount = result.discount;
            totalRupees = Math.round((listTotal - discountAmount) * 100) / 100;
          }
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
            delivery_notes: cleanNotes,
            coupon_code: couponCode,
            discount_amount: discountAmount,
            order_total: listTotal,
          } as never);
        } catch (e) {
          console.error("Payment log insert failed", e);
        }


        // Capability token: proves this browser created the order.
        const orderToken = createHmac("sha256", keySecret).update(`mark-status:${order.id}`).digest("hex");
        const statusToken = createHmac("sha256", keySecret).update(`status:${order.id}`).digest("hex");

        return Response.json({
          orderId: order.id,
          orderToken,
          statusToken,
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
