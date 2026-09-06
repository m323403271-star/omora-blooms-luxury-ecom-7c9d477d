/**
 * Server-only new-order alert dispatcher.
 *
 * One call fans a new order out to every channel:
 *  1. `order_alerts` row  → dashboards ring their siren instantly (realtime).
 *  2. Web Push            → admin phone + delivery app alarm, even when closed.
 *  3. SMS + WhatsApp      → via the Twilio connector gateway (when configured).
 *  4. Email               → via Resend (when configured).
 *
 * Every channel is best-effort: a failure is recorded on the alert row and
 * never blocks the payment flow.
 */

export type NewOrderAlert = {
  razorpayOrderId?: string | null;
  paymentId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  pincode?: string | null;
  amount?: number | null;
  priority?: string | null;
  items?: Array<{ name?: string; quantity?: number }> | null;
};

const SECRET_NAMES = [
  "ALERT_ADMIN_PHONE",
  "ALERT_ADMIN_EMAIL",
  "ALERT_SMS_FROM",
  "ALERT_WHATSAPP_FROM",
  "RESEND_API_KEY",
] as const;

type SecretName = (typeof SECRET_NAMES)[number];

/** Dashboard-saved values win; environment secrets are the fallback. */
async function loadSettings(): Promise<Record<SecretName, string | undefined>> {
  const out = {} as Record<SecretName, string | undefined>;
  for (const name of SECRET_NAMES) out[name] = process.env[name]?.trim() || undefined;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("app_secrets")
      .select("name, value")
      .in("name", SECRET_NAMES as unknown as string[]);
    for (const row of (data ?? []) as Array<{ name: string; value: string }>) {
      const v = row.value?.trim();
      if (v) out[row.name as SecretName] = v;
    }
  } catch (e) {
    console.error("[Alerts] settings unavailable", e instanceof Error ? e.message : e);
  }
  return out;
}

function toE164(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (raw.trim().startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return `+${digits}`;
}

function summarise(alert: NewOrderAlert): { items: string; text: string } {
  const items =
    (alert.items ?? [])
      .map((i) => `${i?.name ?? "Item"} x${i?.quantity ?? 1}`)
      .join(", ")
      .slice(0, 500) || "Order items";
  const text = [
    "NEW OMORA BLOOMS ORDER",
    `Customer: ${alert.customerName ?? "—"} (${alert.customerPhone ?? "—"})`,
    `Items: ${items}`,
    alert.amount != null ? `Amount: Rs ${alert.amount}` : null,
    alert.pincode ? `Pincode: ${alert.pincode}` : null,
    alert.priority ? `Priority: ${alert.priority.toUpperCase()}` : null,
    alert.razorpayOrderId ? `Ref: ${alert.razorpayOrderId}` : null,
    "Accept it now in the warehouse dashboard.",
  ]
    .filter(Boolean)
    .join("\n");
  return { items, text };
}

async function twilioSend(
  to: string,
  from: string,
  body: string,
): Promise<{ ok: boolean; detail: string }> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const twilioKey = process.env["TWILIO_API_KEY"];
  if (!lovableKey || !twilioKey) return { ok: false, detail: "twilio-not-connected" };

  const res = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": twilioKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });
  const detail = await res.text();
  if (!res.ok) console.error(`[Alerts] Twilio failed [${res.status}]: ${detail}`);
  return { ok: res.ok, detail: res.ok ? "sent" : `${res.status}: ${detail.slice(0, 200)}` };
}

async function sendEmail(
  apiKey: string,
  to: string,
  subject: string,
  text: string,
): Promise<{ ok: boolean; detail: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "OMORA BLOOMS Alerts <onboarding@resend.dev>",
      to: [to],
      subject,
      text,
    }),
  });
  const detail = await res.text();
  if (!res.ok) console.error(`[Alerts] Email failed [${res.status}]: ${detail}`);
  return { ok: res.ok, detail: res.ok ? "sent" : `${res.status}: ${detail.slice(0, 200)}` };
}

