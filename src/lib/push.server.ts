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

type NativeMessageType = "NEW_ORDER" | "STOP_ORDER_ALARM";

type Row = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type NativeRow = { id: string; token: string };

async function sendNativeMessage(
  type: NativeMessageType,
  payload: PushAlertPayload,
): Promise<{ sent: number; failed: number; skipped?: string }> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["FIREBASE_MESSAGING_API_KEY"];
  if (!lovableKey || !connectionKey) return { sent: 0, failed: 0, skipped: "firebase-not-configured" };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("native_push_devices")
    .select("id, token")
    .eq("active", true);
  if (error || !data || data.length === 0) {
    return { sent: 0, failed: 0, skipped: error?.message ?? "no-native-devices" };
  }

  let sent = 0;
  let failed = 0;
  const stale: string[] = [];
  await Promise.all(
    (data as NativeRow[]).map(async (device) => {
      try {
        const response = await fetch(
          "https://connector-gateway.lovable.dev/firebase_messaging/v1/projects/_/messages:send",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableKey}`,
              "X-Connection-Api-Key": connectionKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: {
                token: device.token,
                android: { priority: "high", ttl: "900s" },
                data: {
                  type,
                  alertId: payload.alertId ?? "",
                  title: payload.title,
                  body: payload.body,
                  path: payload.url ?? "/admin/warehouse",
                },
              },
            }),
          },
        );
        if (response.ok) {
          sent += 1;
          return;
        }
        failed += 1;
        const detail = await response.text();
        console.error(`[Alerts] FCM failed [${response.status}]: ${detail}`);
        if (
          response.status === 404 ||
          (response.status === 400 && /UNREGISTERED|registration-token-not-registered/i.test(detail))
        ) stale.push(device.id);
      } catch (nativeError) {
        failed += 1;
        console.error("[Alerts] FCM network failure", nativeError instanceof Error ? nativeError.message : nativeError);
      }
    }),
  );
  if (stale.length > 0) await supabaseAdmin.from("native_push_devices").delete().in("id", stale);
  return { sent, failed };
}

export async function stopNativeOrderAlarm(alertId: string): Promise<void> {
  await sendNativeMessage("STOP_ORDER_ALARM", {
    title: "Order accepted",
    body: "The warehouse has accepted this order.",
    alertId,
  });
}

/** Sends one alert to every registered staff device. Returns delivery counts. */
export async function sendPushToStaff(payload: PushAlertPayload): Promise<{
  sent: number;
  failed: number;
  skipped?: string;
}> {
  const nativePromise = sendNativeMessage("NEW_ORDER", payload);
  const publicKey = process.env["VAPID_PUBLIC_KEY"];
  const privateKey = process.env["VAPID_PRIVATE_KEY"];
  const subject = process.env["VAPID_SUBJECT"] ?? "mailto:omorablooms5@gmail.com";
  if (!publicKey || !privateKey) {
    const native = await nativePromise;
    return { sent: native.sent, failed: native.failed, skipped: native.skipped };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");

  if (error || !data || data.length === 0) {
    const native = await nativePromise;
    return {
      sent: native.sent,
      failed: native.failed,
      skipped: native.skipped ?? error?.message ?? "no-browser-devices",
    };
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

  const native = await nativePromise;
  return { sent: sent + native.sent, failed: failed + native.failed, skipped: native.skipped };
}
