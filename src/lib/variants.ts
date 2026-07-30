import crochetImg from "@/assets/collection-crochet.jpg";
import pipecleanerImg from "@/assets/collection-pipecleaner.jpg";
import babyImg from "@/assets/collection-baby.jpg";
import giftboxImg from "@/assets/collection-giftbox.jpg";
import corporateImg from "@/assets/collection-corporate.jpg";
import weddingImg from "@/assets/collection-wedding.jpg";
import indoorPlantsImg from "@/assets/collection-indoor-plants.jpg";
import framesVasesImg from "@/assets/collection-frames-vases.jpg";
import airportImg from "@/assets/collection-airport.jpg";
import motherImg from "@/assets/collection-mother.jpg";

export type ProductVariant = {
  slug: string;
  name: string;
  price: number;
  colorName: string;
  colorHex: string;
  image: string;
  parentName: string;
  parentSlug: string;
  collectionSlug: string;
};

// ─── Crochet Bouquet Variants ────────────────────────────────────────────────
const CROCHET_VARIANTS: ProductVariant[] = [
  { slug: "crochet-rose-blush-pink", name: "Luxury Rose Bouquet — Blush Pink", price: 2799, colorName: "Blush Pink", colorHex: "#E8A0B0", image: crochetImg, parentName: "Luxury Crochet Rose Bouquet", parentSlug: "signature-crochet-bouquet", collectionSlug: "crochet-bouquets" },
  { slug: "crochet-rose-crimson-red", name: "Luxury Rose Bouquet — Crimson Red", price: 3199, colorName: "Crimson Red", colorHex: "#A01020", image: crochetImg, parentName: "Luxury Crochet Rose Bouquet", parentSlug: "signature-crochet-bouquet", collectionSlug: "crochet-bouquets" },
  { slug: "crochet-rose-ivory-white", name: "Luxury Rose Bouquet — Ivory White", price: 2999, colorName: "Ivory White", colorHex: "#F5F0E0", image: crochetImg, parentName: "Luxury Crochet Rose Bouquet", parentSlug: "signature-crochet-bouquet", collectionSlug: "crochet-bouquets" },
  { slug: "crochet-rose-lavender", name: "Luxury Rose Bouquet — Lavender Purple", price: 3099, colorName: "Lavender", colorHex: "#9B7BB6", image: crochetImg, parentName: "Luxury Crochet Rose Bouquet", parentSlug: "signature-crochet-bouquet", collectionSlug: "crochet-bouquets" },
  { slug: "crochet-rose-sunshine-yellow", name: "Luxury Rose Bouquet — Sunshine Yellow", price: 2799, colorName: "Sunshine Yellow", colorHex: "#D4A820", image: crochetImg, parentName: "Luxury Crochet Rose Bouquet", parentSlug: "signature-crochet-bouquet", collectionSlug: "crochet-bouquets" },
  { slug: "crochet-rose-deep-burgundy", name: "Luxury Rose Bouquet — Deep Burgundy", price: 3299, colorName: "Deep Burgundy", colorHex: "#6D1A36", image: crochetImg, parentName: "Luxury Crochet Rose Bouquet", parentSlug: "signature-crochet-bouquet", collectionSlug: "crochet-bouquets" },
  { slug: "crochet-rose-peach-coral", name: "Luxury Rose Bouquet — Peach Coral", price: 2899, colorName: "Peach Coral", colorHex: "#E07850", image: crochetImg, parentName: "Luxury Crochet Rose Bouquet", parentSlug: "signature-crochet-bouquet", collectionSlug: "crochet-bouquets" },
  { slug: "crochet-rose-sage-green", name: "Luxury Rose Bouquet — Sage Green", price: 2999, colorName: "Sage Green", colorHex: "#6A9E6A", image: crochetImg, parentName: "Luxury Crochet Rose Bouquet", parentSlug: "signature-crochet-bouquet", collectionSlug: "crochet-bouquets" },
  { slug: "crochet-rose-ocean-blue", name: "Luxury Rose Bouquet — Ocean Blue", price: 3199, colorName: "Ocean Blue", colorHex: "#2E6A9A", image: crochetImg, parentName: "Luxury Crochet Rose Bouquet", parentSlug: "signature-crochet-bouquet", collectionSlug: "crochet-bouquets" },
  { slug: "crochet-rose-midnight-black", name: "Luxury Rose Bouquet — Midnight Black", price: 3499, colorName: "Midnight Black", colorHex: "#1E1E2E", image: crochetImg, parentName: "Luxury Crochet Rose Bouquet", parentSlug: "signature-crochet-bouquet", collectionSlug: "crochet-bouquets" },
];

