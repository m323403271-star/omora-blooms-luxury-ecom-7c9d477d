import type { HighlightsContent } from "./types";

/** Demo content — keys map to sampleGalleryMedia ids. */
export const sampleHighlights: HighlightsContent = {
  fallback: {
    mediaId: "fallback",
    eyebrow: "Product highlights",
    title: "Hand-tied signature rose bouquet",
    description:
      "Arranged the morning of dispatch with market-fresh stems, hand-tied and wrapped in recycled kraft paper.",
    features: [
      "Hand-tied by our florists",
      "Cut fresh on dispatch day",
      "Includes flower food sachet",
      "Care card in every box",
    ],
    specs: [
      { label: "Stem count", value: "24 stems" },
      { label: "Wrap", value: "Recycled kraft paper" },
      { label: "Vase life", value: "7–10 days" },
      { label: "Origin", value: "Locally sourced growers" },
    ],
  },
  sets: [
    {
      mediaId: "media-video-main",
      eyebrow: "In motion",
      title: "See every angle before it ships",
      description:
        "Filmed in natural light with no retouching, so the volume, colour mix and wrap you see are exactly what arrives.",
      features: [
        "Unedited studio footage",
        "True-to-life colour",
        "Full 360° of the arrangement",
        "Filmed on dispatch-day stock",
      ],
      specs: [
        { label: "Shown", value: "Standard size" },
        { label: "Palette", value: "Blush, cream, peach" },
        { label: "Foliage", value: "Rose leaf, eucalyptus" },
      ],
    },
    {
      mediaId: "media-front",
      eyebrow: "Materials",
      title: "Kraft wrap and hand-tied stems",
      description:
        "A double-fold kraft sleeve holds the dome shape in transit and protects the outer petals without plastic.",
      features: [
        "100% recycled kraft wrap",
        "Plastic-free construction",
        "Jute twine binding",
        "Water-source pouch at the base",
      ],
      specs: [
        { label: "Wrap material", value: "Recycled kraft, 120 gsm" },
        { label: "Binding", value: "Natural jute twine" },
        { label: "Stem count", value: "24 stems" },
        { label: "Weight", value: "≈ 1.1 kg" },
      ],
    },
    {
      mediaId: "media-detail",
      eyebrow: "Flower detail",
      title: "Grade-A roses with soft eucalyptus",
      description:
        "Each head is graded for petal count and opening stage so the bouquet blooms over the first three days.",
      features: [
        "Grade-A rose heads",
        "Cut at quarter-bloom",
        "Silver dollar eucalyptus",
        "Thorn-stripped stems",
      ],
      specs: [
        { label: "Rose variety", value: "Sweet Avalanche, Peach Avalanche" },
        { label: "Head size", value: "5–6 cm" },
        { label: "Foliage", value: "Eucalyptus cinerea" },
        { label: "Bloom window", value: "Days 2–5" },
      ],
    },
    {
      mediaId: "media-dimensions",
      eyebrow: "Dimensions",
      title: "Sized to fit a standard table vase",
      description:
        "Measured from the base of the wrap to the tallest stem, with the natural spread at the widest point.",
      features: [
        "Fits vases 12–16 cm wide",
        "Trim 2 cm before arranging",
        "Compact enough for a console",
        "Gift box sized to match",
      ],
      specs: [
        { label: "Height", value: "45 cm" },
        { label: "Width", value: "30 cm" },
        { label: "Wrap base", value: "11 cm diameter" },
        { label: "Boxed size", value: "50 × 34 × 20 cm" },
      ],
    },
    {
      mediaId: "media-video-packaging",
      eyebrow: "Packaging",
      title: "Boxed with a water source for transit",
      description:
        "The bouquet is seated in a rigid gift box with tissue cushioning and a sealed hydration pouch on the stems.",
      features: [
        "Rigid double-wall gift box",
        "Sealed hydration pouch",
        "Acid-free tissue cushioning",
        "Fully recyclable packaging",
      ],
      specs: [
        { label: "Box", value: "Double-wall, 50 × 34 × 20 cm" },
        { label: "Hydration", value: "Sealed water pouch" },
        { label: "Cushioning", value: "Acid-free tissue" },
        { label: "Recyclable", value: "Yes, all components" },
      ],
    },
  ],
};
