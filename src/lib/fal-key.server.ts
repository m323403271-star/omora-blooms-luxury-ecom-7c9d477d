/**
 * Resolves the fal.ai credential for backend Try-On requests.
 *
 * Order of preference:
 *  1. The key an admin pasted into the dashboard (stored backend-only).
 *  2. The FAL_KEY environment secret.
 *
 * SECURITY: this module is server-only (`.server.ts`) and must never be
 * imported from a component or route module — the key must not reach a browser.
 */
export async function resolveFalKey(): Promise<string | undefined> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("app_secrets")
      .select("value")
      .eq("name", "FAL_KEY")
      .maybeSingle();

    if (error) console.error("[TryOn] could not read stored fal.ai key", error.message);
    const stored = data?.value?.trim();
    if (stored) return stored;
  } catch (e) {
    console.error("[TryOn] credential store unavailable", e instanceof Error ? e.message : e);
  }

  const fromEnv = process.env["FAL_KEY"]?.trim();
  return fromEnv || undefined;
}
