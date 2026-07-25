import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category: string;
  image_url: string;
  tags: string[] | null;
  featured: boolean;
  available: boolean;
  sort_order: number;
};

import crochetImg from "@/assets/collection-crochet.jpg";
import pipecleanerImg from "@/assets/collection-pipecleaner.jpg";
import babyImg from "@/assets/collection-baby.jpg";
import motherImg from "@/assets/collection-mother.jpg";
import airportImg from "@/assets/collection-airport.jpg";
import giftboxImg from "@/assets/collection-giftbox.jpg";
import corporateImg from "@/assets/collection-corporate.jpg";
import weddingImg from "@/assets/collection-wedding.jpg";

const imageMap: Record<string, string> = {
  "/src/assets/collection-crochet.jpg": crochetImg,
  "/src/assets/collection-pipecleaner.jpg": pipecleanerImg,
  "/src/assets/collection-baby.jpg": babyImg,
  "/src/assets/collection-mother.jpg": motherImg,
  "/src/assets/collection-airport.jpg": airportImg,
  "/src/assets/collection-giftbox.jpg": giftboxImg,
  "/src/assets/collection-corporate.jpg": corporateImg,
  "/src/assets/collection-wedding.jpg": weddingImg,
};

export function resolveProductImage(url: string, opts?: { width?: number; quality?: number }): string {
  const mapped = imageMap[url];
  if (mapped) return mapped;
  // Supabase Storage: rewrite public object URLs to the image render endpoint,
  // which auto-serves WebP to supporting browsers and resizes on the CDN edge.
  if (typeof url === "string" && url.includes("/storage/v1/object/public/")) {
    const rendered = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    const width = opts?.width ?? 1200;
    const quality = opts?.quality ?? 75;
    const sep = rendered.includes("?") ? "&" : "?";
    return `${rendered}${sep}width=${width}&quality=${quality}&resize=contain`;
  }
  return url;
}

async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("available", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Product[];
}

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: fetchProducts,
  staleTime: 60_000,
});

export function formatPrice(value: number): string {
  return `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
