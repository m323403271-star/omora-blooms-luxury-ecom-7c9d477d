import crochetImg from "@/assets/collection-crochet.jpg";
import pipecleanerImg from "@/assets/collection-pipecleaner.jpg";
import babyImg from "@/assets/collection-baby.jpg";
import motherImg from "@/assets/collection-mother.jpg";
import airportImg from "@/assets/collection-airport.jpg";
import giftboxImg from "@/assets/collection-giftbox.jpg";
import corporateImg from "@/assets/collection-corporate.jpg";
import weddingImg from "@/assets/collection-wedding.jpg";
import indoorPlantsImg from "@/assets/collection-indoor-plants.jpg";
import framesVasesImg from "@/assets/collection-frames-vases.jpg";
import divineHeritageImg from "@/assets/collection-divine-heritage.jpg";

export type Collection = {
  slug: string;
  name: string;
  tagline: string;
  image: string;
};

export const COLLECTIONS: Collection[] = [
  { slug: "crochet-bouquets", name: "Crochet Bouquets", tagline: "Handcrafted with love, made to last forever", image: crochetImg },
  { slug: "rose-bouquets", name: "Rose Bouquets", tagline: "Handcrafted crochet roses", image: crochetImg },
  { slug: "sunflower-bouquets", name: "Sunflower Bouquets", tagline: "Vibrant crochet sunflowers", image: crochetImg },
  { slug: "tulip-bouquets", name: "Tulip Bouquets", tagline: "Elegant crochet tulips", image: crochetImg },
  { slug: "daisy-bouquets", name: "Daisy Bouquets", tagline: "Charming crochet daisies", image: crochetImg },
  { slug: "petite-crochet-posy", name: "Petite Crochet Posy", tagline: "Delicate small crochet posies", image: crochetImg },
  { slug: "luxury-crochet-rose-bouquet", name: "Luxury Crochet Rose Bouquet", tagline: "Premium luxury rose arrangement", image: crochetImg },
  { slug: "lily-bouquets", name: "Lily Bouquets", tagline: "Gorgeous crochet lilies", image: crochetImg },
  { slug: "mixed-flower-bouquets", name: "Mixed Flower Bouquets", tagline: "A blend of handcrafted flowers", image: crochetImg },
  { slug: "mini-potted-bouquets", name: "Mini Potted Bouquets", tagline: "Cute potted crochet plants", image: crochetImg },
  { slug: "lavender-bouquets", name: "Lavender Bouquets", tagline: "Calming crochet lavender blooms", image: crochetImg },
  { slug: "frames-vases", name: "Everlasting Floral Frames & Vases", tagline: "Elegant wall frames & luxury glass vases decor", image: framesVasesImg },
  { slug: "divine-heritage", name: "Divine Heritage Collection", tagline: "Timeless brass diyas, organic dhoop, & everlasting crochet lotus", image: divineHeritageImg },
  { slug: "pipe-cleaner-bouquets", name: "Pipe Cleaner Bouquets", tagline: "Whimsical everlasting florals", image: pipecleanerImg },
  { slug: "indoor-plants", name: "Indoor Plants", tagline: "Bring nature indoors with beautiful greenery", image: indoorPlantsImg },
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
