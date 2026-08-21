import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { signProductImages } from "@/lib/storage-image";

export type ProductVariantRow = {
  id: string;
  product_id: string;
  slug: string;
  name: string;
  color_name: string;
  color_hex: string;
  price: number;
  description: string | null;
  images: string[];
  video_url: string | null;
  product_video_url: string | null;
  packaging_video_url: string | null;
  active: boolean;
  sort_order: number;
  stock: number;
  track_stock: boolean;
};

/** A shade is sold out only when stock tracking is switched on and it hit zero. */
export const isSoldOut = (v: Pick<ProductVariantRow, "stock" | "track_stock">) =>
  Boolean(v.track_stock) && Number(v.stock) <= 0;

export const isVideoRef = (v: string) => /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i.test(v);

async function signRows(rows: ProductVariantRow[]): Promise<ProductVariantRow[]> {
  const all: string[] = [];
  for (const r of rows) {
    for (const u of r.images ?? []) if (u) all.push(u);
    if (r.video_url) all.push(r.video_url);
    if (r.product_video_url) all.push(r.product_video_url);
    if (r.packaging_video_url) all.push(r.packaging_video_url);
  }
  const signed = await signProductImages(all);
  return rows.map((r) => ({
    ...r,
    price: Number(r.price),
    images: (r.images ?? []).map((u) => signed[u] ?? u),
    video_url: r.video_url ? signed[r.video_url] ?? r.video_url : null,
    product_video_url: r.product_video_url ? signed[r.product_video_url] ?? r.product_video_url : null,
    packaging_video_url: r.packaging_video_url ? signed[r.packaging_video_url] ?? r.packaging_video_url : null,
  }));
}

const SELECT =
  "id, product_id, slug, name, color_name, color_hex, price, description, images, video_url, product_video_url, packaging_video_url, active, sort_order, stock, track_stock";

/** Active variants for one product (Pick Your Shade page). */
export function activeVariantsQuery(productId: string | undefined) {
  return queryOptions({
    queryKey: ["product-variants", productId ?? "none"],
    enabled: Boolean(productId),
    staleTime: 0,
    queryFn: async (): Promise<ProductVariantRow[]> => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("product_variants")
        .select(SELECT)
        .eq("product_id", productId)
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error || !data) return [];
      return signRows(data as unknown as ProductVariantRow[]);
    },
  });
}

/** A single active variant by slug (final product / order page). */
export const variantBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product-variant", slug],
    staleTime: 0,
    queryFn: async (): Promise<ProductVariantRow | null> => {
      const { data, error } = await supabase
        .from("product_variants")
        .select(SELECT)
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();
      if (error || !data) return null;
      const [row] = await signRows([data as unknown as ProductVariantRow]);
      return row ?? null;
    },
  });
