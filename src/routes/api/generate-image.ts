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
        const { prompt, referenceImage } = (await request.json()) as {
          prompt?: string;
          referenceImage?: string;
        };
        if (!prompt || prompt.length > 1600) {
          return new Response("Invalid prompt", { status: 400 });
        }
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        // With a selfie we use a Gemini image model so the generated model pose
        // matches the person's apparent age group and gender. Without one we
        // fall back to a plain text-to-image backdrop.
        const body =
          referenceImage && referenceImage.startsWith("data:image/")
            ? {
                model: "google/gemini-3.1-flash-image",
                messages: [
                  {
                    role: "user",
                    content: [
                      { type: "text", text: prompt },
                      { type: "image_url", image_url: { url: referenceImage } },
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
