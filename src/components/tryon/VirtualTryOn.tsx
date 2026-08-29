import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  Camera, Download, Image as ImageIcon, Loader2, RotateCcw, ShoppingBag, Sparkles, SwitchCamera, Upload, X, Maximize2,
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

export type TryOnMode = "hands" | "room" | "wall";

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

/** Try-On usage is unlimited (daily quota removed). */
const QUOTA_KEY = "omora:tryon:quota";

function clearQuota() {
  try {
    localStorage.removeItem(QUOTA_KEY);
  } catch {
    /* ignore */
  }
}

type Placement = { x: number; y: number; scale: number; rot: number };


const DEFAULTS: Record<TryOnMode, Placement> = {
  hands: { x: 50, y: 55, scale: 0.42, rot: 0 },
  room: { x: 50, y: 68, scale: 0.34, rot: 0 },
  wall: { x: 50, y: 38, scale: 0.3, rot: 0 },
};

const LABELS: Record<TryOnMode, string> = {
  hands: "Virtual Try-On",
  room: "View in Room",
  wall: "View on Wall",
};

/** The four bouquet poses the customer can switch between. */
export type PoseId = "waist" | "walking" | "shoulder" | "closeup";

const POSES: Array<{ id: PoseId; label: string; posture: string }> = [
  {
    id: "waist",
    label: "Classic Waist Pose",
    posture:
      "standing squarely facing the camera, framed head to knees, both hands naturally holding the bouquet " +
      "at waist level with fingers wrapped around the wrapped stems",
  },
  {
    id: "walking",
    label: "Walking Pose",
    posture:
      "walking forward toward the camera mid-stride, framed head to knees, carrying the bouquet in front " +
      "with the fingers of one hand curled firmly around the stems, natural movement in the outfit",
  },
  {
    id: "shoulder",
    label: "Over the Shoulder Pose",
    posture:
      "body turned away from the camera with the head looking back over the shoulder, framed head to knees, " +
      "holding the bouquet up beside the shoulder with the hand visibly gripping the stems",
  },
  {
    id: "closeup",
    label: "Close-up Kissing Pose",
    posture:
      "close-up portrait from the chest up, holding the bouquet close to the face with the lips gently " +
      "touching the blooms, eyes softly closed, fingers wrapped around the stems just below the blooms",
  },
];

/**
 * Free-tier placement of the catalog cutout for each pose, used by the
 * client-side compositor when AI image generation is unavailable.
 */
const POSE_PLACEMENT: Record<PoseId, Placement> = {
  waist: { x: 50, y: 62, scale: 0.4, rot: 0 },
  walking: { x: 44, y: 60, scale: 0.36, rot: -6 },
  shoulder: { x: 64, y: 42, scale: 0.34, rot: 8 },
  closeup: { x: 52, y: 66, scale: 0.55, rot: 0 },
};

/**
 * Zero-cost fallback: composites the EXACT catalog cutout onto the customer
 * photo with a soft contact shadow. No AI, no paid quota — pure canvas.
 */
async function composeHandsFallback(source: string, product: string, pose: PoseId): Promise<string> {
  const [bg, fg] = await Promise.all([loadImage(source), loadImage(product)]);
  const W = Math.min(1600, bg.naturalWidth || 1200);
  const H = Math.round((W * (bg.naturalHeight || 1600)) / (bg.naturalWidth || 1200));
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.drawImage(bg, 0, 0, W, H);

  const p = POSE_PLACEMENT[pose];
  const targetW = W * p.scale;
  const targetH = targetW * (fg.naturalHeight / fg.naturalWidth || 1);
  ctx.save();
  ctx.translate((p.x / 100) * W, (p.y / 100) * H);
  ctx.rotate((p.rot * Math.PI) / 180);
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = targetW * 0.08;
  ctx.shadowOffsetY = targetH * 0.03;
  ctx.drawImage(fg, -targetW / 2, -targetH / 2, targetW, targetH);
  ctx.restore();
  return canvas.toDataURL("image/png");
}

const WARDROBE =
  "Wardrobe: if the subject reads as male (teen 15+ or adult), dress him in modern tailored smart-casual or " +
  "luxury formal wear — blazer, stylish suit or crisp smart shirt, trousers visible to the knee. " +
  "If the subject reads as female (teen 15+ or adult), dress her in a contemporary elegant knee-length dress, " +
  "stylish semi-formal or luxury party wear. Age-appropriate for 15+ teens, young adults and adults. " +
  "Soft studio lighting, warm neutral background, luxury editorial fashion photography.";

