export interface RecommendedProduct {
  id: string;
  name: string;
  brand?: string;
  price: number;
  compareAtPrice?: number;
  currency?: string;
  /** Intl locale used for price formatting, e.g. "en-IN". */
  locale?: string;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  /** Fallback tint used when no imageUrl is provided (any valid CSS color / gradient). */
  imageTint?: string;
  badge?: string;
  href?: string;
}

export type RecommendationLayout = "grid" | "carousel";

/** Visual tone so the block sits on light or dark product pages. */
export type RecommendationTone = "light" | "dark";
