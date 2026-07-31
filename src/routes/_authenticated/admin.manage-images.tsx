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

export const Route = createFileRoute("/_authenticated/admin/manage-images")({
  head: () => ({
    meta: [
      { title: "Manage Site Images — OMORA BLOOMS Admin" },
      { name: "description", content: "Admin tool to manage OMORA BLOOMS homepage banners and sub-category photos." },
      { property: "og:title", content: "Manage Site Images — OMORA BLOOMS Admin" },
      { property: "og:description", content: "Upload and remove homepage banners and sub-category photos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManageImagesPage,
});

const MAX_MB = 8;

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

function ManageImagesPage() {
  const qc = useQueryClient();
  const { data: images, isLoading } = useQuery(siteImagesQuery);
  const [busy, setBusy] = useState(false);
  const [homeCat, setHomeCat] = useState<string>(COLLECTIONS[0]?.slug ?? "");
  const [homeUrl, setHomeUrl] = useState("");
  const [subCat, setSubCat] = useState<string>(COLLECTIONS[0]?.slug ?? "");
  const [subUrl, setSubUrl] = useState("");

  const homepage = useMemo(() => (images ?? []).filter((i) => i.page_type === "homepage"), [images]);
  const subs = useMemo(
    () => (images ?? []).filter((i) => i.page_type === "subcategory" && i.category_name === subCat),
    [images, subCat],
  );

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["site_images"] });
  }

  async function insert(page_type: "homepage" | "subcategory", category_name: string, image_url: string) {
    const { error } = await supabase.from("site_images").insert({
      page_type,
      category_name,
      image_url,
      display_order: (images ?? []).filter((i) => i.page_type === page_type).length,
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
        Homepage banners and sub-category photos. Changes go live immediately.
      </p>

      {isLoading && (
        <p className="mt-10 inline-flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
      )}

      {/* Homepage */}
      <section className="mt-12">
        <h2 className="font-serif text-2xl md:text-3xl">Homepage images</h2>
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
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Add Photo
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
          {subs.map((img) => (
            <ImageCard key={img.id} img={img} busy={busy} onDelete={() => remove(img)} />
          ))}
          {subs.length === 0 && !isLoading && (
            <p className="text-sm text-[color:var(--muted-foreground)]">No photos for this sub-category yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
