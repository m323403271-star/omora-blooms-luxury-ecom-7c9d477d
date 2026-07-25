// Gifting & Customization module — shared types, constants, formatting helpers.

export const GIFT_MESSAGE_MAX = 200;

export type GreetingCardType =
  | "birthday"
  | "anniversary"
  | "love"
  | "congratulations"
  | "thank-you"
  | "get-well-soon"
  | "just-because"
  | "naming-ceremony";

export const GREETING_CARDS: { id: GreetingCardType; label: string }[] = [
  { id: "birthday", label: "Happy Birthday" },
  { id: "anniversary", label: "Happy Anniversary" },
  { id: "love", label: "With Love" },
  { id: "congratulations", label: "Congratulations" },
  { id: "thank-you", label: "Thank You" },
  { id: "get-well-soon", label: "Get Well Soon" },
  { id: "naming-ceremony", label: "Naming Ceremony" },
  { id: "just-because", label: "Just Because" },
];

export type GiftOptions = {
  isGift: true;
  message: string;
  cardType: GreetingCardType;
  cardLabel: string;
};

export type BouquetSelection = { id: string; label: string; price: number; qty: number };

export type CustomBouquet = {
  flowers: BouquetSelection[];
  greenery: BouquetSelection | null;
  wrapping: BouquetSelection | null;
  addOnPrice: number; // total add-on price beyond base product
};

// Build Your Own Bouquet — curated add-on catalogue.
export const BOUQUET_FLOWERS: BouquetSelection[] = [
  { id: "crochet-rose", label: "Crochet Rose", price: 350, qty: 0 },
  { id: "crochet-lily", label: "Crochet Lily", price: 380, qty: 0 },
  { id: "crochet-tulip", label: "Crochet Tulip", price: 320, qty: 0 },
  { id: "pipe-daisy", label: "Pipe-Cleaner Daisy", price: 260, qty: 0 },
  { id: "pipe-sunflower", label: "Pipe-Cleaner Sunflower", price: 300, qty: 0 },
  { id: "crochet-lotus", label: "Crochet Lotus", price: 420, qty: 0 },
];

export const BOUQUET_GREENERY: BouquetSelection[] = [
  { id: "eucalyptus", label: "Everlasting Eucalyptus Sprigs", price: 199, qty: 1 },
  { id: "fern", label: "Woven Fern Fillers", price: 179, qty: 1 },
  { id: "baby-breath", label: "Crochet Baby's Breath", price: 229, qty: 1 },
  { id: "none-green", label: "No filler greenery", price: 0, qty: 1 },
];

export const BOUQUET_WRAPPING: BouquetSelection[] = [
  { id: "noir-satin", label: "Signature Noir Satin Wrap", price: 299, qty: 1 },
  { id: "gold-foil", label: "Metallic Gold Foil Wrap", price: 349, qty: 1 },
  { id: "pink-linen", label: "Soft Pink Linen Wrap", price: 279, qty: 1 },
  { id: "kraft-luxe", label: "Kraft Luxe with Gold Ribbon", price: 199, qty: 1 },
];

export function computeBouquetAddOn(b: CustomBouquet): number {
  const flowers = b.flowers.reduce((s, f) => s + f.price * f.qty, 0);
  return flowers + (b.greenery?.price ?? 0) + (b.wrapping?.price ?? 0);
}

export function bouquetFlowerCount(b: CustomBouquet): number {
  return b.flowers.reduce((s, f) => s + f.qty, 0);
}

export function formatGiftForWhatsApp(gift?: GiftOptions | null, bouquet?: CustomBouquet | null): string {
  const lines: string[] = [];
  if (gift) {
    lines.push(`🎁 Gift Order`);
    lines.push(`   Card: ${gift.cardLabel}`);
    if (gift.message.trim()) lines.push(`   Message: "${gift.message.trim()}"`);
  }
  if (bouquet && (bouquetFlowerCount(bouquet) > 0 || bouquet.wrapping)) {
    lines.push(`💐 Custom Bouquet`);
    for (const f of bouquet.flowers.filter((x) => x.qty > 0)) {
      lines.push(`   • ${f.label} × ${f.qty}`);
    }
    if (bouquet.greenery && bouquet.greenery.price > 0) lines.push(`   • Filler: ${bouquet.greenery.label}`);
    if (bouquet.wrapping) lines.push(`   • Wrapping: ${bouquet.wrapping.label}`);
  }
  return lines.length ? `\n\n${lines.join("\n")}` : "";
}

// Deterministic short hash so cart items with different customizations don't merge.
export function hashCustomization(gift?: GiftOptions | null, bouquet?: CustomBouquet | null): string {
  if (!gift && !bouquet) return "";
  const payload = JSON.stringify({ gift, bouquet });
  let h = 0;
  for (let i = 0; i < payload.length; i++) h = (h * 31 + payload.charCodeAt(i)) | 0;
  return `::${(h >>> 0).toString(36)}`;
}
