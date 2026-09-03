import { createFileRoute } from "@tanstack/react-router";

/**
 * Daily reminder sweep (called by the scheduled job). Finds occasions exactly
 * 5 days away, marks them reminded, and returns the payload the notification
 * channel sends. Authenticated with a private cron key held in app_secrets.
 */
export const Route = createFileRoute("/api/public/occasion-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: secret } = await supabaseAdmin
          .from("app_secrets")
          .select("value")
          .eq("name", "cron_key")
          .maybeSingle();

        const provided = request.headers.get("x-cron-key") ?? "";
        if (!secret?.value || provided !== secret.value) {
          return new Response("Unauthorized", { status: 401 });
        }

        const target = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        const { data: due, error } = await supabaseAdmin
          .from("user_occasions")
          .select("id, user_id, name, relationship, occasion_date, flower_preference, last_reminded_at")
          .eq("occasion_date", target);

        if (error) return new Response("Query failed", { status: 500 });

        const pending = (due ?? []).filter(
          (o) => !o.last_reminded_at || new Date(o.last_reminded_at).toISOString().slice(0, 10) !== new Date().toISOString().slice(0, 10),
        );

        if (pending.length) {
          await supabaseAdmin
            .from("user_occasions")
            .update({ last_reminded_at: new Date().toISOString() })
            .in("id", pending.map((o) => o.id));

          for (const o of pending) {
            console.log(
              `[occasion-reminder] ${o.relationship || "Someone"} — ${o.name} on ${o.occasion_date} (prefers ${o.flower_preference ?? "any bouquet"}) for user ${o.user_id}`,
            );
          }
        }

        return Response.json({ date: target, reminded: pending.length });
      },
    },
  },
});
