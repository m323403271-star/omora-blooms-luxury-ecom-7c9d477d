import { useEffect, useRef } from "react";
import type { GalleryMediaItem } from "./types";

interface GalleryStageProps {
  item: GalleryMediaItem;
  isActive: boolean;
  priority?: boolean | undefined;
}

/** Renders a single media item: video, photo, or the 3D-depth dimension card. */
export function GalleryStage({ item, isActive, priority = false }: GalleryStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive && item.autoPlay !== false) {
      void el.play().catch(() => undefined);
    } else {
      el.pause();
      el.currentTime = 0;
    }
  }, [isActive, item.autoPlay]);

  if (item.kind === "video") {
    return (
      <video
        ref={videoRef}
        src={item.src}
        poster={item.thumbnail}
        muted
        loop
        playsInline
        autoPlay={item.autoPlay !== false}
        preload="metadata"
        aria-label={item.alt}
        className="h-full w-full rounded-2xl object-cover"
      />
    );
  }

  if (item.kind === "dimension") {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-neutral-100 via-white to-neutral-200 p-5 [perspective:1200px] sm:p-8">
        <div className="relative w-full max-w-md transition-transform duration-500 ease-out [transform:rotateX(6deg)_rotateY(-8deg)] hover:[transform:rotateX(0deg)_rotateY(0deg)]">
          <div className="absolute inset-0 translate-x-3 translate-y-4 rounded-xl bg-neutral-900/10 blur-xl" />
          <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)]">
            <img
              src={item.src}
              alt={item.alt}
              loading="lazy"
              className="h-full w-full object-contain"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-60" />
          </div>
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-neutral-900 px-3 py-1 text-[11px] font-medium tracking-wide text-white shadow-lg">
            Actual size guide
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={item.src}
      alt={item.alt}
      {...(priority ? {} : { loading: "lazy" as const })}
      className="h-full w-full rounded-2xl object-cover"
    />
  );
}
