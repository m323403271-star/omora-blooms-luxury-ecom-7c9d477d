import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_BUCKET, productImagePath } from "@/lib/storage-image";
import { handleImageError } from "@/lib/image-fallback";
import { siteImagesQuery, type SiteImage } from "@/lib/site-images";
import { COLLECTIONS } from "@/lib/collections";
import { productsQuery, type Product } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/admin/manage-images")({
  head: () => ({
    meta: [
      { title: "Manage Site Images — OMORA BLOOMS Admin" },
      { name: "description", content: "Admin tool to manage OMORA BLOOMS homepage banners and per-product sub-category photos." },
      { property: "og:title", content: "Manage Site Images — OMORA BLOOMS Admin" },
      { property: "og:description", content: "Upload and remove homepage banners and per-product sub-category photos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManageImagesPage,
});

const MAX_MB = 8;
const MAX_PER_PRODUCT = 4;

/** Signed URLs come back from the fetcher; persist canonical bucket refs instead. */
function toStoredRef(value: string): string {
  const path = productImagePath(value);
  return path ? `${PRODUCT_BUCKET}/${path}` : value;
}

function ImageCard({ img, onDelete, busy }: { img: SiteImage; onDelete: () => void; busy: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-2xl hairline border bg-[color:var(--card)]">
      <div className="aspect-[4/5] bg-black/40">
        <img src={img.image_url} alt={img.category_name ?? "Site image"} onError={handleImageError} className="h-full w-full object-cover" />
      </div>
      <div className="flex items-center justify-between gap-2 p-2">
        <span className="text-[11px] text-[color:var(--muted-foreground)] truncate">{img.category_name ?? "General"}</span>
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          aria-label="Delete image"
          className="rounded-full border border-red-500/50 text-red-400 p-1.5 hover:bg-red-500/10 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/** One row per product: manual upload / URL mapping for that product only. */
function ProductImageRow({ product, busy, setBusy }: { product: Product; busy: boolean; setBusy: (v: boolean) => void }) {
  const qc = useQueryClient();
  const [urlDraft, setUrlDraft] = useState("");
  const shown = (product.images ?? []).filter(Boolean);
  const remaining = Math.max(0, MAX_PER_PRODUCT - shown.length);

  async function persist(next: string[]) {
    const update: { images: string[]; image_url?: string } = { images: next };
    if (next.length > 0) update.image_url = next[0];
    const { error } = await supabase.from("products").update(update).eq("id", product.id);
    if (error) { toast.error(error.message); return false; }
    await qc.invalidateQueries({ queryKey: ["products"] });
    return true;
  }

  const storedRows = () => shown.map(toStoredRef);

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    try {
      const rows = storedRows();
      const uploaded: string[] = [];
      for (const file of Array.from(list)) {
        if (rows.length + uploaded.length >= MAX_PER_PRODUCT) { toast.error(`Max ${MAX_PER_PRODUCT} photos per product`); break; }
        if (!file.type.startsWith("image/")) { toast.error(`${file.name}: not an image`); continue; }
        if (file.size > MAX_MB * 1024 * 1024) { toast.error(`${file.name}: over ${MAX_MB}MB`); continue; }
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const key = `${product.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from(PRODUCT_BUCKET).upload(key, file, {
          cacheControl: "31536000",
          contentType: file.type,
          upsert: false,
        });
        if (error) { toast.error(error.message); continue; }
        uploaded.push(`${PRODUCT_BUCKET}/${key}`);
      }
      if (uploaded.length === 0) return;
      if (await persist([...rows, ...uploaded].slice(0, MAX_PER_PRODUCT))) {
        toast.success(`${product.name}: ${uploaded.length} photo${uploaded.length > 1 ? "s" : ""} live`);
      }
    } finally { setBusy(false); }
  }

  async function addUrl() {
    const value = urlDraft.trim();
    if (!value) return;
    setBusy(true);
    try {
      if (await persist([...storedRows(), value].slice(0, MAX_PER_PRODUCT))) {
        setUrlDraft("");
        toast.success("Image mapped");
      }
    } finally { setBusy(false); }
  }

  async function removeAt(idx: number) {
    setBusy(true);
    try {
      const rows = storedRows();
      const target = rows[idx];
      if (!(await persist(rows.filter((_, i) => i !== idx)))) return;
      const path = productImagePath(target);
      if (path) await supabase.storage.from(PRODUCT_BUCKET).remove([path]);
      toast.success("Photo removed");
    } finally { setBusy(false); }
  }

  return (
    <div className="rounded-2xl hairline border bg-[color:var(--card)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif text-lg truncate">{product.name}</p>
          <p className="text-[11px] text-[color:var(--muted-foreground)] truncate">
            {product.slug} · {shown.length}/{MAX_PER_PRODUCT} photos
          </p>
        </div>
        <label className={`btn-outline-gold px-4 py-2 rounded-full text-xs inline-flex items-center gap-2 cursor-pointer ${busy || remaining === 0 ? "opacity-50 pointer-events-none" : ""}`}>
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          {remaining === 0 ? "Gallery full" : `Upload (${remaining} left)`}
          <input type="file" accept="image/*" multiple hidden onChange={(e) => { onFiles(e.target.files); e.currentTarget.value = ""; }} />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          placeholder="…or paste an image URL for this product"
          className="flex-1 min-w-[200px] rounded-full bg-transparent hairline border px-4 py-2 text-sm"
        />
        <button
          type="button"
          disabled={busy || !urlDraft.trim() || remaining === 0}
          onClick={addUrl}
          className="btn-gold px-4 py-2 rounded-full text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <Plus className="h-3 w-3" /> Map URL
        </button>
      </div>

      {shown.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {shown.map((url, i) => (
            <div key={`${url}-${i}`} className="relative group aspect-square overflow-hidden rounded-xl hairline border">
              <img src={url} alt={`${product.name} ${i + 1}`} onError={handleImageError} className="h-full w-full object-cover" />
              <button
                type="button"
                disabled={busy}
                onClick={() => removeAt(i)}
                aria-label="Remove photo"
                className="absolute top-1 right-1 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition group-hover:opacity-100 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 rounded-full bg-black/70 px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-[color:var(--gold)]">Cover</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ManageImagesPage() {
  const qc = useQueryClient();
  const { data: images, isLoading } = useQuery(siteImagesQuery);
  const { data: products, isLoading: loadingProducts } = useQuery(productsQuery);
  const [busy, setBusy] = useState(false);
  const [homeCat, setHomeCat] = useState<string>(COLLECTIONS[0]?.slug ?? "");
  const [homeUrl, setHomeUrl] = useState("");
  const [subCat, setSubCat] = useState<string>(COLLECTIONS[0]?.slug ?? "");
  const [subUrl, setSubUrl] = useState("");

  // Homepage banners live only in site_images with page_type = 'homepage'.
  const homepage = useMemo(() => (images ?? []).filter((i) => i.page_type === "homepage"), [images]);
  // Sub-category banners are scoped strictly to the selected collection slug.
  const subBanners = useMemo(
    () => (images ?? []).filter((i) => i.page_type === "subcategory" && i.category_name === subCat),
    [images, subCat],
  );
  // Products are filtered by their own category — never the homepage list.
  const catProducts = useMemo(
    () => (products ?? []).filter((p) => p.category === subCat),
    [products, subCat],
  );

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["site_images"] });
  }

  async function insert(page_type: "homepage" | "subcategory", category_name: string, image_url: string) {
    const { error } = await supabase.from("site_images").insert({
      page_type,
      category_name,
      image_url,
      display_order: (images ?? []).filter((i) => i.page_type === page_type && i.category_name === category_name).length,
    });
    if (error) { toast.error(error.message); return false; }
    await refresh();
    toast.success("Image added");
    return true;
  }

  async function uploadFiles(list: FileList | null, page_type: "homepage" | "subcategory", category_name: string) {
    if (!list?.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(list)) {
        if (!file.type.startsWith("image/")) { toast.error(`${file.name}: not an image`); continue; }
        if (file.size > MAX_MB * 1024 * 1024) { toast.error(`${file.name}: over ${MAX_MB}MB`); continue; }
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const key = `site/${page_type}/${category_name}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from(PRODUCT_BUCKET).upload(key, file, {
          cacheControl: "31536000",
          contentType: file.type,
          upsert: false,
        });
        if (error) { toast.error(error.message); continue; }
        await insert(page_type, category_name, `${PRODUCT_BUCKET}/${key}`);
      }
    } finally { setBusy(false); }
  }

  async function remove(img: SiteImage) {
    setBusy(true);
    try {
      const { error } = await supabase.from("site_images").delete().eq("id", img.id);
      if (error) { toast.error(error.message); return; }
      const path = productImagePath(img.image_url);
      if (path) await supabase.storage.from(PRODUCT_BUCKET).remove([path]);
      await refresh();
      toast.success("Image removed");
    } finally { setBusy(false); }
  }

  return (
    <div className="container-luxe py-12 md:py-16">
      <p className="eyebrow mb-3 text-[color:var(--gold)]">Admin</p>
      <h1 className="font-serif text-4xl md:text-5xl">Manage Site Images</h1>
      <p className="mt-3 text-sm text-[color:var(--muted-foreground)]">
        Homepage banners and per-product sub-category photos. Every image is uploaded and mapped manually by you —
        nothing is generated or auto-filled. Changes go live immediately.
      </p>

      {isLoading && (
        <p className="mt-10 inline-flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
      )}

      {/* Homepage */}
      <section className="mt-12">
        <h2 className="font-serif text-2xl md:text-3xl">Homepage images</h2>
        <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
          Banner artwork for homepage cards only. These never appear on sub-category listings.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            aria-label="Homepage card"
            value={homeCat}
            onChange={(e) => setHomeCat(e.target.value)}
            className="rounded-full bg-transparent hairline border px-4 py-2 text-sm"
          >
            {COLLECTIONS.map((c) => (
              <option key={c.slug} value={c.slug} className="bg-[color:var(--noir)]">{c.name}</option>
            ))}
          </select>
          <label className={`btn-outline-gold px-4 py-2 rounded-full text-xs inline-flex items-center gap-2 cursor-pointer ${busy ? "opacity-50 pointer-events-none" : ""}`}>
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Add Homepage Image
            <input type="file" accept="image/*" multiple hidden onChange={(e) => { uploadFiles(e.target.files, "homepage", homeCat); e.currentTarget.value = ""; }} />
          </label>
          <input
            value={homeUrl}
            onChange={(e) => setHomeUrl(e.target.value)}
            placeholder="…or paste an image URL"
            className="flex-1 min-w-[200px] rounded-full bg-transparent hairline border px-4 py-2 text-sm"
          />
          <button
            type="button"
            disabled={busy || !homeUrl.trim()}
            onClick={async () => { if (await insert("homepage", homeCat, homeUrl.trim())) setHomeUrl(""); }}
            className="btn-gold px-4 py-2 rounded-full text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Plus className="h-3 w-3" /> Add URL
          </button>
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {homepage.map((img) => (
            <ImageCard key={img.id} img={img} busy={busy} onDelete={() => remove(img)} />
          ))}
          {homepage.length === 0 && !isLoading && (
            <p className="text-sm text-[color:var(--muted-foreground)]">No homepage images yet.</p>
          )}
        </div>
      </section>

      {/* Sub-category */}
      <section className="mt-16">
        <h2 className="font-serif text-2xl md:text-3xl">Sub-category photos</h2>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            aria-label="Sub-category"
            value={subCat}
            onChange={(e) => setSubCat(e.target.value)}
            className="rounded-full bg-transparent hairline border px-4 py-2 text-sm"
          >
            {COLLECTIONS.map((c) => (
              <option key={c.slug} value={c.slug} className="bg-[color:var(--noir)]">{c.name}</option>
            ))}
          </select>
          <label className={`btn-outline-gold px-4 py-2 rounded-full text-xs inline-flex items-center gap-2 cursor-pointer ${busy ? "opacity-50 pointer-events-none" : ""}`}>
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Add Category Banner
            <input type="file" accept="image/*" multiple hidden onChange={(e) => { uploadFiles(e.target.files, "subcategory", subCat); e.currentTarget.value = ""; }} />
          </label>
          <input
            value={subUrl}
            onChange={(e) => setSubUrl(e.target.value)}
            placeholder="…or paste an image URL"
            className="flex-1 min-w-[200px] rounded-full bg-transparent hairline border px-4 py-2 text-sm"
          />
          <button
            type="button"
            disabled={busy || !subUrl.trim()}
            onClick={async () => { if (await insert("subcategory", subCat, subUrl.trim())) setSubUrl(""); }}
            className="btn-gold px-4 py-2 rounded-full text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Plus className="h-3 w-3" /> Add URL
          </button>
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {subBanners.map((img) => (
            <ImageCard key={img.id} img={img} busy={busy} onDelete={() => remove(img)} />
          ))}
          {subBanners.length === 0 && !isLoading && (
            <p className="text-sm text-[color:var(--muted-foreground)]">No banner photos for this sub-category yet.</p>
          )}
        </div>

        {/* Per-product mapping, filtered strictly by the selected sub-category */}
        <div className="mt-10">
          <h3 className="font-serif text-xl md:text-2xl">
            Products in {COLLECTIONS.find((c) => c.slug === subCat)?.name ?? subCat}{" "}
            <span className="text-sm text-[color:var(--muted-foreground)]">({catProducts.length})</span>
          </h3>
          <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
            Upload up to {MAX_PER_PRODUCT} photos per product. The first photo becomes that product's cover on the listing page.
          </p>
          {loadingProducts && (
            <p className="mt-4 inline-flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading products…</p>
          )}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {catProducts.map((p) => (
              <ProductImageRow key={p.id} product={p} busy={busy} setBusy={setBusy} />
            ))}
          </div>
          {!loadingProducts && catProducts.length === 0 && (
            <p className="mt-4 text-sm text-[color:var(--muted-foreground)]">No products in this sub-category yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
