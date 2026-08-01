import { Link } from "@tanstack/react-router";
import { LOGO_SRC, LOGO_FALLBACK_SRC } from "@/lib/logo";

export function Logo({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const sizes = {
    sm: "h-10 w-10",
    md: "h-14 w-14",
    lg: "h-24 w-24",
    xl: "h-40 w-40",
  };
  return (
    <Link to="/" className={`inline-flex items-center gap-3 ${className}`} aria-label="OMORA BLOOMS home">
      <img
        src={LOGO_SRC}
        alt="OMORA BLOOMS"
        width={200}
        height={200}
        loading="eager"
        decoding="async"
        onError={(e) => {
          const img = e.currentTarget;
          if (img.src.endsWith(LOGO_FALLBACK_SRC)) return;
          img.src = LOGO_FALLBACK_SRC;
        }}
        className={`${sizes[size]} rounded-full object-cover shrink-0 ring-1 ring-[color:var(--gold)]/30`}
      />
      <span className="sr-only">OMORA BLOOMS</span>
    </Link>
  );
}
