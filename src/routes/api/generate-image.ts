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
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        // Reference images, in order: [customer photo (identity lock),
        // exact catalog product (texture lock)]. Any of them may be omitted.
        const refs = (referenceImages ?? (referenceImage ? [referenceImage] : []))
          .filter((u) => typeof u === "string" && /^(data:image\/|https?:\/\/)/.test(u))
          .slice(0, 3);

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
