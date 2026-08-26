import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  Camera, Download, Loader2, RotateCcw, ShoppingBag, Sparkles, Upload, X, Maximize2,
} from "lucide-react";
import { toast } from "sonner";
import { cutoutCatalogImage } from "@/lib/tryon.functions";

export type TryOnShade = {
  slug: string;
  name: string;
  colorName?: string | null;
  colorHex?: string | null;
  image: string;
};

export type TryOnMode = "hands" | "room";

const PHOTO_KEY = "omora-tryon-photo";
const CUT_PREFIX = "omora-tryon-cut:";

/** In-memory cache so switching shades back and forth is instant. */
const cutCache = new Map<string, string>();

function readCached(url: string): string | null {
  if (cutCache.has(url)) return cutCache.get(url)!;
  try {
    const v = sessionStorage.getItem(CUT_PREFIX + url);
    if (v) cutCache.set(url, v);
    return v;
  } catch {
    return null;
  }
}

function writeCached(url: string, png: string) {
  cutCache.set(url, png);
  try {
    sessionStorage.setItem(CUT_PREFIX + url, png);
  } catch {
    /* quota — memory cache still works */
  }
}

type Placement = { x: number; y: number; scale: number; rot: number };

const DEFAULTS: Record<TryOnMode, Placement> = {
  // Variant 1 defaults: bouquet sits in the hands, décor sits on the surface/wall.
  hands: { x: 50, y: 58, scale: 0.52, rot: 0 },
  room: { x: 50, y: 62, scale: 0.42, rot: 0 },
};

