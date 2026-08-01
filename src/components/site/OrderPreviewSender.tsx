import { useState } from "react";
import { Camera, Loader2, MessageCircle, Mail, Check, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { whatsappLink } from "@/lib/whatsapp";

/**
 * Reusable hook UI for admins & delivery to attach a live bouquet preview photo
 * to an order and dispatch it via WhatsApp or Email before shipping.
 *
 * - Uploads to the private `order-previews` bucket (admin-only) under `{orderId}/`.
 * - Persists preview_photo_url / preview_sent_at / preview_channel on payments row.
 * - Generates ready-to-send WhatsApp link and mailto payload with the image URL.
 */

type Props = {
  orderId: string;
  orderCode: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  amount?: number;
  existingUrl?: string | null;
  compact?: boolean;
  onSent?: (url: string, channel: "whatsapp" | "email") => void;
};

const BUCKET = "order-previews";

export function OrderPreviewSender({
  orderId,
  orderCode,
  customerName,
  customerPhone,
  customerEmail,
  amount,
  existingUrl,
  compact,
  onSent,
}: Props) {
  const [url, setUrl] = useState<string | null>(existingUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image");
    if (file.size > 8 * 1024 * 1024) return toast.error("Max 8 MB");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const key = `${orderId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(key, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });
      if (error) { toast.error(error.message); return; }
      // Short-lived signed URL: the private bucket is admin-only, links expire in 7 days.
      const { data: signed, error: sErr } = await supabase.storage.from(BUCKET).createSignedUrl(key, 60 * 60 * 24 * 7);
      if (sErr || !signed?.signedUrl) { toast.error(sErr?.message ?? "Could not sign URL"); return; }
      const publicUrl = signed.signedUrl;
      const { error: uErr } = await supabase
        .from("payments")
        .update({ preview_photo_url: publicUrl })
        .eq("id", orderId);
      if (uErr) { toast.error(uErr.message); return; }
      setUrl(publicUrl);
      toast.success("Preview photo uploaded");
    } finally {
      setUploading(false);
    }
  }

  function markSent(channel: "whatsapp" | "email") {
    if (!url) return;
    supabase
      .from("payments")
      .update({ preview_sent_at: new Date().toISOString(), preview_channel: channel })
      .eq("id", orderId)
      .then(({ error }) => {
        if (error) toast.error(error.message);
        else {
          toast.success(`Marked as sent via ${channel}`);
          onSent?.(url, channel);
        }
      });
  }

  const message =
    `Hello ${customerName ?? "there"}! Your OMORA BLOOMS order ${orderCode} is ready ✨\n\n` +
    `Here is a live preview of your handcrafted bouquet before dispatch:\n${url ?? "[photo]"}\n\n` +
    (amount ? `Order total: ₹${amount.toLocaleString("en-IN")}\n` : "") +
    `Reply here to confirm and we'll dispatch right away.`;

  const waHref = customerPhone
    ? `https://wa.me/${customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`
    : whatsappLink(message);
  const mailHref = `mailto:${customerEmail ?? ""}?subject=${encodeURIComponent(
    `Your OMORA BLOOMS bouquet preview — ${orderCode}`,
  )}&body=${encodeURIComponent(message)}`;

  return (
    <div className={`rounded-2xl border hairline ${compact ? "p-3" : "p-4"} bg-[color:var(--noir)]/40`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[color:var(--muted-foreground)] inline-flex items-center gap-1.5">
          <Camera className="h-3.5 w-3.5 text-[color:var(--gold)]" /> Live bouquet preview
        </p>
        <label className={`btn-outline-gold px-3 py-1.5 rounded-full text-[10px] tracking-widest uppercase inline-flex items-center gap-1.5 cursor-pointer ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
          {url ? "Replace photo" : "Upload photo"}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.currentTarget.value = ""; }}
          />
        </label>
      </div>

      {url && (
        <div className="mt-3 flex items-start gap-3 flex-wrap">
          <img src={url} alt={`Bouquet preview for ${orderCode}`} loading="lazy" className="h-24 w-24 rounded-xl object-cover hairline border" />
          <div className="flex-1 min-w-[200px] space-y-2">
            <div className="flex flex-wrap gap-2">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => markSent("whatsapp")}
                className="btn-gold px-3 py-1.5 rounded-full text-[10px] tracking-widest uppercase inline-flex items-center gap-1.5"
              >
                <MessageCircle className="h-3 w-3" /> Send WhatsApp
              </a>
              <a
                href={mailHref}
                onClick={() => markSent("email")}
                className={`btn-outline-gold px-3 py-1.5 rounded-full text-[10px] tracking-widest uppercase inline-flex items-center gap-1.5 ${customerEmail ? "" : "opacity-50 pointer-events-none"}`}
              >
                <Mail className="h-3 w-3" /> Send Email
              </a>
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                className="btn-outline-gold px-3 py-1.5 rounded-full text-[10px] tracking-widest uppercase inline-flex items-center gap-1.5"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copy URL
              </button>
            </div>
            <p className="text-[10px] text-[color:var(--muted-foreground)] break-all">{url}</p>
          </div>
        </div>
      )}
    </div>
  );
}
