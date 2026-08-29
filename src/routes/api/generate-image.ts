import { createFileRoute } from "@tanstack/react-router";

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
        const geminiKey = process.env["GEMINI_API_KEY"];
        const key = process.env["LOVABLE_API_KEY"];
        if (!key && !geminiKey) return new Response("Missing image generation key", { status: 500 });


        // Reference images, in order: [customer photo (identity lock),
        // exact catalog product (texture lock)]. Any of them may be omitted.
        const refs = (referenceImages ?? (referenceImage ? [referenceImage] : []))
          .filter((u) => typeof u === "string" && /^(data:image\/|https?:\/\/)/.test(u))
          .slice(0, 3);

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
          if (!key) return new Response(lastError || "Gemini failed", { status: lastStatus });
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
          return new Response(await upstream.text(), { status: upstream.status });
        }
        return new Response(upstream.body, { headers: { "Content-Type": "application/json" } });
      },
    },
  },
});
