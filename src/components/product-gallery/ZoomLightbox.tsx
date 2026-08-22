import { useEffect, useState } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";

/**
 * Fullscreen image viewer. Supports native pinch-zoom on touch devices and a
 * tap/button zoom toggle on desktop. Escape or backdrop tap closes it.
 */
export function ZoomLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/70 p-2 text-white"
      >
        <X className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setZoomed((z) => !z); }}
        aria-label={zoomed ? "Zoom out" : "Zoom in"}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-black/70 p-2.5 text-white"
      >
        {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
      </button>
      <div
        className="max-h-full max-w-5xl overflow-auto [touch-action:pinch-zoom]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          onClick={() => setZoomed((z) => !z)}
          className={`mx-auto rounded-2xl object-contain transition-transform duration-300 ${
            zoomed ? "max-h-none w-[180%] cursor-zoom-out sm:w-[150%]" : "max-h-[88vh] w-auto cursor-zoom-in"
          }`}
        />
      </div>
    </div>
  );
}
