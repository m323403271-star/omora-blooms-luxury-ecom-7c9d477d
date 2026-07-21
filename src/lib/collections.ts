import crochetImg from "@/assets/collection-crochet.jpg";
import pipecleanerImg from "@/assets/collection-pipecleaner.jpg";
import babyImg from "@/assets/collection-baby.jpg";
import motherImg from "@/assets/collection-mother.jpg";
import airportImg from "@/assets/collection-airport.jpg";
import giftboxImg from "@/assets/collection-giftbox.jpg";
import corporateImg from "@/assets/collection-corporate.jpg";
import weddingImg from "@/assets/collection-wedding.jpg";

export type Collection = {
  slug: string;
  name: string;
  tagline: string;
  image: string;
};

export const COLLECTIONS: Collection[] = [
  { slug: "crochet-bouquets", name: "Crochet Bouquets", tagline: "Forever roses, hand-stitched", image: crochetImg },
  { slug: "pipe-cleaner-bouquets", name: "Pipe Cleaner Bouquets", tagline: "Whimsical everlasting florals", image: pipecleanerImg },
  { slug: "baby-collection", name: "Baby Essentials", tagline: "Welcome the little one", image: babyImg },
  { slug: "mother-recovery", name: "Mother Recovery", tagline: "Postpartum care, elevated", image: motherImg },
  { slug: "airport-collection", name: "Airport Welcome", tagline: "Homecomings, made memorable", image: airportImg },
  { slug: "luxury-gift-boxes", name: "Luxury Gift Boxes", tagline: "The signature OMORA box", image: giftboxImg },
  { slug: "corporate-gifts", name: "Corporate Gifts", tagline: "Impress clients & team", image: corporateImg },
  { slug: "wedding-gifts", name: "Wedding Gifts", tagline: "A forever keepsake", image: weddingImg },
  { slug: "anniversary-gifts", name: "Anniversary Gifts", tagline: "Love that lasts forever", image: giftboxImg },
  { slug: "birthday-gifts", name: "Birthday Gifts", tagline: "Make their day unforgettable", image: giftboxImg },
  { slug: "graduation-gifts", name: "Graduation Gifts", tagline: "Celebrate milestones", image: giftboxImg },
  { slug: "personalized-gifts", name: "Personalized Gifts", tagline: "Made just for them", image: crochetImg },
];

export function collectionBySlug(slug: string) {
  return COLLECTIONS.find((c) => c.slug === slug);
}
