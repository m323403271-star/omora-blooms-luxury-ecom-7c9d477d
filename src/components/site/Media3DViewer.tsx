import { useEffect, useRef, useState } from "react";
import { RotateCw, ZoomIn, ZoomOut } from "lucide-react";

type Props = {
  images: string[];
  alt: string;
};

/**
 * Universal PDP media viewer:
 * - Auto 10s interactive 3D rotation loop (perspective tilt + subtle spin + specular sheen).
 * - Pointer-driven parallax on hover / touch drag.
 * - Tap / click to toggle macro zoom with cursor-follow origin.
 * - Thumbnail gallery below for switching to additional angles.
 */
export function Media3DViewer({ images, alt }: Props) {
  const gallery = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(0);
    setZoomed(false);
  }, [images.join("|")]);

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
  const auto = !hovering && !zoomed;

  return (
    <div className="space-y-3">
      <div
        ref={stageRef}
        className="glass-card rounded-3xl p-2 md:p-3 relative overflow-hidden select-none"
        style={{ perspective: "1400px" }}
        onPointerEnter={() => setHovering(true)}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onClick={() => setZoomed((z) => !z)}
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
          <img
            src={mainSrc}
            alt={alt}
            draggable={false}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="absolute inset-0 h-full w-full object-cover will-change-transform"
            style={{
              transform: zoomed ? "scale(2)" : "scale(1)",
              transformOrigin: `${origin.x}% ${origin.y}%`,
              transition: zoomed ? "transform 250ms ease-out" : "transform 400ms ease-out",
            }}
          />
          {/* Specular sheen for the 3D feel */}
          <div
            className="pointer-events-none absolute inset-0 opacity-70 mix-blend-overlay"
            style={{
              background: `radial-gradient(600px circle at ${origin.x}% ${origin.y}%, rgba(255,255,255,0.28), transparent 45%)`,
            }}
          />
          {/* Gold rim shimmer */}
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              boxShadow: "inset 0 0 60px rgba(200,162,74,0.18)",
            }}
          />
        </div>

        <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase text-[color:var(--gold)] border border-[color:var(--gold)]/30">
          <RotateCw className="h-3 w-3 animate-spin" style={{ animationDuration: "10s" }} /> 3D View
        </div>
        <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase text-white/80 border hairline">
          {zoomed ? <ZoomOut className="h-3 w-3" /> : <ZoomIn className="h-3 w-3" />}
          {zoomed ? "Tap to exit" : "Tap to zoom"}
        </div>
      </div>

      {gallery.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {gallery.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => { setActive(i); setZoomed(false); }}
              aria-label={`View angle ${i + 1}`}
              className={`shrink-0 rounded-xl overflow-hidden border transition ${
                active === i
                  ? "border-[color:var(--gold)] shadow-[0_0_0_2px_rgba(200,162,74,0.35)]"
                  : "hairline hover:border-[color:var(--gold)]/60"
              }`}
            >
              <img src={src} alt={`${alt} — angle ${i + 1}`} className="h-16 w-16 md:h-20 md:w-20 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
