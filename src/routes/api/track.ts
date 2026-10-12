import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

type Body = { orderId?: string; statusToken?: string };

export const Route = createFileRoute("/api/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) return Response.json({ error: "Not configured" }, { status: 500 });

        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const orderId = body.orderId?.trim() ?? "";

        if (!orderId || orderId.length > 80) {
          return Response.json(
            { error: "Provide a valid Order ID" },
            { status: 400 },
          );
        }

        const expected = createHmac("sha256", keySecret).update(`status:${orderId}`).digest("hex");
        const provided = typeof body.statusToken === "string" ? body.statusToken : "";
        const expectedBytes = Buffer.from(expected);
        const providedBytes = Buffer.from(provided);
        if (expectedBytes.length !== providedBytes.length || !timingSafeEqual(expectedBytes, providedBytes)) {
          return Response.json({ error: "Order ID and tracking token do not match" }, { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data, error } = await supabaseAdmin
          .from("payments")
          .select(
            "razorpay_order_id, amount, currency, status, items, delivery_notes, pickup_point_id, priority, created_at, updated_at",
          )
          .eq("razorpay_order_id", orderId)
          .maybeSingle();

        if (error) return Response.json({ error: "Lookup failed" }, { status: 500 });
        if (!data) return Response.json({ orders: [] });
        return Response.json({ orders: [data] });

      },
    },
  },
});
