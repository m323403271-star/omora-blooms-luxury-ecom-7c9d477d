import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { signProductImages } from "@/lib/storage-image";

export type SiteImage = {
  id: string;
  page_type: "homepage" | "subcategory";
  category_name: string | null;
  image_url: string;
  display_order: number;
  created_at: string;
};

export async function fetchSiteImages(): Promise<SiteImage[]> {
  const { data, error } = await supabase
    .from("site_images")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as SiteImage[];
  const signed = await signProductImages(rows.map((r) => r.image_url));
  return rows.map((r) => ({ ...r, image_url: signed[r.image_url] ?? r.image_url }));
}

export const siteImagesQuery = queryOptions({
  queryKey: ["site_images"],
  queryFn: fetchSiteImages,
  staleTime: 0,
});

/** First homepage image attached to a given card/collection slug. */
export function homepageImageFor(images: SiteImage[] | undefined, slug: string) {
  return images?.find((i) => i.page_type === "homepage" && i.category_name === slug)?.image_url;
}

export function subcategoryImages(images: SiteImage[] | undefined, slug: string) {
  return (images ?? []).filter((i) => i.page_type === "subcategory" && i.category_name === slug);
}
