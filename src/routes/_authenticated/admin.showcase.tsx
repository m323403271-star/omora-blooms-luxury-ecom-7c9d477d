import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Film, Loader2, Package, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_BUCKET, productImagePath, signProductImages } from "@/lib/storage-image";
import { handleImageError } from "@/lib/image-fallback";

export const Route = createFileRoute("/_authenticated/admin/showcase")({
  head: () => ({
    meta: [
      { title: "Showcase Media — OMORA BLOOMS Admin" },
      { name: "description", content: "Upload product videos, photos and packaging videos for Trending, Best Sellers and New Launched." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminShowcasePage,
});

const MAX_IMAGES = 4;
const MAX_IMAGE_MB = 5;
const MAX_VIDEO_MB = 25;
const MAX_VIDEO_SECONDS = 15;

type Row = {
  id: string;
  slug: string;
  name: string;
  category: string;
  images: string[] | null;
  image_url: string;
  product_video_url: string | null;
  packaging_video_url: string | null;
  is_trending: boolean | null;
  is_bestseller: boolean | null;
  created_at: string | null;
};

type TabId = "trending" | "bestsellers" | "new";

const TABS: { id: TabId; label: string }[] = [
  { id: "trending", label: "Trending Now" },
  { id: "bestsellers", label: "Best Sellers" },
  { id: "new", label: "New Launched" },
];

/** Reads a chosen video's duration in the browser; null when it can't be determined. */
function readVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement("video");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      const d = el.duration;
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(d) ? d : null);
    };
    el.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    el.src = url;
  });
}

