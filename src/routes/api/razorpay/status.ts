import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

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

        let body: { orderId?: string; statusToken?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const orderId = body.orderId?.trim();
        if (!orderId || orderId.length > 80) {
          return Response.json({ error: "Missing orderId" }, { status: 400 });
        }

        // Ownership proof #1: capability token issued to the browser that created the order.
        const expected = createHmac("sha256", keySecret).update(`status:${orderId}`).digest("hex");
        let authorized = tokenMatches(expected, body.statusToken);

        const authHeader = request.headers.get("Authorization") ?? "";
        const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
        let authenticatedUserId: string | null = null;
        if (jwt) {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: userRes } = await supabaseAdmin.auth.getUser(jwt);
          authenticatedUserId = userRes.user?.id ?? null;
        }

        if (!authorized && !authenticatedUserId) {
          return Response.json(
            { error: "Ownership verification required" },
            { status: 401 },
          );
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: owner, error: ownerError } = await supabaseAdmin
          .from("payments")
          .select("user_id")
          .eq("razorpay_order_id", orderId)
          .maybeSingle();
        if (ownerError) return Response.json({ error: "Lookup failed" }, { status: 500 });
        if (!owner) return Response.json({ error: "Not found" }, { status: 404 });

        if (!authorized && authenticatedUserId !== owner.user_id) {
          return Response.json({ error: "Ownership verification required" }, { status: 401 });
        }

        const { data, error } = await supabaseAdmin
          .from("payments")
          .select(
            "razorpay_order_id, razorpay_payment_id, amount, currency, status, items, error_message, delivery_notes, created_at, updated_at",
          )
          .eq("razorpay_order_id", orderId)
          .maybeSingle();
        if (error) return Response.json({ error: "Lookup failed" }, { status: 500 });
        if (!data) return Response.json({ error: "Not found" }, { status: 404 });

        const safe = data;
        return Response.json(safe);
      },
    },
  },
});
