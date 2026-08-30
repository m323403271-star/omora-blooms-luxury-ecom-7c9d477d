import { useEffect, useRef, useState } from "react";
import { Camera, Download, Loader2, RefreshCw, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";

export type TryOnShade = {
  slug: string;
  name: string;
  colorName?: string | null;
  colorHex?: string | null;
  image: string;
};

export type TryOnMode = "hands" | "room" | "wearable";

export function tryOnModeForCategory(category?: string | null): TryOnMode {
  const c = (category ?? "").toLowerCase();
  if (c.includes("frame") || c.includes("vase") || c.includes("plant") || c.includes("indoor")) {
    return "room";
  }
  if (c.includes("wear") || c.includes("accessor") || c.includes("jewel")) {
    return "wearable";
  }
  return "hands";
}

const PHOTO_KEY = "omora-tryon-photo";

const MODEL_POSES: { id: string; label: string; prompt: string }[] = [
  { id: "waist", label: "Classic Waist Hold", prompt: "Standing naturally facing camera, holding the bouquet at waist height with both hands." },
  { id: "walking", label: "Walking", prompt: "Mid-stride walking pose, carrying the bouquet at the side with one hand, relaxed and candid." },
  { id: "shoulder", label: "Over the Shoulder", prompt: "Turned slightly away, glancing back over the shoulder, holding the bouquet near the shoulder." },
  { id: "closeup", label: "Close-up Kissing", prompt: "Close-up portrait, gently holding the bouquet near the face as if kissing the blooms." },
];

const SCENE_PROMPT: Record<TryOnMode, string> = {
  hands: `Professional studio portrait photography. Maintain the person's exact face, facial structure, skin tone, hair, and identity from image 1.
The person is naturally holding the exact crochet flower bouquet shown in image 2, standing naturally facing camera, holding the bouquet at waist height with both hands, fingers realistically wrapping around the stems.
Wardrobe: modern tailored smart-casual or luxury formal wear. Soft studio lighting, warm neutral background, luxury aesthetics.
Photorealistic, ultra-detailed crochet textures, 8k resolution, cinematic soft lighting, no floating objects.`,
  room: "Luxury bouquet displayed as centerpiece in an elegant modern living room.",
  wearable: "Model wearing crochet floral accessory seamlessly.",
};

export function VirtualTryOn({
  productName,
  shades = [],
  activeShadeSlug,
  activeSlug,
  open,
  onClose,
  mode = "hands",
}: {
  productName: string;
  shades?: TryOnShade[];
  activeShadeSlug?: string;
  activeSlug?: string;
  onSelectShade?: (slug: string) => void;
  open: boolean;
  onClose: () => void;
  mode?: TryOnMode;
}) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [look, setLook] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [modelPose, setModelPose] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeShade =
    shades.find((s) => s.slug === (activeShadeSlug ?? activeSlug)) ?? shades[0];
  const productImage = activeShade?.image ?? "";

  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem(PHOTO_KEY);
      if (saved) setPhoto(saved);
    } else {
      stopCamera();
    }
  }, [open]);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startCamera = async (facingMode: "user" | "environment" = "user") => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      toast.error("Camera access denied or unavailable.");
      setCameraActive(false);
    }
  };

  const captureCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      savePhoto(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) savePhoto(result);
    };
    reader.readAsDataURL(file);
  };

  const savePhoto = (dataUrl: string, triggerGen = true) => {
    setPhoto(dataUrl);
    try {
      localStorage.setItem(PHOTO_KEY, dataUrl);
    } catch {
      // ignore storage overflow
    }
    if (triggerGen) generate(dataUrl);
  };

  const generate = async (userPhoto: string | null) => {
    if (loading) return;
    setLoading(true);
    setLook(null);

    try {
      const refs: string[] = [];
      if (userPhoto) refs.push(userPhoto);
      if (productImage) refs.push(productImage);

      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: SCENE_PROMPT[mode], referenceImages: refs }),
      });

      if (!res.ok) {
        toast.error("AI Generation failed. Please check billing or try again.");
        return;
      }

      const json = (await res.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
      const item = json?.data?.[0];
      const url = item?.b64_json ? `data:image/png;base64,${item.b64_json}` : item?.url;

      if (!url) {
        toast.error("No image returned from AI. Please retry.");
        return;
      }

      setLook(url);
    } catch {
      toast.error("Generation error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              Virtual Try-On
            </span>
            <h3 className="text-lg font-medium text-white">{productName}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative aspect-[4/5] sm:aspect-[1/1] w-full bg-zinc-900 flex items-center justify-center overflow-hidden">
          {cameraActive ? (
            <div className="relative w-full h-full">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-4 inset-x-0 flex justify-center gap-4">
                <button
                  onClick={captureCamera}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-full shadow-lg transition"
                >
                  Capture Photo
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : look ? (
            <img
              src={look}
              alt="AI Try-On Result"
              className="w-full h-full object-cover animate-fade-in"
            />
          ) : photo ? (
            <div className="relative w-full h-full">
              <img src={photo} alt="User Upload" className="w-full h-full object-cover opacity-70" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="text-sm text-zinc-300">Ready to generate</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400">
              <Sparkles className="w-12 h-12 mb-3 text-amber-400 animate-pulse" />
              <p className="text-base font-medium text-white">Upload your photo to try this bouquet</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                Take a selfie or upload a photo to see yourself with this bouquet.
              </p>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-sm font-medium text-zinc-200">Generating photorealistic look...</p>
            </div>
          )}
        </div>

        {/* Controls Footer */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => startCamera("user")}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center gap-1.5 transition"
            >
              <Camera className="w-4 h-4" />
              Camera
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center gap-1.5 transition"
            >
              <Upload className="w-4 h-4" />
              Gallery
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          <div className="flex items-center gap-2">
            {look && (
              <a
                href={look}
                download={`${productName}-tryon.png`}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center gap-1.5 transition"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            )}
            <button
              disabled={loading || !photo}
              onClick={() => generate(photo)}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black flex items-center gap-1.5 transition shadow-md"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {look ? "Regenerate" : "Generate Look"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
