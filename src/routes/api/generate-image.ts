import { createFileRoute } from "@tanstack/react-router";

type GeneratedImage = { b64_json?: string; url?: string };

function readServerSecret(name: string): string | undefined {
  const processValue = process.env[name]?.trim();
  if (processValue) return processValue;

  // TanStack Start uses process.env, while maintained Deno-based deployments
  // expose the same encrypted secret through Deno.env. Never use a client key.
  const deno = (globalThis as { Deno?: { env?: { get?: (key: string) => string | undefined } } }).Deno;
  return deno?.env?.get?.(name)?.trim() || undefined;
}

async function generateWithFal(
  key: string,
  prompt: string,
  refs: string[],
): Promise<{ data: GeneratedImage[] }> {
  const response = await fetch("https://fal.run/fal-ai/nano-banana/edit", {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_urls: refs,
      num_images: 1,
      output_format: "png",
    }),
  });

  if (!response.ok) {
    console.error("[TryOn] fal.ai generation failed", response.status, (await response.text()).slice(0, 500));
    throw new Error(`fal.ai generation failed (${response.status})`);
  }

  const result = (await response.json()) as {
    images?: Array<{ url?: string }>;
    image?: { url?: string };
  };
  const url = result.images?.[0]?.url ?? result.image?.url;
  if (!url) throw new Error("fal.ai returned no image");
  return { data: [{ url }] };
}

async function authenticateAndConsumeTrial(request: Request): Promise<number> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("AUTH_REQUIRED");

  const supabaseUrl = process.env["SUPABASE_URL"];
  const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!supabaseUrl || !publishableKey) throw new Error("BACKEND_AUTH_NOT_CONFIGURED");

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: publishableKey, Authorization: authorization },
  });
  if (!userResponse.ok) throw new Error("AUTH_REQUIRED");
  const user = (await userResponse.json()) as { id?: string };
  if (!user.id) throw new Error("AUTH_REQUIRED");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("consume_tryon_trial", { _user_id: user.id });
  if (error || typeof data !== "number") {
    console.error("[TryOn] trial counter failed", error?.message);
    throw new Error("TRIAL_COUNTER_FAILED");
  }
  return data;
}

/**
 * Try-On scene generator.
 * NOTE: this NEVER draws the product — it only generates an empty model/room
 * backdrop. The exact catalog cutout is composited on top client-side.
 */
export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { prompt, referenceImage, referenceImages } = (await request.json()) as {
          prompt?: string;
          referenceImage?: string;
          referenceImages?: string[];
        };
        if (!prompt || prompt.length > 3000) {
          return new Response("Invalid prompt", { status: 400 });
        }
        let trialCount: number;
        try {
          trialCount = await authenticateAndConsumeTrial(request);
        } catch (error) {
          const code = error instanceof Error ? error.message : "";
          if (code === "AUTH_REQUIRED") return new Response("Sign in to use Virtual Try-On", { status: 401 });
          return new Response("Try-On usage tracking is unavailable", { status: 503 });
        }

        // Runtime secrets are read inside the request handler so the current
        // values are injected on every invocation.
        const geminiKey = readServerSecret("GEMINI_API_KEY");
        const key = readServerSecret("LOVABLE_API_KEY");


        // Reference images, in order: [customer photo (identity lock),
        // exact catalog product (texture lock)]. Any of them may be omitted.
        const refs = (referenceImages ?? (referenceImage ? [referenceImage] : []))
          .filter((u) => typeof u === "string" && /^(data:image\/|https?:\/\/)/.test(u))
          .slice(0, 3);

        // The merchant's own fal.ai account is the universal safety net: it is
        // used once the free trials are spent AND whenever the included
        // providers fail (quota exhausted, no credits, rate limited, errors).
        const tryFal = async (): Promise<Response | null> => {
          const { resolveFalKey } = await import("@/lib/fal-key.server");
          const falKey = await resolveFalKey();
          if (!falKey) {
            console.error("[TryOn] no fal.ai key configured (dashboard or environment)");
            return null;
          }
          try {
            return Response.json(await generateWithFal(falKey, prompt, refs));
          } catch (e) {
            console.error("[TryOn] fal.ai fallback failed", e instanceof Error ? e.message : e);
            return null;
          }
        };

        if (trialCount > 4) {
          const falResponse = await tryFal();
          if (falResponse) return falResponse;
          if (!key && !geminiKey) {
            return new Response("Virtual Try-On is temporarily unavailable", { status: 503 });
          }
          // No usable fal key — fall through and try the included providers.
        }

        if (!key && !geminiKey) {
          const falResponse = await tryFal();
          if (falResponse) return falResponse;
          return new Response("Missing image generation key", { status: 500 });
        }


        // Preferred path: the merchant's own Google Gemini key (direct API).
        if (geminiKey) {
          const parts: Array<Record<string, unknown>> = [{ text: prompt }];
          for (const url of refs) {
            if (url.startsWith("data:")) {
              const [meta, b64] = url.split(",");
              const mime = meta?.slice(5).split(";")[0] || "image/png";
              if (b64) parts.push({ inlineData: { mimeType: mime, data: b64 } });
            } else {
              const r = await fetch(url);
              if (!r.ok) continue;
              const b = Buffer.from(await r.arrayBuffer()).toString("base64");
              parts.push({
                inlineData: { mimeType: r.headers.get("content-type") || "image/png", data: b },
              });
            }
          }

          // Try the highest quality model first, then a lighter one if the
          // personal key's quota/plan does not cover it.
          const models = ["gemini-3-pro-image-preview", "gemini-2.5-flash-image"];
          let lastError = "";
          let lastStatus = 502;
          for (const model of models) {
            const g = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
              {
                method: "POST",
                headers: { "x-goog-api-key": geminiKey, "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ role: "user", parts }] }),
              },
            );
            if (!g.ok) {
              lastStatus = g.status;
              lastError = await g.text();
              continue;
            }
            const gj = (await g.json()) as {
              candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string } }> } }>;
            };
            const b64 = gj.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)
              ?.inlineData?.data;
            if (b64) {
              return new Response(JSON.stringify({ data: [{ b64_json: b64 }] }), {
                headers: { "Content-Type": "application/json" },
              });
            }
            lastStatus = 502;
            lastError = "Gemini returned no image";
          }
          // Personal key failed — fall back to the built-in gateway when available.
          if (!key) {
            const falResponse = await tryFal();
            if (falResponse) return falResponse;
            return new Response(lastError || "Gemini failed", { status: lastStatus });
          }
        }


        // Fallback: Lovable AI gateway.
        // With references we use a Gemini image model so it can inpaint the
        // exact catalog product into the hands while locking the face.
        const body =
          refs.length > 0
            ? {
                model: "google/gemini-3.1-flash-image",
                messages: [
                  {
                    role: "user",
                    content: [
                      { type: "text", text: prompt },
                      ...refs.map((url) => ({ type: "image_url", image_url: { url } })),
                    ],
                  },
                ],
                modalities: ["image", "text"],
              }
            : { model: "openai/gpt-image-2", prompt, quality: "low" };

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });


        if (!upstream.ok) {
          const detail = await upstream.text();
          console.error("[TryOn] gateway failed", upstream.status, detail.slice(0, 300));
          // Credits exhausted, rate limited, or upstream error — use the
          // merchant's saved fal.ai key instead of failing.
          const falResponse = await tryFal();
          if (falResponse) return falResponse;
          return new Response(detail, { status: upstream.status });
        }

        return new Response(upstream.body, { headers: { "Content-Type": "application/json" } });
      },
    },
  },
});