/**
 * Composite prompt: image 1 is the customer (identity lock), image 2 is the
 * EXACT catalog product. The product must be inpainted into the hands with
 * real fingers wrapping it — never pasted as a flat 2D sticker.
 */
function compositePrompt(pose: PoseId, hasPerson: boolean) {
  const p = POSES.find((x) => x.id === pose) ?? POSES[0]!;
  const identity = hasPerson
    ? "IDENTITY LOCK: the FIRST reference image is the customer. Reproduce their face with 100% identical " +
      "facial features, bone structure, skin tone, hairline and expression geometry — no distortion, no " +
      "beautification, no change of age or gender. Treat the face as a locked face embedding. "
    : "Create a single elegant photorealistic model appropriate for a luxury florist campaign. ";
  return (
    identity +
    `PRODUCT LOCK: the LAST reference image is the exact catalog bouquet. Keep its exact shape, colours, ` +
    "flower count, wrapping and texture pixel-faithful — do not redesign, recolour or restyle the product. " +
    "Composite it into the scene with proper depth: the hands and fingers must realistically grip and wrap " +
    "AROUND the bouquet stems with correct occlusion (some fingers in front of the stems, some behind), " +
    "matched lighting, contact shadows and natural perspective. It must never look like a flat cutout " +
    `pasted on the clothing. Pose: ${p.posture}. ${WARDROBE}`
  );
}

