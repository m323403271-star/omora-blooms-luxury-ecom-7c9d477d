import { createFileRoute } from "@tanstack/react-router";

type Body = { orderId?: string; phone?: string };

function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export const Route = createFileRoute("/api/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const orderId = body.orderId?.trim() ?? "";
        const phoneRaw = body.phone?.trim() ?? "";

        // Ownership proof: the order ID AND the phone used at checkout must match.
        if (!orderId || !phoneRaw) {
          return Response.json(
            { error: "Provide both your Order ID and the phone number used at checkout" },
            { status: 400 },
          );
        }
        if (orderId.length > 80) return Response.json({ error: "Invalid order ID" }, { status: 400 });

        const phone = normalizePhone(phoneRaw);
        if (phone.length !== 10) {
          return Response.json({ error: "Enter a valid 10-digit phone number" }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data, error } = await supabaseAdmin
          .from("payments")
          .select(
            "razorpay_order_id, amount, currency, status, items, delivery_notes, pickup_point_id, priority, created_at, updated_at, customer_phone",
          )
          .eq("razorpay_order_id", orderId)
          .maybeSingle();

        if (error) return Response.json({ error: "Lookup failed" }, { status: 500 });
        if (!data) return Response.json({ orders: [] });

        if (normalizePhone(String(data.customer_phone ?? "")) !== phone) {
          return Response.json({ orders: [] });
        }

        const { customer_phone: _p, ...rest } = data;
        return Response.json({ orders: [rest] });

      },
    },
  },
});
