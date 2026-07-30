import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Trash2, Image as ImageIcon, Search, ArrowLeft, Loader2, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: AdminProductsPage,
});

type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  image_url: string;
  images: string[] | null;
  price: number;
  compare_at_price: number | null;
  description: string | null;
};

const BUCKET = "product-images";
const MAX_PER_PRODUCT = 4;
const MAX_MB = 5;

// Bucket is private, so we store the object path and render via signed URLs.
function storedRef(path: string) {
  return `${BUCKET}/${path}`;
}

// Storage path from a stored reference (used for delete)
function pathFromUrl(url: string): string | null {
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i >= 0) return url.slice(i + marker.length).split("?")[0];
  if (url.startsWith(`${BUCKET}/`)) return url.slice(BUCKET.length + 1).split("?")[0];
  return null;
}

function AdminProductsPage() {
  const [rows, setRows] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) { setIsAdmin(false); return; }
      const { data: roles } = await supabase.rpc("has_role", { _user_id: user.user.id, _role: "admin" });
      setIsAdmin(Boolean(roles));
    })();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("id, slug, name, category, image_url, images, price, compare_at_price, description")
      .order("category")
      .order("name");
    if (error) toast.error(error.message);
    setRows((data ?? []) as Product[]);
    setLoading(false);
  }

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(term) || r.category.toLowerCase().includes(term) || r.slug.toLowerCase().includes(term));
  }, [rows, q]);

  if (isAdmin === false) {
    return (
      <div className="container-luxe py-24 text-center">
        <p className="text-[color:var(--muted-foreground)]">Admin access required.</p>
        <Link to="/auth" className="mt-4 inline-block btn-outline-gold px-5 py-2 rounded-full text-sm">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="container-luxe py-10 md:py-14">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="font-serif text-3xl md:text-4xl mt-1">Product Photos</h1>
          <p className="text-sm text-[color:var(--muted-foreground)] mt-1">Upload up to {MAX_PER_PRODUCT} gallery images per product (max {MAX_MB}MB each), and edit price & description — changes go live instantly.</p>
        </div>
        <Link to="/" className="btn-outline-gold px-4 py-2 rounded-full text-xs inline-flex items-center gap-2"><ArrowLeft className="h-3 w-3" /> Back to site</Link>

      </div>

      <div className="mt-8 flex items-center gap-3 hairline border rounded-full px-4 py-2 max-w-md">
        <Search className="h-4 w-4 text-[color:var(--muted-foreground)]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product, category…" className="bg-transparent w-full text-sm outline-none" />
      </div>

      {loading ? (
        <div className="mt-16 text-center text-[color:var(--muted-foreground)] inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading products…</div>
      ) : (
        <div className="mt-8 grid gap-4">
          {filtered.map((p) => (
            <ProductRow key={p.id} product={p} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductRow({ product, onChanged }: { product: Product; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [price, setPrice] = useState(String(product.price ?? 0));
  const [compareAt, setCompareAt] = useState(product.compare_at_price != null ? String(product.compare_at_price) : "");
  const [description, setDescription] = useState(product.description ?? "");
  const [saving, setSaving] = useState(false);
  const images = product.images ?? [];
  const [signed, setSigned] = useState<Record<string, string>>({});

  useEffect(() => {
    const all = [product.image_url, ...images].filter(Boolean) as string[];
    if (all.length === 0) return;
    let active = true;
    signProductImages(all).then((m) => { if (active) setSigned(m); });
    return () => { active = false; };
  }, [product.image_url, images.join("|")]);

  const src = (u: string) => signed[u] ?? u;

  const dirty =
    price !== String(product.price ?? 0) ||
    compareAt !== (product.compare_at_price != null ? String(product.compare_at_price) : "") ||
    description !== (product.description ?? "");

  async function saveDetails() {
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) { toast.error("Enter a valid price"); return; }
    const compareNum = compareAt.trim() === "" ? null : Number(compareAt);
    if (compareNum !== null && (!Number.isFinite(compareNum) || compareNum < 0)) { toast.error("Enter a valid compare-at price"); return; }
    if (description.length > 2000) { toast.error("Description must be under 2000 characters"); return; }
    setSaving(true);
    const { error } = await supabase
      .from("products")
      .update({ price: priceNum, compare_at_price: compareNum, description: description.trim() || null })
      .eq("id", product.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Product details updated");
    onChanged();
  }
  const remaining = Math.max(0, MAX_PER_PRODUCT - images.length);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files).slice(0, remaining);
    if (list.length === 0) { toast.error(`Max ${MAX_PER_PRODUCT} images per product`); return; }
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const file of list) {
        if (!file.type.startsWith("image/")) { toast.error(`${file.name}: not an image`); continue; }
        if (file.size > MAX_MB * 1024 * 1024) { toast.error(`${file.name}: over ${MAX_MB}MB`); continue; }
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const key = `${product.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(key, file, {
          cacheControl: "31536000",
          contentType: file.type,
          upsert: false,
        });
        if (error) { toast.error(error.message); continue; }
        uploaded.push(storedRef(key));
      }
      if (uploaded.length === 0) return;
      const next = [...images, ...uploaded].slice(0, MAX_PER_PRODUCT);
      const { error: uErr } = await supabase.from("products").update({ images: next }).eq("id", product.id);
      if (uErr) { toast.error(uErr.message); return; }
      toast.success(`Uploaded ${uploaded.length} photo${uploaded.length > 1 ? "s" : ""}`);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function removeAt(idx: number) {
    setBusy(true);
    try {
      const url = images[idx];
      const next = images.filter((_, i) => i !== idx);
      const { error: uErr } = await supabase.from("products").update({ images: next }).eq("id", product.id);
      if (uErr) { toast.error(uErr.message); return; }
      const path = pathFromUrl(url);
      if (path) await supabase.storage.from(BUCKET).remove([path]);
      toast.success("Removed");
      onChanged();
    } finally { setBusy(false); }
  }

  return (
    <div className="glass-card rounded-2xl p-4 md:p-5">
      <div className="flex items-center gap-4 flex-wrap">
        <img src={product.image_url} alt={product.name} className="h-16 w-16 rounded-xl object-cover hairline border" />
        <div className="flex-1 min-w-[200px]">
          <p className="text-[10px] tracking-widest uppercase text-[color:var(--muted-foreground)]">{product.category}</p>
          <p className="font-serif text-lg leading-tight">{product.name}</p>
          <p className="text-xs text-[color:var(--muted-foreground)] mt-0.5">{images.length}/{MAX_PER_PRODUCT} gallery photos</p>
        </div>
        <label className={`btn-outline-gold px-4 py-2 rounded-full text-xs inline-flex items-center gap-2 cursor-pointer ${remaining === 0 || busy ? "opacity-50 pointer-events-none" : ""}`}>
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          {remaining === 0 ? "Full" : `Upload (${remaining} left)`}
          <input type="file" accept="image/*" multiple hidden onChange={(e) => { handleFiles(e.target.files); e.currentTarget.value = ""; }} />
        </label>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[160px_160px_1fr] md:items-start">
        <label className="block">
          <span className="text-[10px] tracking-widest uppercase text-[color:var(--muted-foreground)]">Price (₹)</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 w-full hairline border rounded-xl bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[color:var(--gold)]"
          />
        </label>
        <label className="block">
          <span className="text-[10px] tracking-widest uppercase text-[color:var(--muted-foreground)]">Compare at (₹)</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={compareAt}
            placeholder="Optional"
            onChange={(e) => setCompareAt(e.target.value)}
            className="mt-1 w-full hairline border rounded-xl bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[color:var(--gold)]"
          />
        </label>
        <label className="block">
          <span className="text-[10px] tracking-widest uppercase text-[color:var(--muted-foreground)]">Description</span>
          <textarea
            rows={3}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this product for customers…"
            className="mt-1 w-full hairline border rounded-xl bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[color:var(--gold)] resize-y"
          />
        </label>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          onClick={saveDetails}
          disabled={!dirty || saving}
          className="btn-gold px-4 py-2 rounded-full text-xs inline-flex items-center gap-2 disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save changes
        </button>
      </div>

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-4 md:grid-cols-6 gap-2">
          {images.map((url, i) => (
            <div key={url} className="relative group aspect-square rounded-xl overflow-hidden hairline border">
              <img src={url} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
              <button
                onClick={() => removeAt(i)}
                disabled={busy}
                className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition"
                aria-label="Remove photo"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {Array.from({ length: remaining }).map((_, i) => (
            <div key={`ph-${i}`} className="aspect-square rounded-xl hairline border border-dashed flex items-center justify-center text-[color:var(--muted-foreground)]">
              <ImageIcon className="h-4 w-4 opacity-40" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
