import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, Play, RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";
import { handleImageError } from "@/lib/image-fallback";

type Props = {
  images: string[];
  alt: string;
};

/** Treat common video containers as playable media; everything else is a photo. */
function isVideo(src: string): boolean {
  return /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i.test(src);
}

/**
 * Universal PDP media viewer:
 * - Large main stage (photo with 3D tilt/zoom, or inline video player).
 * - Thumbnail strip below for every uploaded photo / short video.
 * - Tapping a thumbnail swaps the main view instantly; tapping the main view
 *   (or the expand button) opens a fullscreen lightbox with prev/next navigation.
 */
export function Media3DViewer({ images, alt }: Props) {
  const gallery = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(0);
    setZoomed(false);
  }, [images.join("|")]);

  const step = useCallback(
    (dir: number) => {
      if (gallery.length === 0) return;
      setActive((i) => (i + dir + gallery.length) % gallery.length);
      setZoomed(false);
    },
    [gallery.length],
  );

  // Keyboard navigation + Escape while the lightbox is open.
  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox, step]);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setOrigin({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
    setTilt({ x: (50 - y) / 6, y: (x - 50) / 6 });
  }

  function onLeave() {
    setHovering(false);
    setZoomed(false);
    setTilt({ x: 0, y: 0 });
  }

  const mainSrc = gallery[active] ?? gallery[0];
  const mainIsVideo = mainSrc ? isVideo(mainSrc) : false;
  const auto = !hovering && !zoomed && !mainIsVideo;

  if (!mainSrc) return null;

  return (
    <div className="space-y-3">
      <div
        ref={stageRef}
        className="glass-card rounded-3xl p-2 md:p-3 relative overflow-hidden select-none"
        style={{ perspective: "1400px" }}
        onPointerEnter={() => setHovering(true)}
        onPointerMove={mainIsVideo ? undefined : onMove}
        onPointerLeave={onLeave}
      >
        <div
          className={`relative w-full aspect-square rounded-2xl overflow-hidden bg-[color:var(--noir)] ${auto ? "media3d-auto" : ""}`}
          style={
            auto
              ? { transformStyle: "preserve-3d" }
              : {
                  transformStyle: "preserve-3d",
                  transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                  transition: "transform 120ms ease-out",
                }
          }
        >
          {mainIsVideo ? (
            <video
              key={mainSrc}
              src={mainSrc}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              controls
            />
          ) : (
            <img
              src={mainSrc}
              alt={alt}
              draggable={false}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              sizes="(min-width: 1024px) 50vw, 100vw"
              onError={handleImageError}
              onClick={() => setLightbox(true)}
              className="absolute inset-0 h-full w-full object-cover will-change-transform cursor-zoom-in"
              style={{
                transform: zoomed ? "scale(2)" : "scale(1)",
                transformOrigin: `${origin.x}% ${origin.y}%`,
                transition: zoomed ? "transform 250ms ease-out" : "transform 400ms ease-out",
              }}
            />
          )}
          {!mainIsVideo && (
            <>
              {/* Specular sheen for the 3D feel */}
              <div
                className="pointer-events-none absolute inset-0 opacity-70 mix-blend-overlay"
                style={{
                  background: `radial-gradient(600px circle at ${origin.x}% ${origin.y}%, rgba(255,255,255,0.28), transparent 45%)`,
                }}
              />
              <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{ boxShadow: "inset 0 0 60px rgba(200,162,74,0.18)" }} />
            </>
          )}
        </div>

        {!mainIsVideo && (
          <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase text-[color:var(--gold)] border border-[color:var(--gold)]/30">
            <RotateCw className="h-3 w-3 animate-spin" style={{ animationDuration: "10s" }} /> 3D View
          </div>
        )}

        <div className="absolute top-4 right-4 flex items-center gap-2">
          {!mainIsVideo && (
            <button
              type="button"
              onClick={() => setZoomed((z) => !z)}
              aria-label={zoomed ? "Exit zoom" : "Zoom in"}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase text-white/80 border hairline"
            >
              {zoomed ? <ZoomOut className="h-3 w-3" /> : <ZoomIn className="h-3 w-3" />}
              {zoomed ? "Exit" : "Zoom"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setLightbox(true)}
            aria-label="Open fullscreen gallery"
            className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase text-white/80 border hairline"
          >
            <Expand className="h-3 w-3" /> Full
          </button>
        </div>
      </div>

      {gallery.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {gallery.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => { setActive(i); setZoomed(false); }}
              onDoubleClick={() => setLightbox(true)}
              aria-label={isVideo(src) ? `Play video ${i + 1}` : `View photo ${i + 1}`}
              className={`relative shrink-0 rounded-xl overflow-hidden border transition ${
                active === i
                  ? "border-[color:var(--gold)] shadow-[0_0_0_2px_rgba(200,162,74,0.35)]"
                  : "hairline hover:border-[color:var(--gold)]/60"
              }`}
            >
              {isVideo(src) ? (
                <>
                  <video src={src} muted playsInline preload="metadata" className="h-16 w-16 md:h-20 md:w-20 object-cover" />
                  <span className="absolute inset-0 grid place-items-center bg-black/35">
                    <Play className="h-4 w-4 text-white" fill="currentColor" />
                  </span>
                </>
              ) : (
                <img
                  src={src}
                  alt={`${alt} — view ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                  onError={handleImageError}
                  className="h-16 w-16 md:h-20 md:w-20 object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm animate-fade-in flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} gallery`}
          onClick={() => setLightbox(false)}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[11px] tracking-[0.2em] uppercase text-[color:var(--gold)]">
              {active + 1} / {gallery.length}
            </span>
            <button
              type="button"
              onClick={() => setLightbox(false)}
              aria-label="Close gallery"
              className="rounded-full border hairline p-2 text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center px-4 pb-4" onClick={(e) => e.stopPropagation()}>
            {isVideo(mainSrc) ? (
              <video
                key={mainSrc}
                src={mainSrc}
                className="max-h-full max-w-full rounded-2xl"
                autoPlay
                loop
                playsInline
                controls
              />
            ) : (
              <img
                src={mainSrc}
                alt={alt}
                onError={handleImageError}
                className="max-h-full max-w-full rounded-2xl object-contain animate-scale-in"
              />
            )}

            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous item"
                  className="absolute left-2 md:left-6 rounded-full bg-black/70 border hairline p-3 text-white hover:bg-black"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next item"
                  className="absolute right-2 md:right-6 rounded-full bg-black/70 border hairline p-3 text-white hover:bg-black"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto px-4 pb-5" onClick={(e) => e.stopPropagation()}>
              {gallery.map((src, i) => (
                <button
                  key={`lb-${src}-${i}`}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Go to item ${i + 1}`}
                  className={`relative shrink-0 rounded-lg overflow-hidden border ${
                    active === i ? "border-[color:var(--gold)]" : "border-white/20 opacity-70 hover:opacity-100"
                  }`}
                >
                  {isVideo(src) ? (
                    <>
                      <video src={src} muted playsInline preload="metadata" className="h-14 w-14 object-cover" />
                      <span className="absolute inset-0 grid place-items-center bg-black/35">
                        <Play className="h-3 w-3 text-white" fill="currentColor" />
                      </span>
                    </>
                  ) : (
                    <img src={src} alt="" onError={handleImageError} className="h-14 w-14 object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
