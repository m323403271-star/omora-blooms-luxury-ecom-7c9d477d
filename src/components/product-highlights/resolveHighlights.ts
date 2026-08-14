import type { HighlightSet, HighlightsContent } from "./types";

/** Pure lookup: resolves the highlight set bound to the active media id. */
export function resolveHighlights(
  content: HighlightsContent,
  activeMediaId?: string | undefined,
): HighlightSet {
  if (!activeMediaId) return content.fallback;
  return content.sets.find((set) => set.mediaId === activeMediaId) ?? content.fallback;
}
