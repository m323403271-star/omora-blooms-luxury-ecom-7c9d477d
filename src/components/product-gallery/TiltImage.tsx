import { useRef, useState } from "react";

/**
 * Product photo with an interactive 3D tilt on hover (pointer-driven) and
 * click-to-zoom. Tilt is disabled for touch/coarse pointers.
 */
export function TiltImage({
  src,
  alt,
  priority = false,
  onZoom,
}: {
  src: string;
  alt: string;
  priority?: boolean | undefined;
  onZoom?: (() => void) | undefined;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<{ transform: string }>({ transform: "" });

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    setStyle({
      transform: `perspective(900px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.04)`,
    });
  };

  const reset = () => setStyle({ transform: "" });

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={`${alt} — tap to zoom`}
      onPointerMove={onMove}
      onPointerLeave={reset}
      onClick={() => onZoom?.()}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onZoom?.(); } }}
      className="h-full w-full cursor-zoom-in overflow-hidden rounded-2xl [transform-style:preserve-3d]"
    >
      <img
        src={src}
        alt={alt}
        {...(priority ? {} : { loading: "lazy" as const })}
        style={style}
        className="h-full w-full rounded-2xl object-cover transition-transform duration-200 ease-out will-change-transform"
      />
    </div>
  );
}
