import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  paths: z
    .array(z.string().min(1).max(512).regex(/^[A-Za-z0-9._\-/ ]+$/))
    .max(200),
});

/**
 * Signs product-image paths server-side. The bucket has no public read rule,
 * so only this function (catalog artwork only) can mint short-lived links.
 */
export const signProductImagePaths = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const requested = new Set(data.paths.filter((p) => !p.includes("..") && !p.startsWith("/")));
    if (requested.size === 0) return {} as Record<string, string>;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Only sign files currently referenced by publicly available catalog rows.
    // Caller-supplied paths alone must never grant access to private uploads.
    const [productsResult, variantsResult, siteImagesResult] = await Promise.all([
      supabaseAdmin.from("products").select("id, image_url, images").eq("available", true),
      supabaseAdmin
        .from("product_variants")
        .select("product_id, images, video_url, product_video_url, packaging_video_url")
        .eq("active", true),
      supabaseAdmin.from("site_images").select("image_url"),
    ]);
    if (productsResult.error || variantsResult.error || siteImagesResult.error) {
      console.error("[Storage] Could not verify public catalog image paths");
      return {} as Record<string, string>;
    }

    const availableProductIds = new Set((productsResult.data ?? []).map((product) => product.id));
    const values: string[] = [];
    const addValue = (value: unknown) => {
      if (typeof value !== "string" || !value) return;
      const marker = "/product-images/";
      const markerIndex = value.indexOf(marker);
      const path = markerIndex >= 0
        ? value.slice(markerIndex + marker.length).split("?")[0]
        : value.startsWith("product-images/")
          ? value.slice("product-images/".length).split("?")[0]
          : !value.startsWith("http") && !value.startsWith("/") && !value.startsWith("data:")
            ? value.split("?")[0]
            : null;
      if (path && !path.includes("..") && !path.startsWith("/")) values.push(path);
    };

    for (const product of productsResult.data ?? []) {
      addValue(product.image_url);
      for (const image of product.images ?? []) addValue(image);
    }
    for (const variant of variantsResult.data ?? []) {
      if (!availableProductIds.has(variant.product_id)) continue;
      for (const image of variant.images ?? []) addValue(image);
      addValue(variant.video_url);
      addValue(variant.product_video_url);
      addValue(variant.packaging_video_url);
    }
    for (const image of siteImagesResult.data ?? []) addValue(image.image_url);

    const paths = [...requested].filter((path) => values.includes(path)).slice(0, 200);
    if (paths.length === 0) return {} as Record<string, string>;

    const { data: signed, error } = await supabaseAdmin.storage
      .from("product-images")
      .createSignedUrls(paths, 60 * 60);
    const out: Record<string, string> = {};
    if (error || !signed) return out;
    for (const s of signed) if (s.signedUrl && s.path) out[s.path] = s.signedUrl;
    return out;
  });
