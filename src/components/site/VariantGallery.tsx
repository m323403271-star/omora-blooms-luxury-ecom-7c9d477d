import { useEffect, useState } from "react";
import { Maximize2, Play } from "lucide-react";
import { isVideoRef } from "@/lib/product-variants";
import { handleImageError } from "@/lib/image-fallback";

/**
 * One large preview + small thumbnails (photos and one short video).
 * Tapping a thumbnail instantly loads it into the main view.
 */
export function VariantGallery({ media, alt }: { media: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const [full, setFull] = useState(false);

  useEffect(() => { setIndex(0); }, [media.join("|")]);
  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFull(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full]);

  if (media.length === 0) return null;
  const active = media[Math.min(index, media.length - 1)];

  const stage = (cls: string) =>
    isVideoRef(active) ? (
      <video src={active} controls playsInline preload="metadata" className={cls} />
    ) : (
      <img src={active} alt={alt} onError={handleImageError} className={cls} />
    );

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl hairline border bg-black/40 aspect-[4/5]">
        {stage("h-full w-full object-cover")}
        <button
          type="button"
          onClick={() => setFull(true)}
          aria-label="View fullscreen"
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 text-white px-3 py-1.5 text-[10px] tracking-[0.16em] uppercase border border-white/15"
        >
          <Maximize2 className="h-3 w-3" /> Full
        </button>
      </div>

      {media.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {media.map((m, i) => (
            <button
              key={m + i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`View item ${i + 1}`}
              className={`relative aspect-square overflow-hidden rounded-xl border transition ${
                i === index ? "ring-2 ring-[color:var(--gold)] border-transparent" : "hairline opacity-80 hover:opacity-100"
              }`}
            >
              {isVideoRef(m) ? (
                <>
                  <video src={m} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <Play className="h-4 w-4 text-white" />
                  </span>
                </>
              ) : (
                <img src={m} alt={`${alt} ${i + 1}`} onError={handleImageError} className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}

      {full && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setFull(false)}
        >
          <div className="max-h-full max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            {stage("max-h-[85vh] w-full object-contain rounded-2xl")}
            <div className="mt-4 flex justify-center gap-2">
              {media.map((m, i) => (
                <button
                  key={`f-${m}-${i}`}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`View item ${i + 1}`}
                  className={`h-14 w-14 overflow-hidden rounded-lg border ${i === index ? "ring-2 ring-[color:var(--gold)]" : "border-white/20"}`}
                >
                  {isVideoRef(m) ? (
                    <video src={m} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  ) : (
                    <img src={m} alt="" onError={handleImageError} className="h-full w-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
