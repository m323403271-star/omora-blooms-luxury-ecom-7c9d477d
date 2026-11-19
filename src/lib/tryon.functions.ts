import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const schema = z.object({ imageUrl: z.string().url().max(2000) });

/** Stable reference used to compare a submitted URL with a catalog image. */
function catalogImageReference(raw: string, trustedStorageHost: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return null;
    const marker = "/product-images/";
    const markerIndex = url.pathname.indexOf(marker);
    if (trustedStorageHost && url.hostname.toLowerCase() === trustedStorageHost && markerIndex >= 0) {
      const path = decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
      return path && !path.includes("..") ? `storage:${path}` : null;
    }

    const hostname = url.hostname.toLowerCase();
    const isOmoraHost = hostname === "omorablooms.in" || hostname.endsWith(".omorablooms.in");
    const isLovableSite = hostname === "omora-blooms-luxury-ecom.lovable.app" || hostname === "id-preview--9b70daa9-6a74-48da-91ba-28f391def9de.lovable.app";
    if (!isOmoraHost && !isLovableSite) return null;
    return `url:${hostname}${url.pathname}`;
  } catch {
    return null;
  }
}

async function isCatalogImage(raw: string): Promise<boolean> {
  const storageHost = process.env["SUPABASE_URL"]
    ? new URL(process.env["SUPABASE_URL"]).hostname.toLowerCase()
    : "";
  const submittedReference = catalogImageReference(raw, storageHost);
  if (!submittedReference) return false;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [productsResult, variantsResult] = await Promise.all([
    supabaseAdmin.from("products").select("id, image_url, images").eq("available", true),
    supabaseAdmin.from("product_variants").select("product_id, images, active").eq("active", true),
  ]);
  if (productsResult.error || variantsResult.error) return false;

  const availableIds = new Set((productsResult.data ?? []).map((product) => product.id));
  const catalogValues: string[] = [];
  for (const product of productsResult.data ?? []) {
    if (product.image_url) catalogValues.push(product.image_url);
    catalogValues.push(...(product.images ?? []));
  }
  for (const variant of variantsResult.data ?? []) {
    if (availableIds.has(variant.product_id)) catalogValues.push(...(variant.images ?? []));
  }

  return catalogValues.some((value) => catalogImageReference(value, storageHost) === submittedReference);
}

/**
 * Virtual Try-On asset pipeline.
 *
 * STRICT RULE: the catalog artwork is never redrawn or recoloured by AI.
 * We only run background removal (segmentation) so the EXACT catalog pixels
 * can be composited as a transparent PNG over the customer's own photo.
 */
export const cutoutCatalogImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    if (!(await isCatalogImage(data.imageUrl))) {
      return { ok: false as const, error: "Only Omora catalog images can be used for Try-On." };
    }
    const { resolveFalKey } = await import("@/lib/fal-key.server");
    const key = await resolveFalKey();
    if (!key) return { ok: false as const, error: "Try-On is not configured yet." };

    try {
      const res = await fetch("https://fal.run/fal-ai/imageutils/rembg", {
        method: "POST",
        headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: data.imageUrl, sync_mode: true }),
      });

      if (!res.ok) {
        const body = await res.text();
        console.error("[TryOn] cutout failed", res.status, body.slice(0, 300));
        return {
          ok: false as const,
          error: res.status === 401 ? "Try-On credentials are invalid." : "Cutout failed. Please try again.",
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
      console.error("[TryOn] cutout error", e instanceof Error ? e.message : e);
      return { ok: false as const, error: "Try-On failed. Please try again." };
    }
  });
