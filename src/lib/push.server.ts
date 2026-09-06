/**
 * Server-only Web Push sender (VAPID + aes128gcm), Cloudflare Worker safe.
 * Never import this from a component or a route module's top level.
 */
import { buildPushPayload } from "@block65/webcrypto-web-push";

export type PushAlertPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  alertId?: string | null;
};

type Row = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

/** Sends one alert to every registered staff device. Returns delivery counts. */
export async function sendPushToStaff(payload: PushAlertPayload): Promise<{
  sent: number;
  failed: number;
  skipped?: string;
}> {
  const publicKey = process.env["VAPID_PUBLIC_KEY"];
  const privateKey = process.env["VAPID_PRIVATE_KEY"];
  const subject = process.env["VAPID_SUBJECT"] ?? "mailto:omorablooms5@gmail.com";
  if (!publicKey || !privateKey) return { sent: 0, failed: 0, skipped: "vapid-not-configured" };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");

  if (error || !data || data.length === 0) {
    return { sent: 0, failed: 0, skipped: error?.message ?? "no-devices" };
  }

  let sent = 0;
  let failed = 0;
  const stale: string[] = [];

  await Promise.all(
    (data as Row[]).map(async (row) => {
      const subscription = {
        endpoint: row.endpoint,
        expirationTime: null,
        keys: { p256dh: row.p256dh, auth: row.auth },
      };
      try {
        const req = await buildPushPayload(
          { data: payload, options: { ttl: 900, urgency: "high", topic: "omora-order" } },
          subscription,
          { subject, publicKey, privateKey },
        );
        const res = await fetch(row.endpoint, {
          method: req.method,
          headers: req.headers,
          body: req.body as BodyInit,
        });
        if (res.ok) sent += 1;
        else {
          failed += 1;
          if (res.status === 404 || res.status === 410) stale.push(row.id);
        }
      } catch (e) {
        failed += 1;
        console.error("[Alerts] push failed", e instanceof Error ? e.message : e);
      }
    }),
  );

  if (stale.length > 0) {
    await supabaseAdmin.from("push_subscriptions").delete().in("id", stale);
  }

  return { sent, failed };
}
