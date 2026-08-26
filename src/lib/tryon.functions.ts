import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({ imageUrl: z.string().url().max(2000) });

/**
 * Virtual Try-On asset pipeline.
 *
 * STRICT RULE: the catalog artwork is never redrawn or recoloured by AI.
 * We only run background removal (segmentation) so the EXACT catalog pixels
 * can be composited as a transparent PNG over the customer's own photo.
 */
export const cutoutCatalogImage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env["FAL_KEY"];
    if (!key) return { ok: false as const, error: "Try-On is not configured yet." };

    try {
      const res = await fetch("https://fal.run/fal-ai/imageutils/rembg", {
        method: "POST",
        headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: data.imageUrl, sync_mode: true }),
      });

      if (!res.ok) {
        const body = await res.text();
        return {
          ok: false as const,
          error: res.status === 401 ? "Try-On credentials are invalid." : `Cutout failed (${res.status}).`,
          detail: body.slice(0, 300),
        };
      }

      const json = (await res.json()) as { image?: { url?: string } };
      const url = json?.image?.url;
      if (!url) return { ok: false as const, error: "Cutout returned no image." };

      if (url.startsWith("data:")) return { ok: true as const, png: url };

      // Inline the PNG so the browser canvas can export it without CORS taint.
      const img = await fetch(url);
      if (!img.ok) return { ok: false as const, error: "Could not download cutout." };
      const buf = Buffer.from(await img.arrayBuffer());
      return { ok: true as const, png: `data:image/png;base64,${buf.toString("base64")}` };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Try-On failed." };
    }
  });
