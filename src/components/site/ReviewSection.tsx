import { useEffect, useMemo, useState } from "react";
import { Star, BadgeCheck, Camera, Loader2, Upload, X, Play, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type MediaItem = { url: string; type: "image" | "video" };
type Review = {
  id: string;
  product_id: string;
  user_id: string | null;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  media: MediaItem[];
  verified_buyer: boolean;
  created_at: string;
};

type FilterTab = "all" | "photos" | "5";

const BUCKET = "review-media";
const MAX_MEDIA = 4;
const MAX_MB = 15;

function Stars({ value, size = "sm", onSelect }: { value: number; size?: "sm" | "md" | "lg"; onSelect?: (v: number) => void }) {
  const cls = size === "lg" ? "h-6 w-6" : size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="inline-flex items-center gap-0.5" role={onSelect ? "radiogroup" : undefined} aria-label={`Rating ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const StarEl = (
          <Star
            className={`${cls} ${filled ? "fill-[color:var(--gold)] text-[color:var(--gold)]" : "text-[color:var(--muted-foreground)]/50"}`}
          />
        );
        return onSelect ? (
          <button
            key={n}
            type="button"
            onClick={() => onSelect(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className="p-0.5 hover:scale-110 transition"
          >
            {StarEl}
          </button>
        ) : (
          <span key={n}>{StarEl}</span>
        );
      })}
    </div>
  );
}

export function ReviewSection({ productId, productName }: { productId: string; productName: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("all");
  const [lightbox, setLightbox] = useState<MediaItem | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setUserId(session?.user?.id ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("approved", true)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setReviews(((data ?? []) as unknown) as Review[]);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [productId]);

  const stats = useMemo(() => {
    const n = reviews.length;
    const avg = n ? reviews.reduce((s, r) => s + r.rating, 0) / n : 0;
    const buckets = [5, 4, 3, 2, 1].map((s) => ({ s, c: reviews.filter((r) => r.rating === s).length }));
    return { n, avg, buckets };
  }, [reviews]);

  const filtered = useMemo(() => {
    if (tab === "photos") return reviews.filter((r) => r.media?.length > 0);
    if (tab === "5") return reviews.filter((r) => r.rating === 5);
    return reviews;
  }, [reviews, tab]);

  return (
    <section className="container-luxe pb-20 border-t hairline pt-16" aria-labelledby="reviews-heading">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <p className="eyebrow mb-2">Customer Reviews</p>
          <h2 id="reviews-heading" className="font-serif text-3xl md:text-4xl">Loved by our community</h2>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="btn-outline-gold px-5 py-2.5 rounded-full text-xs tracking-widest uppercase"
        >
          {showForm ? "Close" : "Write a review"}
        </button>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-8 mb-10">
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="font-serif text-5xl text-[color:var(--gold)]">{stats.avg.toFixed(1)}</p>
          <div className="mt-2 flex justify-center"><Stars value={stats.avg} size="md" /></div>
          <p className="text-xs text-[color:var(--muted-foreground)] mt-2">{stats.n} review{stats.n === 1 ? "" : "s"}</p>
          <div className="mt-4 space-y-1.5">
            {stats.buckets.map(({ s, c }) => {
              const pct = stats.n ? (c / stats.n) * 100 : 0;
              return (
                <div key={s} className="flex items-center gap-2 text-[11px]">
                  <span className="w-3 text-[color:var(--muted-foreground)]">{s}</span>
                  <Star className="h-3 w-3 fill-[color:var(--gold)] text-[color:var(--gold)]" />
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-[color:var(--gold)]" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-right text-[color:var(--muted-foreground)]">{c}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div role="tablist" className="flex flex-wrap gap-2 mb-5">
            {([
              { k: "all", l: `All (${reviews.length})` },
              { k: "photos", l: `With Photos (${reviews.filter((r) => r.media?.length > 0).length})` },
              { k: "5", l: `5 Stars (${reviews.filter((r) => r.rating === 5).length})` },
            ] as { k: FilterTab; l: string }[]).map((t) => (
              <button
                key={t.k}
                role="tab"
                aria-selected={tab === t.k}
                onClick={() => setTab(t.k)}
                className={`px-4 py-2 rounded-full text-[11px] tracking-widest uppercase border transition ${
                  tab === t.k
                    ? "bg-[color:var(--gold)] text-[color:var(--noir)] border-[color:var(--gold)]"
                    : "hairline text-[color:var(--muted-foreground)] hover:text-[color:var(--gold)] hover:border-[color:var(--gold)]/50"
                }`}
              >
                {t.l}
              </button>
            ))}
          </div>

          {showForm && (
            <ReviewForm
              productId={productId}
              productName={productName}
              userId={userId}
              onSubmitted={() => { setShowForm(false); load(); }}
            />
          )}

          {loading ? (
            <div className="py-12 text-center text-[color:var(--muted-foreground)] inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading reviews…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-[color:var(--muted-foreground)] text-sm">
              No reviews yet in this view. Be the first to share your experience.
            </div>
          ) : (
            <ul className="space-y-4">
              {filtered.map((r) => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  onOpenMedia={setLightbox}
                  canManage={!!userId && r.user_id === userId}
                  onDeleted={load}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <button className="absolute top-4 right-4 text-white/80 hover:text-white" aria-label="Close">
            <X className="h-6 w-6" />
          </button>
          {lightbox.type === "video" ? (
            <video src={lightbox.url} controls autoPlay className="max-h-[85vh] max-w-full rounded-2xl" />
          ) : (
            <img src={lightbox.url} alt="Customer review media" className="max-h-[85vh] max-w-full rounded-2xl object-contain" />
          )}
        </div>
      )}
    </section>
  );
}

function ReviewCard({
  review,
  onOpenMedia,
  canManage = false,
  onDeleted,
}: {
  review: Review;
  onOpenMedia: (m: MediaItem) => void;
  canManage?: boolean;
  onDeleted?: () => void;
}) {
  const [removing, setRemoving] = useState(false);

  async function remove() {
    setRemoving(true);
    const { error } = await supabase.from("reviews").delete().eq("id", review.id);
    setRemoving(false);
    if (error) return toast.error(error.message);
    toast.success("Review removed");
    onDeleted?.();
  }

  return (
    <li className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium">{review.author_name}</p>
            {review.verified_buyer && (
              <span className="inline-flex items-center gap-1 text-[10px] tracking-widest uppercase text-emerald-300 bg-emerald-500/10 border border-emerald-400/40 rounded-full px-2 py-0.5">
                <BadgeCheck className="h-3 w-3" /> Verified Buyer
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Stars value={review.rating} />
            <span className="text-[11px] text-[color:var(--muted-foreground)]">
              {new Date(review.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={remove}
            disabled={removing}
            className="text-[10px] tracking-widest uppercase text-[color:var(--muted-foreground)] hover:text-red-300 inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {removing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />} Delete
          </button>
        )}
      </div>
      {review.title && <p className="mt-3 font-serif text-lg">{review.title}</p>}
      <p className="mt-2 text-sm text-[color:var(--muted-foreground)] leading-relaxed whitespace-pre-wrap">{review.body}</p>
      {review.media?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {review.media.map((m, i) => (
            <button
              key={i}
              onClick={() => onOpenMedia(m)}
              className="relative h-20 w-20 md:h-24 md:w-24 rounded-xl overflow-hidden hairline border hover:border-[color:var(--gold)] transition"
              aria-label={`Open ${m.type}`}
            >
              {m.type === "video" ? (
                <>
                  <video src={m.url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Play className="h-5 w-5 text-white fill-white" />
                  </span>
                </>
              ) : (
                <img src={m.url} alt="Customer photo" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}

function ReviewForm({
  productId,
  productName,
  userId,
  onSubmitted,
}: {
  productId: string;
  productName: string;
  userId: string | null;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!userId) {
    return (
      <div className="glass-card rounded-2xl p-5 mb-5 text-sm text-[color:var(--muted-foreground)]">
        Please <a href="/auth" className="text-[color:var(--gold)] underline">sign in</a> to write a review for {productName}.
      </div>
    );
  }

  function pickFiles(fl: FileList | null) {
    if (!fl) return;
    const list = Array.from(fl)
      .filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"))
      .filter((f) => {
        if (f.size > MAX_MB * 1024 * 1024) {
          toast.error(`${f.name}: over ${MAX_MB}MB`);
          return false;
        }
        return true;
      });
    setFiles((prev) => [...prev, ...list].slice(0, MAX_MEDIA));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Please add your name");
    if (body.trim().length < 10) return toast.error("Review must be at least 10 characters");
    setSubmitting(true);
    try {
      const media: MediaItem[] = [];
      for (const f of files) {
        const ext = f.name.split(".").pop()?.toLowerCase() || "bin";
        const key = `${userId}/${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(key, f, { contentType: f.type, upsert: false });
        if (error) { toast.error(error.message); continue; }
        const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(key, 60 * 60 * 24 * 365 * 5);
        if (signed?.signedUrl) {
          media.push({ url: signed.signedUrl, type: f.type.startsWith("video/") ? "video" : "image" });
        }
      }
      const { error: iErr } = await supabase.from("reviews").insert({
        product_id: productId,
        user_id: userId,
        author_name: name.trim().slice(0, 60),
        rating,
        title: title.trim().slice(0, 80) || null,
        body: body.trim().slice(0, 1200),
        media,
      });
      if (iErr) { toast.error(iErr.message); return; }
      toast.success("Thank you for your review!");
      onSubmitted();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass-card rounded-2xl p-5 mb-5 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs tracking-widest uppercase text-[color:var(--muted-foreground)]">Your rating</span>
        <Stars value={rating} size="lg" onSelect={setRating} />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="Your name"
          className="bg-transparent hairline border rounded-full px-4 py-2.5 text-sm outline-none focus:border-[color:var(--gold)]"
          required
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          placeholder="Headline (optional)"
          className="bg-transparent hairline border rounded-full px-4 py-2.5 text-sm outline-none focus:border-[color:var(--gold)]"
        />
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={1200}
        rows={4}
        placeholder={`Share your experience with ${productName}…`}
        className="w-full bg-transparent hairline border rounded-2xl px-4 py-3 text-sm outline-none focus:border-[color:var(--gold)]"
        required
      />
      <div className="flex items-center gap-3 flex-wrap">
        <label className={`btn-outline-gold px-4 py-2 rounded-full text-xs inline-flex items-center gap-2 cursor-pointer ${files.length >= MAX_MEDIA ? "opacity-50 pointer-events-none" : ""}`}>
          <Camera className="h-3 w-3" /> Add photos / videos ({files.length}/{MAX_MEDIA})
          <input type="file" accept="image/*,video/*" multiple hidden onChange={(e) => { pickFiles(e.target.files); e.currentTarget.value = ""; }} />
        </label>
        {files.map((f, i) => (
          <span key={i} className="text-[11px] hairline border rounded-full px-2.5 py-1 inline-flex items-center gap-1.5">
            {f.name.slice(0, 24)}
            <button type="button" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} aria-label="Remove">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="btn-gold px-6 py-3 rounded-full text-xs tracking-widest uppercase inline-flex items-center gap-2 disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        Submit review
      </button>
    </form>
  );
}
