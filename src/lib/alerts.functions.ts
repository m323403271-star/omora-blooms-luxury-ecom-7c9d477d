import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

/** Public VAPID key, needed by the browser to register for push alerts. */
export const getPushPublicKey = createServerFn({ method: "GET" }).handler(async () => ({
  publicKey: process.env["VAPID_PUBLIC_KEY"] ?? null,
}));

async function assertStaff(context: { supabase: SupabaseClient<Database>; userId: string }) {
  const [admin, agent] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "agent" }),
  ]);
  if (admin.data !== true && agent.data !== true) throw new Error("Forbidden");
  return admin.data === true ? "admin" : "agent";
}

const subSchema = z.object({
  endpoint: z.string().url().max(2000),
  p256dh: z.string().min(10).max(500),
  auth: z.string().min(4).max(500),
  userAgent: z.string().max(300).optional(),
});

/** Registers this device (admin phone or delivery partner phone) for siren push alerts. */
export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => subSchema.parse(data))
  .handler(async ({ data, context }) => {
    const role = await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
      {
        user_id: context.userId,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        role_label: role,
        user_agent: data.userAgent ?? null,
        last_seen_at: new Date().toISOString(),
      } as never,
      { onConflict: "endpoint" },
    );
    if (error) {
      console.error("[Alerts] could not save device", error.message);
      return { ok: false as const, error: "Could not register this device." };
    }
    return { ok: true as const };
  });

/** Marks an alert as accepted so every siren (dashboard + phone) stops. */
export const acknowledgeOrderAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ alertId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { error } = await context.supabase
      .from("order_alerts")
      .update({ acknowledged_at: new Date().toISOString(), acknowledged_by: context.userId })
      .eq("id", data.alertId)
      .is("acknowledged_at", null);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/** Sends a test alert to every registered device so staff can verify the siren. */
export const sendTestOrderAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const { sendPushToStaff } = await import("@/lib/push.server");
    const res = await sendPushToStaff({
      title: "🚨 TEST ALERT — OMORA",
      body: "This is how a new order will alert you.",
      url: "/admin/warehouse",
      tag: `omora-test-${Date.now()}`,
    });
    return res;
  });