function AdminShowcasePage() {
  const [tab, setTab] = useState<TabId>("trending");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("id, slug, name, category, images, image_url, product_video_url, packaging_video_url, is_trending, is_bestseller, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => {
    if (tab === "trending") return rows.filter((r) => r.is_trending);
    if (tab === "bestsellers") return rows.filter((r) => r.is_bestseller);
    return rows.slice(0, 8);
  }, [rows, tab]);

  return (
    <div className="container-luxe py-10">
      <Link to="/admin/products" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)] hover:text-[color:var(--gold)]">
        <ArrowLeft className="h-3.5 w-3.5" /> Products
      </Link>
      <h1 className="mt-4 font-serif text-3xl md:text-4xl">Showcase Media</h1>
      <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
        Slider order on the product page is locked to: Product Video → 4 photos → Packaging Video.
      </p>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em] border transition ${
              tab === t.id ? "btn-gold border-transparent" : "hairline text-[color:var(--muted-foreground)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-10 inline-flex items-center gap-2 text-sm text-[color:var(--muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading products…
        </p>
      ) : visible.length === 0 ? (
        <p className="mt-10 text-sm text-[color:var(--muted-foreground)]">
          No products in this tab yet. Mark products as trending or bestseller in Products & Shades.
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          {visible.map((row) => (
            <ShowcaseCard key={row.id} row={row} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function ShowcaseCard({ row, onChanged }: { row: Row; onChanged: () => void | Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [signed, setSigned] = useState<Record<string, string>>({});

  const images = (row.images ?? []).filter(Boolean);
  const refs = [...images, row.product_video_url, row.packaging_video_url].filter((v): v is string => Boolean(v));

  useEffect(() => {
    if (refs.length === 0) return;
    let active = true;
    signProductImages(refs).then((m) => { if (active) setSigned(m); });
    return () => { active = false; };
  }, [refs.join("|")]);

  const view = (v: string) => signed[v] ?? v;

  async function upload(file: File): Promise<string | null> {
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const key = `${row.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(PRODUCT_BUCKET).upload(key, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });
    if (error) { toast.error(error.message); return null; }
    return `${PRODUCT_BUCKET}/${key}`;
  }

  type ProductUpdate = Partial<{
    images: string[];
    image_url: string;
    product_video_url: string | null;
    packaging_video_url: string | null;
  }>;

  async function patch(update: ProductUpdate, message: string) {
    const { error } = await supabase.from("products").update(update).eq("id", row.id);
    if (error) { toast.error(error.message); return; }
    toast.success(message);
    await onChanged();
  }

  async function onVideo(file: File | undefined, field: "product_video_url" | "packaging_video_url") {
    if (!file) return;
    setBusy(true);
    try {
      if (!file.type.startsWith("video/")) { toast.error("Please choose a video file"); return; }
      if (file.size > MAX_VIDEO_MB * 1024 * 1024) { toast.error(`Video must be under ${MAX_VIDEO_MB}MB`); return; }
      const duration = await readVideoDuration(file);
      if (duration !== null && duration > MAX_VIDEO_SECONDS + 0.5) {
        toast.error(`Video must be ${MAX_VIDEO_SECONDS}s or shorter`);
        return;
      }
      const ref = await upload(file);
      if (!ref) return;
      await patch({ [field]: ref }, field === "product_video_url" ? "Product video live" : "Packaging video live");
    } finally { setBusy(false); }
  }

  async function onImages(list: FileList | null) {
    if (!list || list.length === 0) return;
    setBusy(true);
    try {
      const next = [...images];
      for (const file of Array.from(list)) {
        if (next.length >= MAX_IMAGES) { toast.error(`Max ${MAX_IMAGES} photos`); break; }
        if (!file.type.startsWith("image/")) { toast.error(`${file.name}: not an image`); continue; }
        if (file.size > MAX_IMAGE_MB * 1024 * 1024) { toast.error(`${file.name}: over ${MAX_IMAGE_MB}MB`); continue; }
        const ref = await upload(file);
        if (ref) next.push(ref);
      }
      if (next.length === images.length) return;
      const update: ProductUpdate = { images: next };
      if (next[0]) update.image_url = next[0];
      await patch(update, "Photos updated");
    } finally { setBusy(false); }
  }

  async function removeImage(index: number) {
    setBusy(true);
    try {
      const target = images[index];
      const next = images.filter((_, i) => i !== index);
      const update: ProductUpdate = { images: next };
      if (next[0]) update.image_url = next[0];
      await patch(update, "Photo removed");
      const path = target ? productImagePath(target) : null;
      if (path) await supabase.storage.from(PRODUCT_BUCKET).remove([path]);
    } finally { setBusy(false); }
  }

  async function removeVideo(field: "product_video_url" | "packaging_video_url") {
    setBusy(true);
    try {
      const target = row[field];
      await patch({ [field]: null }, "Video removed");
      const path = target ? productImagePath(target) : null;
      if (path) await supabase.storage.from(PRODUCT_BUCKET).remove([path]);
    } finally { setBusy(false); }
  }

  const remaining = Math.max(0, MAX_IMAGES - images.length);

  return (
    <div className="rounded-2xl border hairline p-4 md:p-5 bg-[color:var(--card)]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="font-serif text-lg">{row.name}</p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">{row.category}</p>
        </div>
        <Link to="/products/$slug" params={{ slug: row.slug }} className="text-xs underline text-[color:var(--gold)]">
          View page
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MediaSlot
          title="Main Product Video"
          hint={`1st in slider · ≤${MAX_VIDEO_SECONDS}s · autoplay, muted, loop`}
          icon={<Film className="h-3.5 w-3.5" />}
          src={row.product_video_url ? view(row.product_video_url) : null}
          busy={busy}
          onPick={(f) => onVideo(f, "product_video_url")}
          onRemove={() => removeVideo("product_video_url")}
        />
        <MediaSlot
          title="Packaging Video"
          hint={`Last in slider · ≤${MAX_VIDEO_SECONDS}s · autoplay, muted, loop`}
          icon={<Package className="h-3.5 w-3.5" />}
          src={row.packaging_video_url ? view(row.packaging_video_url) : null}
          busy={busy}
          onPick={(f) => onVideo(f, "packaging_video_url")}
          onRemove={() => removeVideo("packaging_video_url")}
        />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
            Product Images ({images.length}/{MAX_IMAGES})
          </p>
          <label className={`btn-outline-gold px-4 py-2 rounded-full text-xs inline-flex items-center gap-2 cursor-pointer ${remaining === 0 || busy ? "opacity-50 pointer-events-none" : ""}`}>
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            {remaining === 0 ? "Gallery full" : `Add Images (${remaining} left)`}
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => { void onImages(e.target.files); e.currentTarget.value = ""; }}
            />
          </label>
        </div>
        {images.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {images.map((url, i) => (
              <div key={url} className="relative aspect-square overflow-hidden rounded-xl border hairline">
                <img src={view(url)} alt={`${row.name} ${i + 1}`} onError={handleImageError} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  disabled={busy}
                  aria-label="Remove photo"
                  className="absolute right-1 top-1 rounded-full bg-black/80 p-1.5 text-white transition hover:bg-red-600 disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MediaSlot({
  title,
  hint,
  icon,
  src,
  busy,
  onPick,
  onRemove,
}: {
  title: string;
  hint: string;
  icon: React.ReactNode;
  src: string | null;
  busy: boolean;
  onPick: (file: File | undefined) => void | Promise<void>;
  onRemove: () => void | Promise<void>;
}) {
  return (
    <div className="rounded-xl border hairline p-3">
      <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[color:var(--gold)]">
        {icon} {title}
      </p>
      <p className="mt-1 text-[11px] text-[color:var(--muted-foreground)]">{hint}</p>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border hairline bg-black/30">
          {src ? (
            <video src={src} muted loop playsInline preload="metadata" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[10px] text-[color:var(--muted-foreground)]">None</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className={`btn-outline-gold px-3 py-1.5 rounded-full text-[11px] inline-flex items-center gap-2 cursor-pointer ${busy ? "opacity-50 pointer-events-none" : ""}`}>
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            {src ? "Replace" : "Upload"}
            <input
              type="file"
              accept="video/*"
              hidden
              onChange={(e) => { void onPick(e.target.files?.[0]); e.currentTarget.value = ""; }}
            />
          </label>
          {src && (
            <button
              type="button"
              onClick={() => void onRemove()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 text-[11px] text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" /> Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
