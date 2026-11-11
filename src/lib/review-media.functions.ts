import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type SignedReviewMedia = { url: string; type: "image" | "video" };

function getObjectPath(value: string, userId: string, productId: string): string | null {
  let path = value;
  if (/^https?:\/\//i.test(value)) {
    try {
      const pathname = new URL(value).pathname;
      const marker = "/object/sign/review-media/";
      const publicMarker = "/object/public/review-media/";
      const start = pathname.indexOf(marker);
      const publicStart = pathname.indexOf(publicMarker);
      if (start >= 0) path = decodeURIComponent(pathname.slice(start + marker.length));
      else if (publicStart >= 0) path = decodeURIComponent(pathname.slice(publicStart + publicMarker.length));
      else return null;
    } catch {
      return null;
    }
  }
  if (!path.startsWith(`${userId}/${productId}/`) || path.includes("..") || path.startsWith("/")) return null;
  return path;
}

/** Returns short-lived links only for approved media belonging to the requested product. */
export const signApprovedReviewMedia = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ productId: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<Record<string, SignedReviewMedia[]>> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: reviews, error } = await supabaseAdmin
      .from("reviews")
      .select("id, user_id, media")
      .eq("product_id", data.productId)
      .eq("approved", true)
      .limit(100);
    if (error || !reviews?.length) return {};

    const pending: Array<{ reviewId: string; type: "image" | "video"; path: string }> = [];
    for (const review of reviews) {
      if (!review.user_id || !Array.isArray(review.media)) continue;
      for (const item of review.media as Array<{ url?: unknown; type?: unknown }>) {
        if (typeof item?.url !== "string") continue;
        const path = getObjectPath(item.url, review.user_id, data.productId);
        if (!path) continue;
        pending.push({
          reviewId: review.id,
          type: item.type === "video" ? "video" : "image",
          path,
        });
      }
    }
    if (!pending.length) return {};

    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from("review-media")
      .createSignedUrls(pending.map((item) => item.path), 60 * 10);
    if (signError || !signed) return {};

    const result: Record<string, SignedReviewMedia[]> = {};
    for (const item of pending) {
      const link = signed.find((entry) => entry.path === item.path)?.signedUrl;
      if (!link) continue;
      (result[item.reviewId] ??= []).push({ url: link, type: item.type });
    }
    return result;
  });