import type { Product } from "@/lib/products";

export type ShowcaseTab = {
  id: string;
  label: string;
  image: string;
  /** Keywords matched against product name / category / tags / slug. */
  keywords: string[];
  /** Optional collection slug for the "see all" deep link. */
  collection?: string;
  /** Optional custom matcher (offers etc.). */
  mode?: "under-1499" | "best-value" | "premium" | "express";
};

export type ShowcaseSection = {
  id: string;
  title: string;
  eyebrow: string;
  tabs: ShowcaseTab[];
  ctaLabel?: string;
};

const img = (q: string) => `https://images.unsplash.com/${q}?auto=format&fit=crop&q=80&w=300`;

export const HOME_SHOWCASE: ShowcaseSection[] = [
  {
    id: "occasion",
    title: "Gift for Every Occasion",
    eyebrow: "Occasions",
    tabs: [
      {
        id: "birthday",
        label: "Birthday Bouquets",
        image: img("photo-1530103862676-de8c9debad1d"),
        keywords: ["birthday", "celebration", "bouquet"],
        collection: "crochet-bouquets",
      },
      {
        id: "anniversary",
        label: "Anniversary & Romance",
        image: img("photo-1518895949257-7621c3c786d7"),
        keywords: ["anniversary", "romance", "rose", "heart", "love"],
        collection: "wedding-gifts",
      },
      {
        id: "airport",
        label: "Airport Welcome",
        image: img("photo-1582794543139-8ac9cb0f7b11"),
        keywords: ["airport", "welcome", "express"],
        collection: "airport-collection",
      },
      {
        id: "congrats",
        label: "Congratulations & Housewarming",
        image: img("photo-1523050854058-8df90110c9f1"),
        keywords: ["congratulation", "graduation", "housewarming", "plant", "corporate"],
        collection: "indoor-plants",
      },
    ],
  },
  {
    id: "festivals",
    title: "Celebrate Near Festivals / Special Days",
    eyebrow: "Festive calendar",
    tabs: [
      {
        id: "divine",
        label: "Divine Heritage",
        image: img("photo-1605885064365-e40ed3243f67"),
        keywords: ["divine", "heritage", "festive", "ritual", "pooja"],
        collection: "divine-heritage",
      },
      {
        id: "diwali",
        label: "Diwali Gifting",
        image: img("photo-1549007994-cb92caebd54b"),
        keywords: ["gift box", "hamper", "luxury", "festive"],
        collection: "luxury-gift-boxes",
      },
      {
        id: "rakhi",
        label: "Rakhi & Family",
        image: img("photo-1561181286-d3fee7d55364"),
        keywords: ["crochet", "mixed", "family"],
        collection: "crochet-bouquets",
      },
      {
        id: "wedding-season",
        label: "Wedding Season",
        image: img("photo-1519741497674-611481863552"),
        keywords: ["wedding", "bride", "groom"],
        collection: "wedding-gifts",
      },
    ],
  },
  {
    id: "bestsellers",
    title: "Shop by Bestsellers",
    eyebrow: "Most loved",
    ctaLabel: "Explore All Bouquets",
    tabs: [
      {
        id: "top",
        label: "Top Rated",
        image: img("photo-1561181286-d3fee7d55364"),
        keywords: ["bouquet", "crochet", "luxury"],
      },
      {
        id: "crochet",
        label: "Crochet Classics",
        image: img("photo-1520763185298-1b434c919102"),
        keywords: ["crochet"],
        collection: "crochet-bouquets",
      },
      {
        id: "pipe",
        label: "Pipe Cleaner",
        image: img("photo-1563245372-f21724e3856d"),
        keywords: ["pipe", "cleaner", "craft", "art"],
        collection: "pipe-cleaner-bouquets",
      },
      {
        id: "boxes",
        label: "Gift Boxes",
        image: img("photo-1549007994-cb92caebd54b"),
        keywords: ["gift box", "hamper", "box"],
        collection: "luxury-gift-boxes",
      },
    ],
  },
  {
    id: "everyone",
    title: "Gift for Everyone",
    eyebrow: "By recipient",
    tabs: [
      {
        id: "for-her",
        label: "For Her",
        image: img("photo-1519689680058-324335c77eba"),
        keywords: ["rose", "blush", "her", "romance", "crochet"],
      },
      {
        id: "for-mom",
        label: "For Mom",
        image: img("photo-1526047932273-341f2a7631f9"),
        keywords: ["mother", "mom", "recovery", "care"],
        collection: "mother-recovery",
      },
      {
        id: "newborn",
        label: "Newborn Essentials",
        image: img("photo-1519689680058-324335c77eba"),
        keywords: ["baby", "newborn", "essential"],
        collection: "baby-collection",
      },
    ],
  },
  {
    id: "feeling",
    title: "Gift for Every Feeling",
    eyebrow: "Say it with blooms",
    tabs: [
      {
        id: "love",
        label: "Love & Romance",
        image: img("photo-1518895949257-7621c3c786d7"),
        keywords: ["love", "romance", "rose", "heart"],
      },
      {
        id: "apology",
        label: "Apology",
        image: img("photo-1528722828814-77b9b83aafb2"),
        keywords: ["lavender", "sorry", "apology", "white", "lily"],
      },
      {
        id: "thinking",
        label: "Thinking of You",
        image: img("photo-1485955900006-10f4d324d411"),
        keywords: ["plant", "mini", "daisy", "sunflower"],
        collection: "indoor-plants",
      },
    ],
  },
  {
    id: "offers",
    title: "Get Exclusive Offers From",
    eyebrow: "Limited time",
    tabs: [
      {
        id: "under-1499",
        label: "Under ₹1499",
        image: img("photo-1606041008023-472dfb5e530f"),
        keywords: [],
        mode: "under-1499",
      },
      {
        id: "best-value",
        label: "Biggest Savings",
        image: img("photo-1513151233558-d860c5398176"),
        keywords: [],
        mode: "best-value",
      },
      {
        id: "premium",
        label: "Premium Luxe",
        image: img("photo-1605885064365-e40ed3243f67"),
        keywords: [],
        mode: "premium",
      },
      {
        id: "express",
        label: "Express Deals",
        image: img("photo-1582794543139-8ac9cb0f7b11"),
        keywords: [],
        mode: "express",
      },
    ],
  },
  {
    id: "new",
    title: "Newly Launched",
    eyebrow: "Fresh from the atelier",
    tabs: [
      {
        id: "new-all",
        label: "All New",
        image: img("photo-1508610048659-a06b669e3321"),
        keywords: [],
      },
      {
        id: "new-frames",
        label: "Frames & Vases",
        image: img("photo-1513519245088-0e12902e5a38"),
        keywords: ["frame", "vase"],
        collection: "frames-vases",
      },
      {
        id: "new-plants",
        label: "Mini Plants",
        image: img("photo-1485955900006-10f4d324d411"),
        keywords: ["plant", "mini", "indoor"],
        collection: "indoor-plants",
      },
      {
        id: "new-airport",
        label: "Airport Express",
        image: img("photo-1582794543139-8ac9cb0f7b11"),
        keywords: ["airport", "welcome"],
        collection: "airport-collection",
      },
    ],
  },
];

