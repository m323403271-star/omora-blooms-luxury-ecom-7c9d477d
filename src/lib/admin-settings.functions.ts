import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

/** Backend name of the fal.ai credential used by Virtual Try-On. */
export const FAL_SECRET_NAME = "FAL_KEY";

const saveSchema = z.object({
  apiKey: z
    .string()
    .trim()
    .min(20, "That key looks too short.")
    .max(500, "That key looks too long."),
});

/** Confirms the caller is an admin, or throws. Uses the caller's own client. */
async function assertAdmin(context: {
  supabase: SupabaseClient<Database>;
  userId: string;
}) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (data !== true) throw new Error("Forbidden");
}

/**
 * Saves the fal.ai API key into the backend-only credential store.
 *
 * SECURITY: the value is written with the service role and is never readable
 * from the browser — no client role has any privilege on `app_secrets`.
 */
export const saveFalApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => saveSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("set_app_secret", {
      _name: FAL_SECRET_NAME,
      _value: data.apiKey,
      _actor: context.userId,
    });

    if (error) {
      console.error("[AdminSettings] could not save fal.ai key", error.message);
      return { ok: false as const, error: "Could not save the key. Please try again." };
    }
    return { ok: true as const };
  });

/**
 * Reports whether a fal.ai key is configured. Returns only a yes/no plus the
 * last update time — never the key itself, not even to an admin.
 */
export const getFalApiKeyStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("app_secrets")
      .select("updated_at")
      .eq("name", FAL_SECRET_NAME)
      .maybeSingle();

    const envConfigured = Boolean(process.env["FAL_KEY"]?.trim());

    return {
      savedInDashboard: Boolean(data),
      updatedAt: data?.updated_at ?? null,
      envConfigured,
    };
  });

/** Names of the alert-routing settings stored backend-only. */
const ALERT_FIELDS = [
  "ALERT_ADMIN_PHONE",
  "ALERT_ADMIN_EMAIL",
  "ALERT_SMS_FROM",
  "ALERT_WHATSAPP_FROM",
  "RESEND_API_KEY",
] as const;

const alertSchema = z.object({
  ALERT_ADMIN_PHONE: z.string().trim().max(20).optional(),
  ALERT_ADMIN_EMAIL: z.string().trim().max(255).optional(),
  ALERT_SMS_FROM: z.string().trim().max(30).optional(),
  ALERT_WHATSAPP_FROM: z.string().trim().max(40).optional(),
  RESEND_API_KEY: z.string().trim().max(500).optional(),
});

/** Which alert channels are ready (never returns the stored values). */
export const getAlertSettingsStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("app_secrets")
      .select("name")
      .in("name", ALERT_FIELDS as unknown as string[]);
    const saved = new Set(((data ?? []) as Array<{ name: string }>).map((r) => r.name));
    const configured = {} as Record<(typeof ALERT_FIELDS)[number], boolean>;
    for (const f of ALERT_FIELDS) configured[f] = saved.has(f) || Boolean(process.env[f]?.trim());
    return {
      ...configured,
      pushReady: Boolean(process.env["VAPID_PUBLIC_KEY"]?.trim()),
      twilioReady: Boolean(process.env["TWILIO_API_KEY"]?.trim()),
    };
  });

/** Saves the alert recipients / sender numbers. Empty fields are left untouched. */
export const saveAlertSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => alertSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (const field of ALERT_FIELDS) {
      const value = data[field]?.trim();
      if (!value) continue;
      const { error } = await supabaseAdmin.rpc("set_app_secret", {
        _name: field,
        _value: value,
        _actor: context.userId,
      });
      if (error) {
        console.error("[AdminSettings] could not save alert setting", field, error.message);
        return { ok: false as const, error: "Could not save. Please try again." };
      }
    }
    return { ok: true as const };
  });
