import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const SaveCartCallInput = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(10).max(20),
  items: z.string().trim().min(1).max(1500),
});

function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (raw.trim().startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return `+${digits}`;
}

export const saveCartAndCall = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SaveCartCallInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["BLAND_API_KEY"];
    const personaId = process.env["BLAND_PERSONA_ID"];
    if (!apiKey || !personaId) {
      const missingKeys = [!apiKey && "BLAND_API_KEY", !personaId && "BLAND_PERSONA_ID"]
        .filter(Boolean)
        .join(", ");
      console.error("Bland AI config missing", missingKeys);
      return { ok: false as const, error: `Concierge calling is not configured yet (missing: ${missingKeys}).` };
    }

    const phone = normalizePhone(data.phone);
    if (!/^\+\d{10,15}$/.test(phone)) {
      return { ok: false as const, error: "Please enter a valid mobile number." };
    }

    let ip: string | null = null;
    try {
      const req = getRequest();
      ip =
        req.headers.get("cf-connecting-ip") ??
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        null;
    } catch {
      ip = null;
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");


    const task = `Luxury concierge for Omora Blooms calling ${data.name}. Speak Kannada (switch to EN/HI if user replies so). Assist with saved cart items (${data.items}), customizations, or express delivery. NEVER offer discounts proactively; ONLY if customer asks for price reduction, provide 5% off coupon code 'LUXURY5' for checkout.`;

    try {
      const res = await fetch("https://api.bland.ai/v1/calls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: phone,
          persona_id: personaId,
          language: "kn",
          task,
          variables: {
            customer_name: data.name,
            cart_items: data.items,
            coupon_code: "LUXURY5",
          },
        }),
      });

      const raw = await res.text();
      let parsed: unknown = null;
      try { parsed = JSON.parse(raw); } catch { parsed = null; }
      console.error("Bland AI response", {
        status: res.status,
        ok: res.ok,
        body: raw.slice(0, 1000),
      });

      const apiStatus = (parsed as { status?: string } | null)?.status;
      const apiMessage =
        (parsed as { message?: string; error?: string; errors?: unknown } | null)?.message ??
        (parsed as { error?: string } | null)?.error ??
        null;

      if (!res.ok || apiStatus === "error") {
        return {
          ok: false as const,
          error: `Concierge call failed (HTTP ${res.status})${apiMessage ? `: ${apiMessage}` : `: ${raw.slice(0, 200) || "no response body"}`}`,
          debug: { status: res.status, body: raw.slice(0, 1000) },
        };
      }

      await supabaseAdmin
        .from("concierge_call_log")
        .insert({ phone, ip } as never);

      return { ok: true as const, debug: { status: res.status, body: raw.slice(0, 500) } };
    } catch (err) {
      console.error("Bland AI call error", err);
      const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      return { ok: false as const, error: `Could not reach the calling service — ${msg}` };
    }
  });
