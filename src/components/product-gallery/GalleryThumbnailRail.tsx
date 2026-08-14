import { useCallback, useEffect, useRef, useState } from "react";
import type { GalleryMediaItem } from "./types";

interface GalleryThumbnailRailProps {
  items: GalleryMediaItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

/** Smooth horizontal swipe/slide rail of thumbnails. */
export function GalleryThumbnailRail({ items, activeId, onSelect }: GalleryThumbnailRailProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const onResize = () => update();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [update, items.length]);

  // Keep the active thumbnail in view when the stage changes.
  useEffect(() => {
    const el = trackRef.current?.querySelector<HTMLElement>(`[data-thumb-id="${activeId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [activeId]);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.7, 160), behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={update}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              data-thumb-id={item.id}
              onClick={() => onSelect(item.id)}
              aria-label={item.alt}
              aria-current={isActive}
              className={`relative h-16 w-16 shrink-0 snap-start overflow-hidden rounded-xl border transition-all duration-200 sm:h-20 sm:w-20 ${
                isActive
                  ? "border-neutral-900 ring-2 ring-neutral-900/15"
                  : "border-neutral-200 opacity-80 hover:opacity-100"
              }`}
            >
              <img
                src={item.thumbnail}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
              {item.kind === "video" ? (
                <span className="absolute inset-0 flex items-center justify-center bg-neutral-900/25">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white drop-shadow">
                    <path d="M8 5.5v13l11-6.5-11-6.5z" />
                  </svg>
                </span>
              ) : null}
              {item.label ? (
                <span className="absolute inset-x-0 bottom-0 bg-neutral-900/70 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white">
                  {item.label}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <RailButton side="left" disabled={!canPrev} onClick={() => scrollBy(-1)} />
      <RailButton side="right" disabled={!canNext} onClick={() => scrollBy(1)} />
    </div>
  );
}

function RailButton({
  side,
  disabled,
  onClick,
}: {
  side: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === "left" ? "Previous thumbnails" : "More thumbnails"}
      className={`absolute top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/95 text-neutral-700 shadow-sm transition hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-0 sm:flex ${
        side === "left" ? "-left-3" : "-right-3"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current" fill="none" strokeWidth="2">
        <path
          d={side === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
