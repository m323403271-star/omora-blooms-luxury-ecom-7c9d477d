import { createServerFn } from "@tanstack/react-start";
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
      return { ok: false as const, error: "Concierge calling is not configured yet." };
    }

    const phone = normalizePhone(data.phone);
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

      if (!res.ok) {
        const detail = await res.text();
        console.error("Bland AI call failed", res.status, detail.slice(0, 500));
        return { ok: false as const, error: "Our concierge line is busy. Please try again shortly." };
      }

      return { ok: true as const };
    } catch (err) {
      console.error("Bland AI call error", err);
      return { ok: false as const, error: "Could not reach our concierge line right now." };
    }
  });