export const GIFTING_STORIES = [
  {
    id: "s1",
    name: "Ananya R.",
    place: "Devanahalli",
    quote:
      "The airport welcome bouquet reached Terminal 1 in 28 minutes. My parents landed to a gold-wrapped surprise.",
    image: img("photo-1582794543139-8ac9cb0f7b11"),
  },
  {
    id: "s2",
    name: "Rohit & Meera",
    place: "Prestige Golfshire",
    quote:
      "Our anniversary crochet bouquet still sits on the console table — a year later it looks brand new.",
    image: img("photo-1518895949257-7621c3c786d7"),
  },
  {
    id: "s3",
    name: "Divya S.",
    place: "Bengaluru",
    quote:
      "Sent the Mother Recovery Kit to my sister. The packaging alone made her cry happy tears.",
    image: img("photo-1526047932273-341f2a7631f9"),
  },
  {
    id: "s4",
    name: "Karthik N.",
    place: "Whitefield",
    quote:
      "Divine Heritage gift box for Diwali — every single client asked where we ordered it from.",
    image: img("photo-1605885064365-e40ed3243f67"),
  },
];

export function filterProducts(products: Product[], tab: ShowcaseTab): Product[] {
  if (tab.mode) {
    const list = [...products];
    if (tab.mode === "under-1499") return list.filter((p) => p.price <= 1499);
    if (tab.mode === "premium") return list.filter((p) => p.price >= 3000);
    if (tab.mode === "express")
      return list.filter((p) => matches(p, ["airport", "express", "welcome"]));
    return list
      .filter((p) => p.compare_at_price && p.compare_at_price > p.price)
      .sort(
        (a, b) =>
          (b.compare_at_price! - b.price) / b.compare_at_price! -
          (a.compare_at_price! - a.price) / a.compare_at_price!,
      );
  }
  if (tab.keywords.length === 0) return products;
  return products.filter((p) => matches(p, tab.keywords));
}

function matches(p: Product, keywords: string[]): boolean {
  const hay = [p.name, p.slug, p.category, p.tagline ?? "", (p.tags ?? []).join(" ")]
    .join(" ")
    .toLowerCase();
  return keywords.some((k) => hay.includes(k.toLowerCase()));
}
