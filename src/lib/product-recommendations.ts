import type { RecommendedProduct } from "@/components/recommendations";
import { resolveProductImage, type Product } from "@/lib/products";

/**
 * Adapter: maps existing catalog products onto the self-contained
 * recommendations module's shape. No product data is mutated.
 */
export function toRecommendedProduct(product: Product): RecommendedProduct {
  const image = resolveProductImage(product.images?.[0] || product.image_url);
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    currency: "INR",
    locale: "en-IN",
    href: `/products/${product.slug}`,
    ...(product.tagline ? { brand: product.tagline } : {}),
    ...(product.compare_at_price ? { compareAtPrice: product.compare_at_price } : {}),
    ...(image ? { imageUrl: image } : {}),
    ...(product.featured ? { badge: "Bestseller" } : {}),
  };
}

/** Same-collection picks, falling back to featured pieces from the wider catalog. */
export function pickYouMightAlsoLike(all: Product[], current: Product, limit = 4): Product[] {
  const sameCategory = all.filter((p) => p.category === current.category && p.id !== current.id);
  const others = all.filter((p) => p.category !== current.category && p.id !== current.id);
  return [...sameCategory, ...others].slice(0, limit);
}

/** Featured / popular pieces across collections, excluding the current product. */
export function pickPeopleAlsoViewed(all: Product[], current: Product, limit = 8): Product[] {
  const featured = all.filter((p) => p.featured && p.id !== current.id);
  const rest = all.filter((p) => !p.featured && p.id !== current.id);
  return [...featured, ...rest].slice(0, limit);
}
