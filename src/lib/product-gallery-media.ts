import type { GalleryMediaItem } from "@/components/product-gallery";

/**
 * Adapter: builds the gallery media list for a product page.
 * Order is locked: main product video -> product photos -> packaging video.
 * Videos are only included when the admin has uploaded them.
 */
export function buildProductGalleryMedia(options: {
  photos: string[];
  productName: string;
  productVideo?: string | null | undefined;
  packagingVideo?: string | null | undefined;
}): GalleryMediaItem[] {
  const { photos, productName, productVideo, packagingVideo } = options;
  const cover = photos[0];
  const items: GalleryMediaItem[] = [];

  if (productVideo) {
    items.push({
      id: "media-video-main",
      kind: "video",
      src: productVideo,
      thumbnail: cover ?? "",
      alt: `${productName} — product video`,
      label: "Video",
      autoPlay: true,
    });
  }

  photos.forEach((src, index) => {
    items.push({
      id: `media-photo-${index}`,
      kind: "image",
      src,
      thumbnail: src,
      alt: `${productName} — photo ${index + 1}`,
    });
  });

  if (packagingVideo) {
    items.push({
      id: "media-video-packaging",
      kind: "video",
      src: packagingVideo,
      thumbnail: photos[1] ?? cover ?? "",
      alt: `${productName} — luxury packaging video`,
      label: "Packaging",
      autoPlay: true,
    });
  }

  return items;
}
