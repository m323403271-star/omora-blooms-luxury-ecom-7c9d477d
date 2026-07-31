import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, Trash2, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_BUCKET, productImagePath, signProductImages } from "@/lib/storage-image";
import { handleImageError } from "@/lib/image-fallback";

const MAX_PER_PRODUCT = 4;
const MAX_MB = 5;

/**
 * Admin-only inline photo manager rendered on the product detail page.
 * Invisible to customers; uploads land in the private product-images bucket
 * and are rendered through signed URLs, same as the storefront.
 */
export function PdpAdminUpload({
  productId,
  productName,
  images,
}: {
  productId: string;
  productName: string;
  images: string[];
}) {
  const qc = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<string[]>(images);
  const [signed, setSigned] = useState<Record<string, string>>({});

  useEffect(() => setRows(images), [images.join("|")]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      if (active) setIsAdmin(Boolean(data));
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isAdmin || rows.length === 0) return;
    let active = true;
    signProductImages(rows).then((m) => { if (active) setSigned(m); });
    return () => { active = false; };
  }, [isAdmin, rows.join("|")]);

  if (!isAdmin) return null;

  const remaining = Math.max(0, MAX_PER_PRODUCT - rows.length);

  async function persist(next: string[]) {
    const update: { images: string[]; image_url?: string } = { images: next };
    if (next.length > 0) update.image_url = next[0];
    const { error } = await supabase.from("products").update(update).eq("id", productId);
    if (error) { toast.error(error.message); return false; }
    setRows(next);
    await qc.invalidateQueries({ queryKey: ["products"] });
    return true;
  }

  async function onFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(list)) {
        if (rows.length + uploaded.length >= MAX_PER_PRODUCT) { toast.error(`Max ${MAX_PER_PRODUCT} photos`); break; }
        if (!file.type.startsWith("image/")) { toast.error(`${file.name}: not an image`); continue; }
        if (file.size > MAX_MB * 1024 * 1024) { toast.error(`${file.name}: over ${MAX_MB}MB`); continue; }
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const key = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from(PRODUCT_BUCKET).upload(key, file, {
          cacheControl: "31536000",
          contentType: file.type,
          upsert: false,
        });
        if (error) { toast.error(error.message); continue; }
        uploaded.push(`${PRODUCT_BUCKET}/${key}`);
      }
      if (uploaded.length === 0) return;
      const ok = await persist([...rows, ...uploaded].slice(0, MAX_PER_PRODUCT));
      if (ok) toast.success(`${uploaded.length} photo${uploaded.length > 1 ? "s" : ""} live`);
    } finally { setBusy(false); }
  }

  async function removeAt(idx: number) {
    setBusy(true);
    try {
      const url = rows[idx];
      const ok = await persist(rows.filter((_, i) => i !== idx));
      if (!ok) return;
      const path = productImagePath(url);
      if (path) await supabase.storage.from(PRODUCT_BUCKET).remove([path]);
      toast.success("Photo removed");
    } finally { setBusy(false); }
  }

  return (
    <div className="mt-8 rounded-2xl border hairline p-4 md:p-5 bg-[color:var(--card)]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-[color:var(--gold)]">
          <ShieldCheck className="h-3.5 w-3.5" /> Admin · Product photos ({rows.length}/{MAX_PER_PRODUCT})
        </p>
        <label className={`btn-outline-gold px-4 py-2 rounded-full text-xs inline-flex items-center gap-2 cursor-pointer ${remaining === 0 || busy ? "opacity-50 pointer-events-none" : ""}`}>
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          {remaining === 0 ? "Gallery full" : `Upload (${remaining} left)`}
          <input type="file" accept="image/*" multiple hidden onChange={(e) => { onFiles(e.target.files); e.currentTarget.value = ""; }} />
        </label>
      </div>
      {rows.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {rows.map((url, i) => (
            <div key={url} className="relative group aspect-square rounded-xl overflow-hidden hairline border">
              <img src={signed[url] ?? url} alt={`${productName} ${i + 1}`} onError={handleImageError} className="h-full w-full object-cover" />
              <button
                onClick={() => removeAt(i)}
                disabled={busy}
                aria-label="Remove photo"
                className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-[11px] text-[color:var(--muted-foreground)]">
        The first photo becomes the storefront cover. Changes go live immediately.
      </p>
    </div>
  );
}
