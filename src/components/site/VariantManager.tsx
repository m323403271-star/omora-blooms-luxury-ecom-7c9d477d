import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Save, Loader2, Upload, Eye, EyeOff, Film } from "lucide-react";
import { PRODUCT_BUCKET, productImagePath, signProductImages } from "@/lib/storage-image";
import { isVideoRef } from "@/lib/product-variants";
import { handleImageError } from "@/lib/image-fallback";

const MAX_IMAGES = 4;
const MAX_IMG_MB = 5;
const MAX_VIDEO_MB = 25;

type VariantRow = {
  id: string;
  product_id: string;
  slug: string;
  name: string;
  color_name: string;
  color_hex: string;
  price: number;
  description: string | null;
  images: string[];
  video_url: string | null;
  product_video_url: string | null;
  packaging_video_url: string | null;
  active: boolean;
  sort_order: number;
  stock: number;
  track_stock: boolean;
};

const SELECT =
  "id, product_id, slug, name, color_name, color_hex, price, description, images, video_url, product_video_url, packaging_video_url, active, sort_order, stock, track_stock";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function uploadTo(productId: string, file: File): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const key = `${productId}/variants/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(PRODUCT_BUCKET).upload(key, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });
  if (error) { toast.error(error.message); return null; }
  return `${PRODUCT_BUCKET}/${key}`;
}

/** Full add / edit / hide / delete manager for one product's colour variants. */
export function VariantManager({ productId, productName, productPrice }: {
  productId: string;
  productName: string;
  productPrice: number;
}) {
  const [rows, setRows] = useState<VariantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("product_variants")
      .select(SELECT)
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    setRows((data ?? []) as unknown as VariantRow[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [productId]);

  async function addVariant() {
    setCreating(true);
    try {
      const n = rows.length + 1;
      const base = `${slugify(productName)}-shade-${n}`;
      const slug = rows.some((r) => r.slug === base) ? `${base}-${Date.now().toString(36).slice(-4)}` : base;
      const { error } = await supabase.from("product_variants").insert({
        product_id: productId,
        slug,
        name: `${productName} — Shade ${n}`,
        color_name: "New Shade",
        color_hex: "#C8A24A",
        price: productPrice ?? 0,
        sort_order: n,
        active: true,
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Variant added");
      load();
    } finally { setCreating(false); }
  }

  return (
    <div className="mt-5 rounded-2xl border hairline p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[color:var(--gold)]">
          Colour variants ({rows.filter((r) => r.active).length} active / {rows.length})
        </p>
        <button
          onClick={addVariant}
          disabled={creating}
          className="btn-outline-gold px-4 py-2 rounded-full text-xs inline-flex items-center gap-2 disabled:opacity-50"
        >
          {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Add variant
        </button>
      </div>

      {loading ? (
        <p className="mt-4 text-xs text-[color:var(--muted-foreground)] inline-flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading variants…
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-xs text-[color:var(--muted-foreground)]">
          No variants yet — add one and it will appear on the "Pick Your Shade" page.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {rows.map((v) => (
            <VariantEditor key={v.id} variant={v} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function VariantEditor({ variant, onChanged }: { variant: VariantRow; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(variant.name);
  const [colorName, setColorName] = useState(variant.color_name);
  const [colorHex, setColorHex] = useState(variant.color_hex);
  const [price, setPrice] = useState(String(variant.price ?? 0));
  const [description, setDescription] = useState(variant.description ?? "");
  const [stock, setStock] = useState(String(variant.stock ?? 0));
  const [trackStock, setTrackStock] = useState(Boolean(variant.track_stock));
  const [signed, setSigned] = useState<Record<string, string>>({});

  const images = variant.images ?? [];
  const video = variant.video_url;

  useEffect(() => {
    const all = [...images, ...(video ? [video] : [])].filter(Boolean);
    if (all.length === 0) return;
    let active = true;
    signProductImages(all).then((m) => { if (active) setSigned(m); });
    return () => { active = false; };
  }, [images.join("|"), video]);

  const src = (u: string) => signed[u] ?? u;

  const dirty =
    name !== variant.name ||
    colorName !== variant.color_name ||
    colorHex !== variant.color_hex ||
    price !== String(variant.price ?? 0) ||
    description !== (variant.description ?? "") ||
    stock !== String(variant.stock ?? 0) ||
    trackStock !== Boolean(variant.track_stock);

  async function saveDetails() {
    const priceNum = Number(price);
    if (!name.trim()) { toast.error("Variant name is required"); return; }
    if (!Number.isFinite(priceNum) || priceNum < 0) { toast.error("Enter a valid price"); return; }
    setBusy(true);
    try {
      const { error } = await supabase
        .from("product_variants")
        .update({
          name: name.trim(),
          color_name: colorName.trim(),
          color_hex: colorHex.trim() || "#C8A24A",
          price: priceNum,
          description: description.trim() || null,
          stock: Math.max(0, Math.floor(Number(stock) || 0)),
          track_stock: trackStock,
        })
        .eq("id", variant.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Variant saved");
      onChanged();
    } finally { setBusy(false); }
  }

  async function toggleActive() {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("product_variants")
        .update({ active: !variant.active })
        .eq("id", variant.id);
      if (error) { toast.error(error.message); return; }
      toast.success(variant.active ? "Variant hidden" : "Variant is now live");
      onChanged();
    } finally { setBusy(false); }
  }

  async function removeVariant() {
    setBusy(true);
    try {
      const paths = [...images, ...(video ? [video] : [])]
        .map((u) => productImagePath(u))
        .filter((p): p is string => Boolean(p));
      const { error } = await supabase.from("product_variants").delete().eq("id", variant.id);
      if (error) { toast.error(error.message); return; }
      if (paths.length > 0) await supabase.storage.from(PRODUCT_BUCKET).remove(paths);
      toast.success("Variant deleted");
      onChanged();
    } finally { setBusy(false); }
  }

  async function onImages(list: FileList | null) {
    if (!list || list.length === 0) return;
    setBusy(true);
    try {
      const next = [...images];
      for (const file of Array.from(list)) {
        if (next.length >= MAX_IMAGES) { toast.error(`Max ${MAX_IMAGES} gallery images`); break; }
        if (!file.type.startsWith("image/")) { toast.error(`${file.name}: not an image`); continue; }
        if (file.size > MAX_IMG_MB * 1024 * 1024) { toast.error(`${file.name}: over ${MAX_IMG_MB}MB`); continue; }
        const ref = await uploadTo(variant.product_id, file);
        if (ref) next.push(ref);
      }
      const { error } = await supabase.from("product_variants").update({ images: next }).eq("id", variant.id);
      if (error) { toast.error(error.message); return; }
      onChanged();
    } finally { setBusy(false); }
  }

  async function removeImage(idx: number) {
    setBusy(true);
    try {
      const url = images[idx];
      const next = images.filter((_, i) => i !== idx);
      const { error } = await supabase.from("product_variants").update({ images: next }).eq("id", variant.id);
      if (error) { toast.error(error.message); return; }
      const path = productImagePath(url);
      if (path) await supabase.storage.from(PRODUCT_BUCKET).remove([path]);
      toast.success("Image removed");
      onChanged();
    } finally { setBusy(false); }
  }

  async function onVideo(list: FileList | null) {
    const file = list?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) { toast.error("Please choose a video file"); return; }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) { toast.error(`Video must be under ${MAX_VIDEO_MB}MB`); return; }
    setBusy(true);
    try {
      const ref = await uploadTo(variant.product_id, file);
      if (!ref) return;
      const { error } = await supabase.from("product_variants").update({ video_url: ref }).eq("id", variant.id);
      if (error) { toast.error(error.message); return; }
      if (video) {
        const old = productImagePath(video);
        if (old) await supabase.storage.from(PRODUCT_BUCKET).remove([old]);
      }
      toast.success("Video uploaded");
      onChanged();
    } finally { setBusy(false); }
  }

  async function removeVideo() {
    if (!video) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("product_variants").update({ video_url: null }).eq("id", variant.id);
      if (error) { toast.error(error.message); return; }
      const path = productImagePath(video);
      if (path) await supabase.storage.from(PRODUCT_BUCKET).remove([path]);
      toast.success("Video removed");
      onChanged();
    } finally { setBusy(false); }
  }

  return (
    <div className={`rounded-xl border hairline p-4 ${variant.active ? "" : "opacity-60"}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full ring-1 ring-white/25" style={{ backgroundColor: colorHex }} />
          <p className="font-serif text-base">{variant.name}</p>
          <span className="text-[10px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
            {variant.active ? "Live" : "Hidden"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleActive} disabled={busy} className="btn-outline-gold px-3 py-1.5 rounded-full text-[11px] inline-flex items-center gap-1.5 disabled:opacity-50">
            {variant.active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />} {variant.active ? "Hide" : "Show"}
          </button>
          <button onClick={removeVariant} disabled={busy} className="px-3 py-1.5 rounded-full text-[11px] inline-flex items-center gap-1.5 border border-red-500/50 text-red-400 hover:bg-red-500/10 disabled:opacity-50">
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <label className="block md:col-span-2">
          <span className="text-[10px] tracking-widest uppercase text-[color:var(--muted-foreground)]">Variant name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full hairline border rounded-xl bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[color:var(--gold)]" />
        </label>
        <label className="block">
          <span className="text-[10px] tracking-widest uppercase text-[color:var(--muted-foreground)]">Shade name</span>
          <input value={colorName} onChange={(e) => setColorName(e.target.value)} className="mt-1 w-full hairline border rounded-xl bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[color:var(--gold)]" />
        </label>
        <label className="block">
          <span className="text-[10px] tracking-widest uppercase text-[color:var(--muted-foreground)]">Swatch</span>
          <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="mt-1 w-full h-[38px] hairline border rounded-xl bg-transparent px-1" />
        </label>
        <label className="block">
          <span className="text-[10px] tracking-widest uppercase text-[color:var(--muted-foreground)]">Price (₹)</span>
          <input type="number" min={0} inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 w-full hairline border rounded-xl bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[color:var(--gold)]" />
        </label>
        <label className="block">
          <span className="text-[10px] tracking-widest uppercase text-[color:var(--muted-foreground)]">Stock left</span>
          <input type="number" min={0} inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} className="mt-1 w-full hairline border rounded-xl bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[color:var(--gold)]" />
        </label>
        <label className="flex items-center gap-2 md:col-span-1 mt-5">
          <input type="checkbox" checked={trackStock} onChange={(e) => setTrackStock(e.target.checked)} className="h-4 w-4 accent-[color:var(--gold)]" />
          <span className="text-[10px] tracking-widest uppercase text-[color:var(--muted-foreground)]">Track stock / auto sold-out</span>
        </label>
        <label className="block md:col-span-2">
          <span className="text-[10px] tracking-widest uppercase text-[color:var(--muted-foreground)]">Description</span>
          <textarea rows={2} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full hairline border rounded-xl bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[color:var(--gold)] resize-y" />
        </label>
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap justify-end">
        <label className={`btn-outline-gold px-4 py-2 rounded-full text-xs inline-flex items-center gap-2 cursor-pointer ${busy || images.length >= MAX_IMAGES ? "opacity-50 pointer-events-none" : ""}`}>
          <Upload className="h-3 w-3" /> {images.length >= MAX_IMAGES ? "Gallery full" : `Add images (${MAX_IMAGES - images.length} left)`}
          <input type="file" accept="image/*" multiple hidden onChange={(e) => { onImages(e.target.files); e.currentTarget.value = ""; }} />
        </label>
        <label className={`btn-outline-gold px-4 py-2 rounded-full text-xs inline-flex items-center gap-2 cursor-pointer ${busy ? "opacity-50 pointer-events-none" : ""}`}>
          <Film className="h-3 w-3" /> {video ? "Replace video" : "Add video (≤10s)"}
          <input type="file" accept="video/*" hidden onChange={(e) => { onVideo(e.target.files); e.currentTarget.value = ""; }} />
        </label>
        <button onClick={saveDetails} disabled={!dirty || busy} className="btn-gold px-4 py-2 rounded-full text-xs inline-flex items-center gap-2 disabled:opacity-40">
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save variant
        </button>
      </div>

      {(images.length > 0 || videos.length > 0) && (
        <div className="mt-3 grid grid-cols-6 gap-2">
          {productVideo && (
            <VideoThumb src={src(productVideo)} label="Product" busy={busy} onRemove={() => removeVideo("product")} />
          )}
          {images.map((url, i) => (
            <div key={url} className="relative aspect-square rounded-xl overflow-hidden hairline border">
              <img src={src(url)} alt={`${variant.name} ${i + 1}`} onError={handleImageError} className="h-full w-full object-cover" />
              <button onClick={() => removeImage(i)} disabled={busy} aria-label="Remove image" className="absolute top-1 right-1 bg-black/80 text-white rounded-full p-1.5 hover:bg-red-600 disabled:opacity-50">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {packagingVideo && (
            <VideoThumb src={src(packagingVideo)} label="Packaging" busy={busy} onRemove={() => removeVideo("packaging")} />
          )}
        </div>
      )}
    </div>
  );
}

function VideoThumb({ src, label, busy, onRemove }: { src: string; label: string; busy: boolean; onRemove: () => void }) {
  return (
    <div className="relative aspect-square rounded-xl overflow-hidden hairline border">
      <video src={src} muted playsInline preload="metadata" className="h-full w-full object-cover" />
      <button onClick={onRemove} disabled={busy} aria-label={`Remove ${label} video`} className="absolute top-1 right-1 bg-black/80 text-white rounded-full p-1.5 hover:bg-red-600 disabled:opacity-50">
        <Trash2 className="h-3 w-3" />
      </button>
      <span className="absolute bottom-1 left-1 text-[9px] uppercase tracking-wider bg-black/70 text-white rounded-full px-2 py-0.5">{label}</span>
    </div>
  );
}
