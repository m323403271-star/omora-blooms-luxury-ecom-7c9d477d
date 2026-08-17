import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function tokenMatches(expected: string, provided: unknown) {
  const a = Buffer.from(expected);
  const b = Buffer.from(typeof provided === "string" ? provided : "");
  return a.length === b.length && timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/razorpay/status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) return Response.json({ error: "Not configured" }, { status: 500 });

        let body: { orderId?: string; statusToken?: string; phone?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const orderId = body.orderId?.trim();
        if (!orderId || orderId.length > 80) {
          return Response.json({ error: "Missing orderId" }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("payments")
          .select(
            "razorpay_order_id, razorpay_payment_id, amount, currency, status, items, error_message, delivery_notes, created_at, updated_at, customer_phone, user_id",
          )
          .eq("razorpay_order_id", orderId)
          .maybeSingle();

        if (error) return Response.json({ error: "Lookup failed" }, { status: 500 });

        // Ownership proof #1: capability token issued to the browser that created the order.
        const expected = createHmac("sha256", keySecret).update(`status:${orderId}`).digest("hex");
        let authorized = tokenMatches(expected, body.statusToken);

        // Ownership proof #2: the phone number used at checkout.
        if (!authorized && body.phone && data?.customer_phone) {
          const phone = normalizePhone(body.phone);
          authorized =
            phone.length === 10 && normalizePhone(String(data.customer_phone)) === phone;
        }

        // Ownership proof #3: signed-in user who owns the order.
        if (!authorized && data?.user_id) {
          const authHeader = request.headers.get("Authorization") ?? "";
          const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
          if (jwt) {
            const { data: userRes } = await supabaseAdmin.auth.getUser(jwt);
            if (userRes?.user?.id && userRes.user.id === data.user_id) authorized = true;
          }
        }

        if (!authorized) {
          return Response.json(
            { error: "Ownership verification required" },
            { status: 401 },
          );
        }
        if (!data) return Response.json({ error: "Not found" }, { status: 404 });

        const { customer_phone: _p, user_id: _u, ...safe } = data;
        return Response.json(safe);
      },
    },
  },
});
