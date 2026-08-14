export interface SpecItem {
  label: string;
  value: string;
}

export interface HighlightSet {
  /** Media id this highlight set is bound to (matches GalleryMediaItem.id). */
  mediaId: string;
  eyebrow: string;
  title: string;
  description: string;
  features: string[];
  specs: SpecItem[];
}

export interface HighlightsContent {
  /** Shown when no media-specific set matches. */
  fallback: HighlightSet;
  sets: HighlightSet[];
}
