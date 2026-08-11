import { createFileRoute } from "@tanstack/react-router";

/**
 * Stores an in-progress checkout so the concierge can follow up on WhatsApp.
 * Called from the checkout page when a shopper enters their details but does
 * not complete payment. Writes are validated and never echo stored data back.
 */
export const Route = createFileRoute("/api/abandoned-cart")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: {
          customerPhone?: string;
          customerName?: string | null;
          items?: Array<{ id?: string; name?: string; price?: number; image?: string | null }>;
          total?: number;
        };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const phone = String(body.customerPhone ?? "").replace(/\D/g, "").slice(0, 15);
        if (phone.length < 10) return Response.json({ error: "Invalid phone" }, { status: 400 });

        const name = typeof body.customerName === "string" ? body.customerName.slice(0, 120) : null;
        const total = Number.isFinite(Number(body.total)) ? Math.max(0, Number(body.total)) : 0;
        const items = (Array.isArray(body.items) ? body.items : []).slice(0, 20).map((i) => ({
          id: String(i.id ?? "").slice(0, 120),
          name: String(i.name ?? "").slice(0, 200),
          price: Number(i.price) || 0,
          image: typeof i.image === "string" ? i.image.slice(0, 2048) : null,
        }));

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          // One open record per phone: refresh it instead of piling up duplicates.
          const { data: existing } = await supabaseAdmin
            .from("abandoned_carts")
            .select("id")
            .eq("customer_phone", phone)
            .eq("recovered", false)
            .maybeSingle();

          if (existing) {
            await supabaseAdmin
              .from("abandoned_carts")
              .update({ customer_name: name, items: items as never, total })
              .eq("id", existing.id);
          } else {
            await supabaseAdmin
              .from("abandoned_carts")
              .insert({ customer_phone: phone, customer_name: name, items: items as never, total } as never);
          }
        } catch (e) {
          console.error("Abandoned cart save failed", e);
        }

        return Response.json({ ok: true });
      },
    },
  },
});
