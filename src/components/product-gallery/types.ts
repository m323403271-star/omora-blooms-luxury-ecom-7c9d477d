export type GalleryMediaKind = "video" | "image" | "dimension";

export interface GalleryMediaItem {
  id: string;
  kind: GalleryMediaKind;
  /** Video file URL or image URL. */
  src: string;
  /** Poster/thumbnail shown in the rail (required for videos). */
  thumbnail: string;
  alt: string;
  /** Small caption shown on the thumbnail, e.g. "Video", "Size". */
  label?: string | undefined;
  /** Autoplay muted+looped when this video becomes the active slide. */
  autoPlay?: boolean | undefined;
}