const SCENE_PROMPT: Record<TryOnMode, string> = {
  hands: "Photorealistic portrait of a single elegant person.",
  room:
    "Photorealistic interior photo of a minimal luxury living room with an empty wooden side table in the foreground, soft daylight, warm neutral tones, nothing on the table",
  wall:
    "Photorealistic interior photo of a clean empty beige wall with soft daylight and gentle shadows, minimal luxury living room, nothing hanging on the wall",
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
  const [look, setLook] = useState<string>("");
  const [png, setPng] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [scening, setScening] = useState(false);
  const [place, setPlace] = useState<Placement>(DEFAULTS[mode]);
  const [pose, setPose] = useState<PoseId>("waist");
  const [hiRes, setHiRes] = useState(false);
  const [camera, setCamera] = useState<"user" | "environment" | null>(null);
  
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number } | null>(null);

  const active = shades.find((s) => s.slug === activeSlug) ?? shades[0];
  const isHands = mode === "hands";

  // Persist the customer photo so shade switching is one click.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(PHOTO_KEY);
      if (saved) setPhoto(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => clearQuota(), [open]);


  useEffect(() => setPlace(DEFAULTS[mode]), [mode]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamera(null);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);
  useEffect(() => {
    if (!open) stopCamera();
  }, [open, stopCamera]);

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

  /**
   * Generates the final look. Tries AI compositing first; if the AI image
   * quota is unavailable (free tier / no billing), silently falls back to the
   * zero-cost client-side canvas composition of the exact catalog cutout.
   */
  async function generateLook(opts?: { pose?: PoseId; source?: string; product?: string }) {
    const activePose = opts?.pose ?? pose;
    const source = opts?.source ?? photo;
    const product = opts?.product || png || active?.image || "";

    async function fallback(note?: string) {
      if (!isHands || !source || !product) {
        if (note) toast.error(note);
        return;
      }
      try {
        setLook(await composeHandsFallback(source, product, activePose));
        toast.success("Preview ready (free overlay mode).");
      } catch {
        toast.error(note || "Could not generate the look.");
      }
    }

    setScening(true);

    if (isHands) setLook("");
    try {
      const refs = isHands
        ? [source, product].filter((u): u is string => Boolean(u && /^(data:image\/|https?:)/.test(u)))
        : [];
      const body = isHands
        ? {
            prompt: compositePrompt(activePose, Boolean(source)),
            referenceImages: refs,
          }
        : { prompt: SCENE_PROMPT[mode] };

      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        await fallback(
          res.status === 402 ? "AI credits are exhausted." : "Could not generate the look.",
        );
        return;
      }
      const json = (await res.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
      const item = json?.data?.[0];
      const url = item?.b64_json ? `data:image/png;base64,${item.b64_json}` : item?.url;
      if (!url) {
        await fallback("Generation returned no image.");
        return;
      }
      if (isHands) setLook(url);
      else savePhoto(url, false);
    } catch {
      await fallback();
    } finally {
      setScening(false);
    }
  }


  function savePhoto(url: string, autoGenerate = true) {
    setPhoto(url);
    setPlace(DEFAULTS[mode]);
    setLook("");
    try {
      sessionStorage.setItem(PHOTO_KEY, url);
    } catch {
      /* too large for storage — still usable this session */
    }
    // Auto-trigger the AI composite right after capture/upload.
    if (autoGenerate && isHands) void generateLook({ source: url });
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose a photo.");
    const reader = new FileReader();
    reader.onload = () => savePhoto(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  async function startCamera(facing: "user" | "environment") {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing } },
        audio: false,
      });
      streamRef.current = stream;
      setCamera(facing);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      toast.error("Camera unavailable — pick a photo from your gallery instead.");
      fileRef.current?.click();
    }
  }

  function shoot() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (camera === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    stopCamera();
    savePhoto(canvas.toDataURL("image/jpeg", 0.92));
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
    // Hands mode: the AI render IS the final image.
    if (isHands) {
      if (!look) return toast.error("Generate your look first.");
      const link = document.createElement("a");
      link.href = look;
      link.download = `omora-tryon-${active?.slug || "look"}.png`;
      link.click();
      toast.success("Look downloaded.");
      return;
    }
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
      ctx.shadowColor = mode === "wall" ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.45)";
      ctx.shadowBlur = targetW * (mode === "wall" ? 0.05 : 0.08);
      ctx.shadowOffsetY = targetH * (mode === "wall" ? 0.02 : 0.04);
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

  const label = LABELS[mode];
  const shadow =
    mode === "wall"
      ? "drop-shadow(0 10px 16px rgba(0,0,0,0.45))"
      : "drop-shadow(0 18px 22px rgba(0,0,0,0.55))";

  const display = isHands ? look : photo;
  const hasStage = isHands ? Boolean(look || scening) : Boolean(photo);

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
            onClick={() => {
              stopCamera();
              onClose();
            }}
            aria-label="Close try-on"
            className="rounded-full border border-white/20 p-2 text-white/80 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />

        {camera ? (
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full max-h-[62vh] object-contain"
              style={{ transform: camera === "user" ? "scaleX(-1)" : undefined }}
            />
            <div className="flex gap-2 p-2">
              <button onClick={shoot} className="flex-1 btn-gold rounded-full py-2.5 text-xs">
                Capture
              </button>
              <button
                onClick={() => void startCamera(camera === "user" ? "environment" : "user")}
                className="rounded-full border border-white/20 px-4 text-white/80"
                aria-label="Flip camera"
              >
                <SwitchCamera className="h-4 w-4" />
              </button>
              <button onClick={stopCamera} className="rounded-full border border-white/20 px-4 text-white/80 text-xs">
                Cancel
              </button>
            </div>
          </div>
        ) : !hasStage ? (
          <div className="rounded-2xl border border-dashed border-[color:var(--gold)]/40 bg-white/[0.03] p-5 text-center">
            <Camera className="mx-auto h-7 w-7 text-[color:var(--gold)]" />
            <p className="mt-2 font-serif text-base text-white">
              {isHands
                ? "Take a photo of yourself"
                : mode === "wall"
                  ? "Capture the wall you want it on"
                  : "Capture your table, floor or room"}
            </p>
            <p className="text-xs text-white/60">
              {isHands
                ? "Your face stays exactly as captured — we only add the exact catalog bouquet into your hands."
                : "We overlay the exact catalog artwork — never a redrawn image."}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <SourceButton icon={<Camera className="h-4 w-4 scale-x-[-1]" />} label="Front Camera" onClick={() => void startCamera("user")} />
              <SourceButton icon={<Camera className="h-4 w-4" />} label="Back Camera" onClick={() => void startCamera("environment")} />
              <SourceButton icon={<ImageIcon className="h-4 w-4" />} label="Gallery" onClick={() => fileRef.current?.click()} />
            </div>

            <button
              onClick={() => void generateLook({ source: "" })}
              disabled={scening}
              className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full border border-[color:var(--gold)]/50 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-[color:var(--gold)] disabled:opacity-60"
            >
              {scening ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {isHands ? "Use a model pose" : "Use a sample room"}
            </button>
          </div>
        ) : (
          <>
            <div
              ref={stageRef}
              className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black touch-none select-none min-h-[42vh]"
            >
              {display ? (
                <img src={display} alt="Your look" className="w-full h-auto max-h-[62vh] object-contain" />
              ) : null}

              {/* Overlay compositing is only for room / wall modes. */}
              {!isHands && png ? (
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
                    filter: shadow,
                  }}
                />
              ) : null}

              {scening || (!isHands && busy) ? (
                <div className="absolute inset-0 grid place-items-center gap-2 bg-black/70 text-center">
                  <div>
                    <Loader2 className="mx-auto h-7 w-7 animate-spin text-[color:var(--gold)]" />
                    <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-[color:var(--gold)]">
                      Generating look…
                    </p>
                    <p className="mt-1 text-[10px] text-white/50">Keeping your face and the exact bouquet intact</p>
                  </div>
                </div>
              ) : null}
            </div>

            {!isHands ? (
              <>
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
                <p className="text-[10px] text-white/40">Drag the product to reposition it.</p>
              </>
            ) : null}

            {isHands ? (
              <div className="mt-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--gold)] mb-1.5">
                  Choose a pose
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {POSES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPose(p.id);
                        void generateLook({ pose: p.id });
                      }}
                      disabled={scening}

                      className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] transition disabled:opacity-60 ${
                        pose === p.id
                          ? "border-[color:var(--gold)] text-[color:var(--gold)]"
                          : "border-white/15 text-white/70 hover:border-white/40"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {shades.length > 1 ? (
              <div className="mt-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--gold)] mb-1.5">Switch shade</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {shades.map((s) => (
                    <button
                      key={s.slug}
                      onClick={() => {
                        onSelectShade(s.slug);
                        if (isHands) void generateLook({ product: readCached(s.image) || s.image });
                      }}
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
                <Download className="h-4 w-4" /> Download Image
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

            <div className="mt-2 grid grid-cols-4 gap-2">
              <button
                onClick={() => setHiRes(true)}
                className="rounded-full border border-white/15 py-2 text-[10px] uppercase tracking-[0.16em] text-white/70 inline-flex items-center justify-center gap-1.5"
              >
                <Maximize2 className="h-3.5 w-3.5" /> Hi-res
              </button>
              <button
                onClick={() => void startCamera("user")}
                className="rounded-full border border-white/15 py-2 text-[10px] uppercase tracking-[0.16em] text-white/70 inline-flex items-center justify-center gap-1.5"
              >
                <Camera className="h-3.5 w-3.5 scale-x-[-1]" /> Front
              </button>
              <button
                onClick={() => void startCamera("environment")}
                className="rounded-full border border-white/15 py-2 text-[10px] uppercase tracking-[0.16em] text-white/70 inline-flex items-center justify-center gap-1.5"
              >
                <Camera className="h-3.5 w-3.5" /> Back
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="rounded-full border border-white/15 py-2 text-[10px] uppercase tracking-[0.16em] text-white/70 inline-flex items-center justify-center gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" /> Gallery
              </button>
            </div>
            <button
              onClick={() => {
                setPhoto("");
                setLook("");
                try {
                  sessionStorage.removeItem(PHOTO_KEY);
                } catch {
                  /* ignore */
                }
              }}
              className="mt-2 w-full rounded-full border border-white/15 py-2 text-[10px] uppercase tracking-[0.18em] text-white/60 inline-flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Start over
            </button>
          </>
        )}
      </div>

      {hiRes && display ? (
        <div className="fixed inset-0 z-[110] bg-black grid place-items-center p-2" onClick={() => setHiRes(false)}>
          <div className="relative w-full max-w-5xl">
            <img src={display} alt="High-res preview" className="w-full h-auto object-contain" />
            {!isHands && png ? (
              <img
                src={png}
                alt=""
                className="absolute"
                style={{
                  left: `${place.x}%`,
                  top: `${place.y}%`,
                  width: `${place.scale * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${place.rot}deg)`,
                  filter: shadow,
                }}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SourceButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/[0.04] py-3 text-[10px] uppercase tracking-[0.14em] text-white/80 hover:border-[color:var(--gold)]/60"
    >
      <span className="text-[color:var(--gold)]">{icon}</span>
      {label}
    </button>
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

/** Bouquets get "Try-On"; frames get "View on Wall"; décor/plants get "View in Room". */
export function tryOnModeForCategory(category: string | undefined | null): TryOnMode {
  const c = (category || "").toLowerCase();
  if (/frame|wall|photo-frame/.test(c)) return "wall";
  if (/vase|plant|indoor|decor|plante/.test(c)) return "room";
  return "hands";
}
