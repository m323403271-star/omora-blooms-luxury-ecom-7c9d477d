import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GalleryStage } from "./GalleryStage";
import { GalleryThumbnailRail } from "./GalleryThumbnailRail";
import type { GalleryMediaItem } from "./types";

export interface ProductGalleryProps {
  items: GalleryMediaItem[];
  /** Fires with the id of the media item currently in view. */
  onActiveChange?: ((id: string) => void) | undefined;
  className?: string | undefined;
}

/**
 * Self-contained product media gallery.
 * - Media order is preserved exactly as passed in (main video first, packaging video last).
 * - Main stage is swipeable; thumbnails scroll horizontally and stay in sync.
 * - Compact height on mobile, full square from sm upwards.
 */
export function ProductGallery({ items, onActiveChange, className = "" }: ProductGalleryProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeId = useMemo(
    () => items[activeIndex]?.id ?? items[0]?.id ?? "",
    [items, activeIndex],
  );

  const handleScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex((prev) => (prev === index ? prev : index));
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [items]);

  useEffect(() => {
    if (activeId) onActiveChange?.(activeId);
  }, [activeId, onActiveChange]);

  const goTo = (id: string) => {
    const index = items.findIndex((item) => item.id === id);
    const el = trackRef.current;
    if (index < 0 || !el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
    setActiveIndex(index);
  };

  if (items.length === 0) return null;

  return (
    <div className={`w-full ${className}`}>
      <div className="relative overflow-hidden rounded-2xl bg-neutral-100">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="flex h-[260px] snap-x snap-mandatory overflow-x-auto scroll-smooth sm:h-auto [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, index) => (
            <div
              key={item.id}
              className="h-[260px] w-full shrink-0 snap-center sm:aspect-square sm:h-auto"
            >
              <GalleryStage item={item} isActive={index === activeIndex} priority={index === 0} />
            </div>
          ))}
        </div>

        <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-neutral-900/70 px-2.5 py-1 text-[11px] font-medium text-white">
          {activeIndex + 1} / {items.length}
        </span>
      </div>

      <div className="mt-3 sm:mt-4">
        <GalleryThumbnailRail items={items} activeId={activeId} onSelect={goTo} />
      </div>
    </div>
  );
}
