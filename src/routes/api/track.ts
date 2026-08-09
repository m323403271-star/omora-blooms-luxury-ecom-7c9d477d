import { createFileRoute } from "@tanstack/react-router";

type Body = { orderId?: string; phone?: string };

const SELECT =
  "razorpay_order_id, amount, currency, status, items, delivery_notes, pickup_point_id, priority, created_at, updated_at";

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

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (orderId) {
          if (orderId.length > 80) return Response.json({ error: "Invalid order ID" }, { status: 400 });
          const { data, error } = await supabaseAdmin
            .from("payments")
            .select(SELECT)
            .eq("razorpay_order_id", orderId)
            .maybeSingle();
          if (error) return Response.json({ error: "Lookup failed" }, { status: 500 });
          if (!data) return Response.json({ orders: [] });
          return Response.json({ orders: [data] });
        }

        if (phoneRaw) {
          const phone = normalizePhone(phoneRaw);
          if (phone.length !== 10) return Response.json({ error: "Enter a valid 10-digit phone number" }, { status: 400 });
          const { data, error } = await supabaseAdmin
            .from("payments")
            .select(
              "razorpay_order_id, amount, currency, status, items, delivery_notes, pickup_point_id, priority, created_at, updated_at, customer_phone",
            )
            .order("created_at", { ascending: false })
            .limit(200);
          if (error) return Response.json({ error: "Lookup failed" }, { status: 500 });
          const orders = (data ?? [])
            .filter((r) => normalizePhone(String(r.customer_phone ?? "")) === phone)
            .slice(0, 10)
            .map((r) => {
              const { customer_phone: _p, ...rest } = r;
              return rest;
            });
          return Response.json({ orders });
        }

        return Response.json({ error: "Provide an order ID or phone number" }, { status: 400 });
      },
    },
  },
});
