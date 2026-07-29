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
  images?: string[] | null;
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
import giftboxImg from "@/assets/divine-heritage-giftbox.jpg";
import corporateImg from "@/assets/collection-corporate.jpg";
import weddingImg from "@/assets/collection-wedding.jpg";
import indoorPlantsImg from "@/assets/collection-indoor-plants.jpg";
import framesVasesImg from "@/assets/collection-frames-vases.jpg";
import plainGiftboxImg from "@/assets/collection-giftbox.jpg";

const imageMap: Record<string, string> = {
  "/src/assets/collection-crochet.jpg": crochetImg,
  "/src/assets/collection-pipecleaner.jpg": pipecleanerImg,
  "/src/assets/collection-baby.jpg": babyImg,
  "/src/assets/collection-mother.jpg": motherImg,
  "/src/assets/collection-airport.jpg": airportImg,
  "/src/assets/collection-giftbox.jpg": plainGiftboxImg,
  "/src/assets/divine-heritage-giftbox.jpg": giftboxImg,
  "/src/assets/collection-corporate.jpg": corporateImg,
  "/src/assets/collection-wedding.jpg": weddingImg,
  "/src/assets/collection-indoor-plants.jpg": indoorPlantsImg,
  "/src/assets/collection-frames-vases.jpg": framesVasesImg,
  "/src/assets/collection-divine-heritage.jpg": giftboxImg,
};


export function resolveProductImage(url: string, opts?: { width?: number; quality?: number }): string {
  const mapped = imageMap[url];
  if (mapped) return mapped;
  return url;
}

// 6 New Homepage Products
export const LOCAL_PRODUCTS: Product[] = [
  {
    id: "1",
    slug: "divine-heritage-luxury-gift-box",
    name: "Divine Heritage Luxury Gift Box",
    tagline: "Premium Festive Gifting",
    description: "Exquisite handcrafted heritage gift box for grand celebrations.",
    price: 3999,
    compare_at_price: 4999,
    category: "Gift Boxes",
    image_url: giftboxImg,
    tags: ["Luxury", "Gift Box"],
    featured: true,
    available: true,
    sort_order: 1,
  },
  {
    id: "2",
    slug: "mini-indoor-plants",
    name: "Mini Indoor Plants",
    tagline: "Fresh Greenery",
    description: "Beautiful low-maintenance indoor plants in premium pots.",
    price: 1299,
    compare_at_price: 1599,
    category: "Plants",
    image_url: babyImg,
    tags: ["Plants", "Eco Friendly"],
    featured: true,
    available: true,
    sort_order: 2,
  },
  {
    id: "3",
    slug: "luxury-airport-welcome-bouquet",
    name: "Luxury Airport Welcome Bouquet",
    tagline: "Express Welcome Delight",
    description: "Elegant bouquet designed specially for grand airport welcomes.",
    price: 2499,
    compare_at_price: 2999,
    category: "Bouquets",
    image_url: airportImg,
    tags: ["Airport Zone", "Bouquet"],
    featured: true,
    available: true,
    sort_order: 3,
  },
  {
    id: "4",
    slug: "signature-crochet-bouquet",
    name: "Signature Crochet Bouquet",
    tagline: "Forever Flowers",
    description: "Handcrafted crochet flowers that last forever.",
    price: 3499,
    compare_at_price: 3999,
    category: "Crochet",
    image_url: crochetImg,
    tags: ["Crochet", "Handmade"],
    featured: true,
    available: true,
    sort_order: 4,
  },
  {
    id: "5",
    slug: "pipe-cleaner-flower-art",
    name: "Pipe Cleaner Flower Art",
    tagline: "Vibrant Artistry",
    description: "Unique pipe cleaner bouquet crafted with fine precision.",
    price: 1899,
    compare_at_price: 2199,
    category: "Crafts",
    image_url: pipecleanerImg,
    tags: ["Art", "Special"],
    featured: true,
    available: true,
    sort_order: 5,
  },
  {
    id: "6",
    slug: "corporate-luxury-gifting",
    name: "Corporate Luxury Hamper",
    tagline: "Professional Gifting",
    description: "Elegantly curated corporate gifting suite for business clients.",
    price: 4999,
    compare_at_price: 5999,
    category: "Corporate",
    image_url: corporateImg,
    tags: ["Corporate", "Luxury"],
    featured: true,
    available: true,
    sort_order: 6,
  },
];

async function fetchProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, slug, name, tagline, description, price, compare_at_price, category, image_url, images, tags, featured, available, sort_order",
      )
      .eq("available", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) return LOCAL_PRODUCTS;
    return data.map((p) => ({ ...p, price: Number(p.price), compare_at_price: p.compare_at_price === null ? null : Number(p.compare_at_price) })) as Product[];
  } catch {
    return LOCAL_PRODUCTS;
  }
}


export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: fetchProducts,
  staleTime: 60_000,
});

export function formatPrice(value: number): string {
  return `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