// ─── Pipe Cleaner Variants ────────────────────────────────────────────────────
const PIPE_CLEANER_VARIANTS: ProductVariant[] = [
  { slug: "pipe-rose-flamingo-pink", name: "Artisan Pipe Bouquet — Flamingo Pink", price: 1799, colorName: "Flamingo Pink", colorHex: "#F06090", image: pipecleanerImg, parentName: "Pipe Cleaner Bouquet", parentSlug: "pipe-cleaner-flower-art", collectionSlug: "pipe-cleaner-bouquets" },
  { slug: "pipe-rose-ruby-red", name: "Artisan Pipe Bouquet — Ruby Red", price: 1999, colorName: "Ruby Red", colorHex: "#9B1020", image: pipecleanerImg, parentName: "Pipe Cleaner Bouquet", parentSlug: "pipe-cleaner-flower-art", collectionSlug: "pipe-cleaner-bouquets" },
  { slug: "pipe-rose-golden-yellow", name: "Artisan Pipe Bouquet — Golden Yellow", price: 1699, colorName: "Golden Yellow", colorHex: "#C8A200", image: pipecleanerImg, parentName: "Pipe Cleaner Bouquet", parentSlug: "pipe-cleaner-flower-art", collectionSlug: "pipe-cleaner-bouquets" },
  { slug: "pipe-rose-violet", name: "Artisan Pipe Bouquet — Violet Dream", price: 1899, colorName: "Violet", colorHex: "#7B38B6", image: pipecleanerImg, parentName: "Pipe Cleaner Bouquet", parentSlug: "pipe-cleaner-flower-art", collectionSlug: "pipe-cleaner-bouquets" },
  { slug: "pipe-rose-sky-blue", name: "Artisan Pipe Bouquet — Sky Blue", price: 1799, colorName: "Sky Blue", colorHex: "#4090C8", image: pipecleanerImg, parentName: "Pipe Cleaner Bouquet", parentSlug: "pipe-cleaner-flower-art", collectionSlug: "pipe-cleaner-bouquets" },
  { slug: "pipe-rose-forest-green", name: "Artisan Pipe Bouquet — Forest Green", price: 1699, colorName: "Forest Green", colorHex: "#2E6E3E", image: pipecleanerImg, parentName: "Pipe Cleaner Bouquet", parentSlug: "pipe-cleaner-flower-art", collectionSlug: "pipe-cleaner-bouquets" },
  { slug: "pipe-rose-sunset-orange", name: "Artisan Pipe Bouquet — Sunset Orange", price: 1799, colorName: "Sunset Orange", colorHex: "#D05020", image: pipecleanerImg, parentName: "Pipe Cleaner Bouquet", parentSlug: "pipe-cleaner-flower-art", collectionSlug: "pipe-cleaner-bouquets" },
  { slug: "pipe-rose-champagne", name: "Artisan Pipe Bouquet — Champagne Gold", price: 2099, colorName: "Champagne Gold", colorHex: "#C0963C", image: pipecleanerImg, parentName: "Pipe Cleaner Bouquet", parentSlug: "pipe-cleaner-flower-art", collectionSlug: "pipe-cleaner-bouquets" },
  { slug: "pipe-rose-powder-blue", name: "Artisan Pipe Bouquet — Powder Blue", price: 1799, colorName: "Powder Blue", colorHex: "#7AAAC8", image: pipecleanerImg, parentName: "Pipe Cleaner Bouquet", parentSlug: "pipe-cleaner-flower-art", collectionSlug: "pipe-cleaner-bouquets" },
  { slug: "pipe-rose-rose-gold", name: "Artisan Pipe Bouquet — Rose Gold", price: 1999, colorName: "Rose Gold", colorHex: "#C07060", image: pipecleanerImg, parentName: "Pipe Cleaner Bouquet", parentSlug: "pipe-cleaner-flower-art", collectionSlug: "pipe-cleaner-bouquets" },
];