/** Fans a confirmed order out to every alert channel. Safe to call twice — deduped by order id. */
export async function dispatchNewOrderAlert(alert: NewOrderAlert): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { items, text } = summarise(alert);

  // Dedupe: /verify and the Razorpay webhook can both fire for one order.
  if (alert.razorpayOrderId) {
    const { data: existing } = await supabaseAdmin
      .from("order_alerts")
      .select("id")
      .eq("razorpay_order_id", alert.razorpayOrderId)
      .maybeSingle();
    if (existing) return;
  }

  const { data: inserted, error } = await supabaseAdmin
    .from("order_alerts")
    .insert({
      razorpay_order_id: alert.razorpayOrderId ?? null,
      payment_id: alert.paymentId ?? null,
      customer_name: alert.customerName ?? null,
      customer_phone: alert.customerPhone ?? null,
      pincode: alert.pincode ?? null,
      amount: alert.amount ?? null,
      priority: alert.priority ?? null,
      items_summary: items,
    } as never)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[Alerts] could not create alert row", error.message);
    return;
  }
  const alertId = (inserted as { id: string } | null)?.id ?? null;

  const channels: Record<string, string> = {};
  const settings = await loadSettings();

  // 1. Push to admin phone + delivery partner devices (works with app closed).
  try {
    const { sendPushToStaff } = await import("@/lib/push.server");
    const push = await sendPushToStaff({
      title: "🚨 NEW OMORA ORDER",
      body: `${alert.customerName ?? "Customer"} · ${items}${
        alert.amount != null ? ` · ₹${alert.amount}` : ""
      }`,
      url: "/admin/warehouse",
      tag: `omora-order-${alertId ?? Date.now()}`,
      alertId,
    });
    channels["push"] = push.skipped ?? `sent:${push.sent} failed:${push.failed}`;
  } catch (e) {
    channels["push"] = `error: ${e instanceof Error ? e.message : String(e)}`;
  }

  const adminPhone = toE164(settings.ALERT_ADMIN_PHONE);

  // 2. SMS
  if (adminPhone && settings.ALERT_SMS_FROM) {
    try {
      const r = await twilioSend(adminPhone, settings.ALERT_SMS_FROM, text);
      channels["sms"] = r.detail;
    } catch (e) {
      channels["sms"] = `error: ${e instanceof Error ? e.message : String(e)}`;
    }
  } else channels["sms"] = "not-configured";

  // 3. WhatsApp
  if (adminPhone && settings.ALERT_WHATSAPP_FROM) {
    try {
      const from = settings.ALERT_WHATSAPP_FROM.startsWith("whatsapp:")
        ? settings.ALERT_WHATSAPP_FROM
        : `whatsapp:${toE164(settings.ALERT_WHATSAPP_FROM)}`;
      const r = await twilioSend(`whatsapp:${adminPhone}`, from, text);
      channels["whatsapp"] = r.detail;
    } catch (e) {
      channels["whatsapp"] = `error: ${e instanceof Error ? e.message : String(e)}`;
    }
  } else channels["whatsapp"] = "not-configured";

  // 4. Email
  if (settings.ALERT_ADMIN_EMAIL && settings.RESEND_API_KEY) {
    try {
      const r = await sendEmail(
        settings.RESEND_API_KEY,
        settings.ALERT_ADMIN_EMAIL,
        `🚨 New OMORA order — ${alert.customerName ?? "Customer"}`,
        text,
      );
      channels["email"] = r.detail;
    } catch (e) {
      channels["email"] = `error: ${e instanceof Error ? e.message : String(e)}`;
    }
  } else channels["email"] = "not-configured";

  if (alertId) {
    await supabaseAdmin.from("order_alerts").update({ channels } as never).eq("id", alertId);
  }
}