export function VirtualTryOn({
  open,
  onClose,
  mode,
  shades,
  activeSlug,
  onSelectShade,
  productName,
}: {
  open: boolean;
  onClose: () => void;
  mode: TryOnMode;
  shades: TryOnShade[];
  activeSlug: string;
  onSelectShade: (slug: string) => void;
  productName: string;
}) {
  const cutout = useServerFn(cutoutCatalogImage);
  const [photo, setPhoto] = useState<string>("");
  const [png, setPng] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [place, setPlace] = useState<Placement>(DEFAULTS[mode]);
  const [hiRes, setHiRes] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number } | null>(null);

  const active = shades.find((s) => s.slug === activeSlug) ?? shades[0];

  // Persist the customer photo so shade switching is one click.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(PHOTO_KEY);
      if (saved) setPhoto(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => setPlace(DEFAULTS[mode]), [mode]);

  const loadCutout = useCallback(
    async (src: string) => {
      if (!src) return;
      const cached = readCached(src);
      if (cached) {
        setPng(cached);
        return;
      }
      setBusy(true);
      setPng("");
      try {
        const res = await cutout({ data: { imageUrl: src } });
        if (res.ok && res.png) {
          writeCached(src, res.png);
          setPng(res.png);
        } else {
          toast.error(("error" in res && res.error) || "Could not prepare this shade.");
        }
      } catch {
        toast.error("Try-On is unavailable right now.");
      } finally {
        setBusy(false);
      }
    },
    [cutout],
  );

  useEffect(() => {
    if (open && active?.image) void loadCutout(active.image);
  }, [open, active?.image, loadCutout]);

  if (!open) return null;

  function onFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose a photo.");
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "");
      setPhoto(url);
      try {
        sessionStorage.setItem(PHOTO_KEY, url);
      } catch {
        /* too large for storage — still usable this session */
      }
    };
    reader.readAsDataURL(file);
  }

  function onPointerDown(e: React.PointerEvent) {
    dragRef.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: place.x, oy: place.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    const box = stageRef.current?.getBoundingClientRect();
    if (!d || d.id !== e.pointerId || !box) return;
    setPlace((p) => ({
      ...p,
      x: Math.min(100, Math.max(0, d.ox + ((e.clientX - d.sx) / box.width) * 100)),
      y: Math.min(100, Math.max(0, d.oy + ((e.clientY - d.sy) / box.height) * 100)),
    }));
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  async function download() {
    if (!photo || !png) return toast.error("Add a photo first.");
    try {
      const [bg, fg] = await Promise.all([loadImage(photo), loadImage(png)]);
      const W = Math.min(2048, bg.naturalWidth || 1200);
      const H = Math.round((W * (bg.naturalHeight || 1200)) / (bg.naturalWidth || 1200));
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(bg, 0, 0, W, H);

      const targetW = W * place.scale;
      const targetH = targetW * (fg.naturalHeight / fg.naturalWidth);
      ctx.save();
      ctx.translate((place.x / 100) * W, (place.y / 100) * H);
      ctx.rotate((place.rot * Math.PI) / 180);
      if (mode === "room") {
        ctx.shadowColor = "rgba(0,0,0,0.45)";
        ctx.shadowBlur = targetW * 0.08;
        ctx.shadowOffsetY = targetH * 0.04;
      }
      ctx.drawImage(fg, -targetW / 2, -targetH / 2, targetW, targetH);
      ctx.restore();

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `omora-tryon-${active?.slug || "look"}.png`;
      link.click();
      toast.success("High-res preview downloaded.");
    } catch {
      toast.error("Could not export the preview.");
    }
  }

  const label = mode === "hands" ? "Virtual Try-On" : "View in Room";

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-3 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] tracking-[0.24em] uppercase text-[color:var(--gold)] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> {label}
            </p>
            <h2 className="font-serif text-lg md:text-2xl text-white leading-tight">{productName}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close try-on"
            className="rounded-full border border-white/20 p-2 text-white/80 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!photo ? (
          <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[color:var(--gold)]/40 bg-white/[0.03] py-12 text-center cursor-pointer">
            <Camera className="h-7 w-7 text-[color:var(--gold)]" />
            <p className="font-serif text-base text-white">
              {mode === "hands" ? "Upload a selfie holding your hands out" : "Upload a photo of your wall or table"}
            </p>
            <p className="text-xs text-white/60">We overlay the exact catalog artwork — never a redrawn image.</p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-4 py-1.5 text-[10px] uppercase tracking-[0.18em] font-semibold text-[color:var(--noir)]">
              <Upload className="h-3.5 w-3.5" /> Choose photo
            </span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        ) : (
          <>
            <div
              ref={stageRef}
              className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black touch-none select-none"
            >
              <img src={photo} alt="Your photo" className="w-full h-auto max-h-[62vh] object-contain" />
              {png ? (
                <img
                  src={png}
                  alt={`${active?.name ?? productName} overlay`}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  draggable={false}
                  className="absolute cursor-move"
                  style={{
                    left: `${place.x}%`,
                    top: `${place.y}%`,
                    width: `${place.scale * 100}%`,
                    transform: `translate(-50%, -50%) rotate(${place.rot}deg)`,
                    filter: mode === "room" ? "drop-shadow(0 18px 22px rgba(0,0,0,0.55))" : "drop-shadow(0 10px 14px rgba(0,0,0,0.4))",
                  }}
                />
              ) : null}
              {busy ? (
                <div className="absolute inset-0 grid place-items-center bg-black/50">
                  <Loader2 className="h-6 w-6 animate-spin text-[color:var(--gold)]" />
                </div>
              ) : null}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="text-[10px] uppercase tracking-[0.18em] text-white/60">
                Size
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={Math.round(place.scale * 100)}
                  onChange={(e) => setPlace((p) => ({ ...p, scale: Number(e.target.value) / 100 }))}
                  className="w-full accent-[color:var(--gold)]"
                />
              </label>
              <label className="text-[10px] uppercase tracking-[0.18em] text-white/60">
                Rotate
                <input
                  type="range"
                  min={-45}
                  max={45}
                  value={place.rot}
                  onChange={(e) => setPlace((p) => ({ ...p, rot: Number(e.target.value) }))}
                  className="w-full accent-[color:var(--gold)]"
                />
              </label>
            </div>

            {shades.length > 1 ? (
              <div className="mt-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--gold)] mb-1.5">Switch shade</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {shades.map((s) => (
                    <button
                      key={s.slug}
                      onClick={() => onSelectShade(s.slug)}
                      className={`shrink-0 rounded-xl border p-1 transition ${
                        s.slug === active?.slug ? "border-[color:var(--gold)]" : "border-white/15 hover:border-white/40"
                      }`}
                      title={s.colorName || s.name}
                    >
                      <img src={s.image} alt={s.name} className="h-12 w-12 rounded-lg object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-3 flex flex-row gap-2">
              <button onClick={download} className="flex-1 btn-outline-gold rounded-full py-2.5 text-xs inline-flex items-center justify-center gap-1.5">
                <Download className="h-4 w-4" /> Download
              </button>
              <Link
                to="/buy/$variant"
                params={{ variant: active?.slug ?? activeSlug }}
                onClick={onClose}
                className="flex-1 btn-gold rounded-full py-2.5 text-xs inline-flex items-center justify-center gap-1.5"
              >
                <ShoppingBag className="h-4 w-4" /> Buy Now
              </Link>
            </div>

            <div className="mt-2 flex flex-row gap-2">
              <button
                onClick={() => setHiRes(true)}
                className="flex-1 rounded-full border border-white/15 py-2 text-[10px] uppercase tracking-[0.18em] text-white/70 inline-flex items-center justify-center gap-1.5"
              >
                <Maximize2 className="h-3.5 w-3.5" /> High-res preview
              </button>
              <button
                onClick={() => {
                  setPhoto("");
                  try {
                    sessionStorage.removeItem(PHOTO_KEY);
                  } catch {
                    /* ignore */
                  }
                }}
                className="flex-1 rounded-full border border-white/15 py-2 text-[10px] uppercase tracking-[0.18em] text-white/70 inline-flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" /> New photo
              </button>
            </div>
          </>
        )}
      </div>

      {hiRes && photo ? (
        <div className="fixed inset-0 z-[110] bg-black grid place-items-center p-2" onClick={() => setHiRes(false)}>
          <div className="relative w-full max-w-5xl">
            <img src={photo} alt="High-res preview" className="w-full h-auto object-contain" />
            {png ? (
              <img
                src={png}
                alt=""
                className="absolute"
                style={{
                  left: `${place.x}%`,
                  top: `${place.y}%`,
                  width: `${place.scale * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${place.rot}deg)`,
                  filter: mode === "room" ? "drop-shadow(0 18px 22px rgba(0,0,0,0.55))" : "none",
                }}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Bouquets get "Try-On"; décor/plants get "View in Room". */
export function tryOnModeForCategory(category: string | undefined | null): TryOnMode {
  const c = (category || "").toLowerCase();
  if (/frame|vase|plant|indoor|decor|plante/.test(c)) return "room";
  return "hands";
}
