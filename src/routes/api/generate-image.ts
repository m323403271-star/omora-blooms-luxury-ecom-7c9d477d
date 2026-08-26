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
        const { prompt } = (await request.json()) as { prompt?: string };
        if (!prompt || prompt.length > 1200) {
          return new Response("Invalid prompt", { status: 400 });
        }
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "openai/gpt-image-2", prompt, quality: "low" }),
        });

        if (!upstream.ok) {
          return new Response(await upstream.text(), { status: upstream.status });
        }
        return new Response(upstream.body, { headers: { "Content-Type": "application/json" } });
      },
    },
  },
});
