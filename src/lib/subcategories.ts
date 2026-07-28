// Sub-category item catalog for collection listing pages.
// Each item shows title + image; "View Details" opens a WhatsApp inquiry.

export type SubItem = {
  title: string;
  query: string; // unsplash query
};

export type SubCatalog = {
  eyebrow?: string;
  items: SubItem[];
};

export const SUB_CATALOG: Record<string, SubCatalog> = {
  "crochet-bouquets": {
    eyebrow: "Crochet Bouquets",
    items: [
      { title: "Rose Bouquets", query: "crochet,rose,bouquet" },
      { title: "Sunflower Bouquets", query: "crochet,sunflower,bouquet" },
      { title: "Tulip Bouquets", query: "crochet,tulip,bouquet" },
      { title: "Daisy Bouquets", query: "crochet,daisy,bouquet" },
      { title: "Lily Bouquets", query: "crochet,lily,bouquet" },
      { title: "Mixed Flower Bouquets", query: "crochet,mixed,flower,bouquet" },
      { title: "Mini Potted Bouquets", query: "crochet,mini,potted,flower" },
      { title: "Lavender Bouquets", query: "crochet,lavender,bouquet" },
    ],
  },
  "pipe-cleaner-bouquets": {
    eyebrow: "Pipe Cleaner Bouquets",
    items: [
      { title: "Rose Bouquets", query: "pipe,cleaner,rose,flower" },
      { title: "Tulip Bouquets", query: "pipe,cleaner,tulip,flower" },
      { title: "Sunflower Bouquets", query: "pipe,cleaner,sunflower" },
      { title: "Lily Flower Bouquets", query: "pipe,cleaner,lily,flower" },
      { title: "Lavender Flower Bouquets", query: "pipe,cleaner,lavender" },
      { title: "Daisy Bouquets", query: "pipe,cleaner,daisy" },
      { title: "Peony Bouquets", query: "peony,bouquet,craft" },
      { title: "Mixed Flower Bouquets", query: "pipe,cleaner,mixed,flowers" },
      { title: "Heart Shape Bouquets", query: "heart,bouquet,flowers" },
      { title: "Graduation Bouquets", query: "graduation,bouquet" },
      { title: "Baby Welcome Bouquets", query: "baby,welcome,bouquet" },
      { title: "Anniversary Bouquets", query: "anniversary,bouquet,roses" },
      { title: "Birthday Bouquets", query: "birthday,bouquet,flowers" },
      { title: "Bride Bouquets", query: "bride,bouquet,wedding" },
      { title: "Teddy Bouquets", query: "teddy,bear,bouquet" },
      { title: "Chocolate Bouquets", query: "chocolate,bouquet,gift" },
      { title: "LED Light Bouquets", query: "led,light,bouquet,flowers" },
    ],
  },
  "frames-vases": {
    eyebrow: "Everlasting Floral Frames & Vases",
    items: [
      { title: "Crochet Flower Frame", query: "crochet,flower,frame" },
      { title: "Pipe Cleaner Frame", query: "pipe,cleaner,frame,flower" },
      { title: "Mixed Flower Frame", query: "mixed,flower,frame,decor" },
      { title: "Photo Floral Frame", query: "photo,frame,flowers,decor" },
      { title: "Couple Anniversary Frame", query: "couple,anniversary,frame" },
      { title: "Baby Welcome Frame", query: "baby,welcome,frame" },
      { title: "Birthday Floral Frame", query: "birthday,floral,frame" },
      { title: "Heart Shape Floral Frame", query: "heart,floral,frame" },
      { title: "3D Luxury Floral Frame", query: "3d,floral,frame,luxury" },
      { title: "Wall Hanging Floral Frame", query: "wall,hanging,floral,frame" },
      { title: "Table Top Floral Frame", query: "tabletop,floral,frame,decor" },
    ],
  },
  "airport-collection": {
    eyebrow: "Luxury Airport Welcome Bouquets",
    items: [
      { title: "VIP Welcome Bouquets", query: "vip,welcome,bouquet,luxury" },
      { title: "Corporate Welcome Bouquets", query: "corporate,welcome,bouquet" },
      { title: "Bride & Groom Welcome Bouquets", query: "bride,groom,welcome,bouquet" },
      { title: "NRI Family Welcome Bouquets", query: "family,welcome,bouquet" },
      { title: "Birthday Airport Surprise Bouquets", query: "airport,surprise,bouquet" },
      { title: "Welcome to Namma Bengaluru Bouquets", query: "bangalore,welcome,flowers" },
      { title: "Personalized Luxury Bouquets", query: "personalized,luxury,bouquet" },
    ],
  },
  "divine-heritage": {
    eyebrow: "Divine Heritage Luxury Gift Box",
    items: [
      { title: "Varamahalakshmi Vrata Luxury Puja Hamper", query: "puja,hamper,brass,diya" },
      { title: "Gouri Ganesha Festive Floral & Decor Hamper", query: "ganesha,festive,floral,decor" },
      { title: "Deepavali Grand Festive Hamper", query: "diwali,festive,hamper,diya" },
      { title: "Maha Shivaratri Divine & Peaceful Collection", query: "shiva,divine,puja,collection" },
    ],
  },
  "baby-collection": {
    eyebrow: "Baby Essentials Luxury Kit",
    items: [
      { title: "Royal Newborn Welcome Basket", query: "newborn,welcome,basket,luxury" },
      { title: "Gentle Care Organic Essentials Kit", query: "organic,baby,essentials" },
      { title: "Pure Joy Heritage Baby Trunk", query: "baby,trunk,gift,luxury" },
    ],
  },
  "mother-recovery": {
    eyebrow: "Mother Recovery Kit",
    items: [
      { title: "New Mom Recovery Kit", query: "mom,recovery,kit,wellness" },
      { title: "Hospital Care Recovery Kit", query: "hospital,care,kit,wellness" },
    ],
  },
  "indoor-plants": {
    eyebrow: "Mini Indoor Plants",
    items: [
      { title: "Golden Ceramic Succulent", query: "ceramic,succulent,gold,pot" },
      { title: "Desk Peace Lily", query: "peace,lily,desk,plant" },
      { title: "Lucky Bamboo Gold Pot", query: "lucky,bamboo,plant" },
      { title: "Mini Monstera Delight", query: "mini,monstera,plant" },
      { title: "Luxe Jade Plant", query: "jade,plant,ceramic" },
      { title: "Tabletop Bonsai Grace", query: "bonsai,tabletop,plant" },
    ],
  },
  "luxury-gift-boxes": {
    eyebrow: "OMora VIP Luxury Gift Boxes",
    items: [
      { title: "Airport Welcome Gift Box", query: "airport,welcome,gift,box" },
      { title: "Corporate Gift Box", query: "corporate,gift,box,luxury" },
      { title: "Executive Gift Box", query: "executive,gift,box" },
      { title: "Business Partner Gift Box", query: "business,gift,box,luxury" },
      { title: "Hotel & Resort Welcome Box", query: "hotel,welcome,box" },
      { title: "Baby Welcome Gift Box", query: "baby,welcome,gift,box" },
      { title: "Wedding Gift Box", query: "wedding,gift,box,luxury" },
      { title: "Anniversary Gift Box", query: "anniversary,gift,box" },
      { title: "Birthday Gift Box", query: "birthday,gift,box,luxury" },
      { title: "Festive Gift Box", query: "festive,gift,box,luxury" },
      { title: "Thank You & Appreciation Gift Box", query: "thank,you,gift,box" },
    ],
  },
  "wedding-gifts": {
    eyebrow: "Omora Signature Boxes",
    items: [
      { title: "Omora Imperial Box", query: "imperial,gift,box,luxury" },
      { title: "Omora Gold Crest Hamper", query: "gold,hamper,luxury,gift" },
      { title: "Omora Heritage Luxe Box", query: "heritage,luxury,box,gift" },
    ],
  },
  "eternal-bond-luxury-kit": {
    eyebrow: "The Eternal Bond Luxury Kit",
    items: [
      { title: "Signature Eternal Bond Trunk", query: "luxury,trunk,gift,rose" },
      { title: "Forever Love Royal Hamper", query: "royal,hamper,rose,luxury" },
    ],
  },
};

export function imageForItem(query: string, seed: string): string {
  // Deterministic Unsplash source image per item.
  return `https://source.unsplash.com/600x750/?${encodeURIComponent(query)}&sig=${encodeURIComponent(seed)}`;
}

export function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
