import bouquetVideo from "@/assets/product-bouquet-video.mp4.asset.json";
import packagingVideo from "@/assets/product-packaging-video.mp4.asset.json";
import bouquetDimensions from "@/assets/bouquet-dimensions.jpg.asset.json";
import type { GalleryMediaItem } from "@/components/product-gallery";

/**
 * Adapter: builds the gallery media list for a product page.
 * Order is fixed: main product video -> existing product photos ->
 * measurement/dimension image -> packaging video (autoplays when in view).
 * All existing photos are preserved exactly as passed in.
 */
export function buildProductGalleryMedia(options: {
  photos: string[];
  productName: string;
}): GalleryMediaItem[] {
  const { photos, productName } = options;
  const cover = photos[0];
  const items: GalleryMediaItem[] = [];

  items.push({
    id: "media-video-main",
    kind: "video",
    src: bouquetVideo.url,
    thumbnail: cover ?? bouquetDimensions.url,
    alt: `${productName} — product video`,
    label: "Video",
    autoPlay: true,
  });

  photos.forEach((src, index) => {
    items.push({
      id: `media-photo-${index}`,
      kind: "image",
      src,
      thumbnail: src,
      alt: `${productName} — photo ${index + 1}`,
    });
  });

  items.push({
    id: "media-dimensions",
    kind: "dimension",
    src: bouquetDimensions.url,
    thumbnail: bouquetDimensions.url,
    alt: `${productName} — size and dimensions guide`,
    label: "Size",
  });

  items.push({
    id: "media-video-packaging",
    kind: "video",
    src: packagingVideo.url,
    thumbnail: photos[1] ?? cover ?? bouquetDimensions.url,
    alt: `${productName} — luxury packaging video`,
    label: "Packaging",
    autoPlay: true,
  });

  return items;
}
