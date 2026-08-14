import bouquetVideo from "@/assets/product-bouquet-video.mp4.asset.json";
import packagingVideo from "@/assets/product-packaging-video.mp4.asset.json";
import bouquetFront from "@/assets/bouquet-front.jpg.asset.json";
import bouquetDetail from "@/assets/bouquet-detail.jpg.asset.json";
import bouquetDimensions from "@/assets/bouquet-dimensions.jpg.asset.json";
import type { GalleryMediaItem } from "./types";

/**
 * Demo media set — replace with real product media when merging.
 * Order matters: main product video first, packaging video last.
 */
export const sampleGalleryMedia: GalleryMediaItem[] = [
  {
    id: "media-video-main",
    kind: "video",
    src: bouquetVideo.url,
    thumbnail: bouquetFront.url,
    alt: "Product video of the rose bouquet",
    label: "Video",
    autoPlay: true,
  },
  {
    id: "media-front",
    kind: "image",
    src: bouquetFront.url,
    thumbnail: bouquetFront.url,
    alt: "Rose bouquet wrapped in kraft paper, front view",
  },
  {
    id: "media-detail",
    kind: "image",
    src: bouquetDetail.url,
    thumbnail: bouquetDetail.url,
    alt: "Close-up of rose petals and eucalyptus",
  },
  {
    id: "media-dimensions",
    kind: "dimension",
    src: bouquetDimensions.url,
    thumbnail: bouquetDimensions.url,
    alt: "Bouquet dimensions: 45 cm tall, 30 cm wide",
    label: "Size",
  },
  {
    id: "media-video-packaging",
    kind: "video",
    src: packagingVideo.url,
    thumbnail: bouquetDetail.url,
    alt: "Packaging video showing the bouquet placed in a gift box",
    label: "Packaging",
    autoPlay: true,
  },
];
