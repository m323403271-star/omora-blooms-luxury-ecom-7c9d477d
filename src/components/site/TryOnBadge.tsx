import { Camera } from "lucide-react";

/**
 * Small gold "Try-On" chip pinned to the top corner of a product image.
 * On listing cards it is decorative (pointer-events-none) so the card link
 * handles the click; pass `onClick` on the product page to launch Try-On.
 */
export function TryOnBadge({
  label = "Try-On",
  onClick,
  className = "",
  compact = false,
}: {
  label?: string;
  onClick?: (() => void) | undefined;
  className?: string;
  /** Icon-only chip for small media thumbnails. */
  compact?: boolean;
}) {
  const base = compact
    ? "absolute right-1 top-1 z-10 inline-flex items-center justify-center rounded-full bg-black/75 p-1 text-[color:var(--gold)] ring-1 ring-[color:var(--gold)]/50 backdrop-blur-sm"
    : "absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[color:var(--gold)] ring-1 ring-[color:var(--gold)]/50 shadow-[0_6px_18px_-8px_rgba(200,162,74,0.9)] backdrop-blur-sm md:text-[10px]";

  if (!onClick) {
    return (
      <span aria-hidden className={`${base} pointer-events-none ${className}`}>
        <Camera className="h-3 w-3" /> {compact ? null : label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      aria-label={`Launch virtual ${label}`}
      className={`${base} transition hover:bg-black/85 ${className}`}
    >
      <Camera className="h-3 w-3" /> {label}
    </button>
  );
}