// ─── Generic variant generator (for collections without explicit variants) ────
function makeVariants(
  base: { name: string; slug: string; price: number; image: string; collectionSlug: string },
): ProductVariant[] {
  const COLORS = [
    { colorName: "Blush Pink", colorHex: "#E8A0B0", priceAdj: 0 },
    { colorName: "Crimson Red", colorHex: "#A01020", priceAdj: 400 },
    { colorName: "Ivory White", colorHex: "#F0EAD0", priceAdj: 200 },
    { colorName: "Lavender Purple", colorHex: "#9B7BB6", priceAdj: 300 },
    { colorName: "Sunshine Yellow", colorHex: "#D4A820", priceAdj: 0 },
    { colorName: "Deep Burgundy", colorHex: "#6D1A36", priceAdj: 500 },
    { colorName: "Peach Coral", colorHex: "#E07850", priceAdj: 100 },
    { colorName: "Sage Green", colorHex: "#6A9E6A", priceAdj: 200 },
    { colorName: "Ocean Blue", colorHex: "#2E6A9A", priceAdj: 400 },
    { colorName: "Midnight Black", colorHex: "#1E1E2E", priceAdj: 700 },
  ];
  return COLORS.map((c, i) => ({
    slug: `${base.slug}-${c.colorName.toLowerCase().replace(/\s+/g, "-")}`,
    name: `${base.name} — ${c.colorName}`,
    price: base.price + c.priceAdj,
    colorName: c.colorName,
    colorHex: c.colorHex,
    image: base.image,
    parentName: base.name,
    parentSlug: base.slug,
    collectionSlug: base.collectionSlug,
  }));
}

// ─── Image map per collection ─────────────────────────────────────────────────
const COLLECTION_IMAGES: Record<string, string> = {
  "crochet-bouquets": crochetImg,
  "pipe-cleaner-bouquets": pipecleanerImg,
  "baby-collection": babyImg,
  "luxury-gift-boxes": giftboxImg,
  "corporate-gifts": corporateImg,
  "wedding-gifts": weddingImg,
  "indoor-plants": indoorPlantsImg,
  "frames-vases": framesVasesImg,
  "airport-collection": airportImg,
  "mother-recovery": motherImg,
};

// ─── All variants keyed by product slug ───────────────────────────────────────
const VARIANT_MAP: Record<string, ProductVariant[]> = {
  "signature-crochet-bouquet": CROCHET_VARIANTS,
  "pipe-cleaner-flower-art": PIPE_CLEANER_VARIANTS,
};

/** Get 10 variants for a given product slug (falls back to auto-generation). */
export function getVariantsByProductSlug(
  productSlug: string,
  productName: string,
  productPrice: number,
  collectionSlug: string,
): ProductVariant[] {
  if (VARIANT_MAP[productSlug]) return VARIANT_MAP[productSlug];
  const image = COLLECTION_IMAGES[collectionSlug] ?? crochetImg;
  return makeVariants({ name: productName, slug: productSlug, price: productPrice, image, collectionSlug });
}

/** Lookup a single variant by slug across all known variants. */
export function getVariantBySlug(variantSlug: string): ProductVariant | undefined {
  // Check pre-defined maps first
  for (const variants of Object.values(VARIANT_MAP)) {
    const found = variants.find((v) => v.slug === variantSlug);
    if (found) return found;
  }
  // Decode a generated variant slug: pattern = {parentSlug}-{colorName-kebab}
  return undefined;
}

/** All variants as a flat array (for static lookup during checkout). */
export function getAllVariants(): ProductVariant[] {
  return Object.values(VARIANT_MAP).flat();
}
