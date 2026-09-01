import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Backend name of the fal.ai credential used by Virtual Try-On. */
export const FAL_SECRET_NAME = "FAL_KEY";

const saveSchema = z.object({
  apiKey: z
    .string()
    .trim()
    .min(20, "That key looks too short.")
    .max(500, "That key looks too long."),
});

/** Confirms the caller is an admin, or throws. */
async function assertAdmin(context: { supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> }; userId: string }) {
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
