import { createFileRoute } from "@tanstack/react-router";

function normalizePhone(raw: string) {
  const digits = (raw || "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export const Route = createFileRoute("/api/razorpay/status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { orderId?: string; phone?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const orderId = body.orderId?.trim();
        if (!orderId || orderId.length > 80) {
          return Response.json({ error: "Missing orderId" }, { status: 400 });
        }

        // Ownership proof: the phone number used at checkout must match.
        const phone = normalizePhone(body.phone ?? "");
        if (phone.length !== 10) {
          return Response.json(
            { error: "Enter the 10-digit phone number used at checkout" },
            { status: 401 },
          );
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("payments")
          .select("razorpay_order_id, razorpay_payment_id, amount, currency, status, items, error_message, delivery_notes, created_at, updated_at, customer_phone")
          .eq("razorpay_order_id", orderId)
          .maybeSingle();

        if (error) return Response.json({ error: "Lookup failed" }, { status: 500 });
        if (!data) return Response.json({ error: "Not found" }, { status: 404 });

        if (normalizePhone(String(data.customer_phone ?? "")) !== phone) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        const { customer_phone: _p, ...rest } = data;
        return Response.json(rest);
      },
    },
  },
});
