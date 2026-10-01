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
    const paths = data.paths.filter((p) => !p.includes("..") && !p.startsWith("/"));
    if (paths.length === 0) return {} as Record<string, string>;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("product-images")
      .createSignedUrls(paths, 60 * 60 * 24 * 7);
    const out: Record<string, string> = {};
    if (error || !signed) return out;
    for (const s of signed) if (s.signedUrl && s.path) out[s.path] = s.signedUrl;
    return out;
  });
