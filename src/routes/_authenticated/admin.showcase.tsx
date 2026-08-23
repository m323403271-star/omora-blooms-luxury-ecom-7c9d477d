import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Film, Loader2, Package, Plus, Save, Search, Trash2, Upload, X } from "lucide-react";
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
  is_new_launch: boolean | null;
  price: number | null;
  compare_at_price: number | null;
  created_at: string | null;
};

type FlagField = "is_trending" | "is_bestseller" | "is_new_launch";

type TabId = "trending" | "bestsellers" | "new";

const TABS: { id: TabId; label: string; field: FlagField }[] = [
  { id: "trending", label: "Trending Now", field: "is_trending" },
  { id: "bestsellers", label: "Best Sellers", field: "is_bestseller" },
  { id: "new", label: "New Launched", field: "is_new_launch" },
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
      .select("id, slug, name, category, images, image_url, product_video_url, packaging_video_url, is_trending, is_bestseller, is_new_launch, price, compare_at_price, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const field: FlagField = TABS.find((t) => t.id === tab)!.field;
  const visible = useMemo(() => rows.filter((r) => r[field]), [rows, field]);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function setFlag(id: string, value: boolean) {
    const { error } = await supabase.from("products").update({ [field]: value }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(value ? "Added to section" : "Removed from section");
    await load();
  }

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

      <div className="mt-5">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="btn-gold inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs uppercase tracking-[0.18em]"
        >
          <Plus className="h-3.5 w-3.5" /> Add Product
        </button>
      </div>

      {pickerOpen && (
        <ProductPicker
          rows={rows}
          field={field}
          onClose={() => setPickerOpen(false)}
          onPick={async (id) => { await setFlag(id, true); }}
        />
      )}

      {loading ? (
        <p className="mt-10 inline-flex items-center gap-2 text-sm text-[color:var(--muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading products…
        </p>
      ) : visible.length === 0 ? (
        <p className="mt-10 text-sm text-[color:var(--muted-foreground)]">
          No products in this tab yet. Use “Add Product” to choose items for this section.
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          {visible.map((row) => (
            <ShowcaseCard key={row.id} row={row} onChanged={load} onRemove={() => setFlag(row.id, false)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductPicker({
  rows,
  field,
  onClose,
  onPick,
}: {
  rows: Row[];
  field: FlagField;
  onClose: () => void;
  onPick: (id: string) => Promise<void>;
}) {
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows
      .filter((r) => !r[field])
      .filter((r) => !term || r.name.toLowerCase().includes(term) || r.category.toLowerCase().includes(term))
      .slice(0, 40);
  }, [rows, field, q]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border hairline bg-[color:var(--card)]">
        <div className="flex items-center justify-between gap-3 border-b hairline p-4">
          <p className="font-serif text-lg">Add a product</p>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 rounded-full border hairline px-4 py-2">
            <Search className="h-4 w-4 text-[color:var(--muted-foreground)]" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search store items…"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <div className="mt-3 max-h-[50vh] space-y-2 overflow-y-auto">
            {results.length === 0 ? (
              <p className="py-6 text-center text-sm text-[color:var(--muted-foreground)]">No matching products.</p>
            ) : (
              results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  disabled={busyId !== null}
                  onClick={async () => { setBusyId(r.id); await onPick(r.id); setBusyId(null); onClose(); }}
                  className="flex w-full items-center gap-3 rounded-xl border hairline p-2 text-left transition hover:border-[color:var(--gold)] disabled:opacity-50"
                >
                  <img src={r.image_url} alt="" onError={handleImageError} className="h-12 w-12 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{r.name}</span>
                    <span className="block text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">{r.category}</span>
                  </span>
                  {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 text-[color:var(--gold)]" />}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceEditor({ row, onChanged }: { row: Row; onChanged: () => void | Promise<void> }) {
  const [price, setPrice] = useState(String(row.price ?? 0));
  const [compare, setCompare] = useState(row.compare_at_price != null ? String(row.compare_at_price) : "");
  const [saving, setSaving] = useState(false);

  async function save() {
    const p = Number(price);
    const c = compare.trim() === "" ? null : Number(compare);
    if (!Number.isFinite(p) || p < 0) { toast.error("Enter a valid price"); return; }
    if (c !== null && (!Number.isFinite(c) || c < 0)) { toast.error("Enter a valid original price"); return; }
    setSaving(true);
    const { error } = await supabase.from("products").update({ price: p, compare_at_price: c }).eq("id", row.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Price saved");
    await onChanged();
  }

  return (
    <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border hairline p-3">
      <label className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
        Price (₹)
        <input
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="mt-1 block w-28 rounded-lg border hairline bg-transparent px-3 py-1.5 text-sm text-[color:var(--foreground)]"
        />
      </label>
      <label className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
        Original (₹)
        <input
          type="number"
          min={0}
          value={compare}
          placeholder="none"
          onChange={(e) => setCompare(e.target.value)}
          className="mt-1 block w-28 rounded-lg border hairline bg-transparent px-3 py-1.5 text-sm text-[color:var(--foreground)]"
        />
      </label>
      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="btn-gold inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.18em] disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
      </button>
    </div>
  );
}

function ShowcaseCard({ row, onChanged, onRemove }: { row: Row; onChanged: () => void | Promise<void>; onRemove: () => void | Promise<void> }) {
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
        <div className="flex items-center gap-3">
          <Link to="/products/$slug" params={{ slug: row.slug }} className="text-xs underline text-[color:var(--gold)]">
            View page
          </Link>
          <button
            type="button"
            onClick={() => void onRemove()}
            className="inline-flex items-center gap-1.5 rounded-full border hairline px-3 py-1.5 text-[11px] text-red-400 transition hover:border-red-400 hover:text-red-300"
          >
            <Trash2 className="h-3 w-3" /> Remove
          </button>
        </div>
      </div>

      <PriceEditor key={`${row.price}-${row.compare_at_price}`} row={row} onChanged={onChanged} />

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
