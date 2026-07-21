import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/omora-logo.asset.json";

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
        src={logoAsset.url}
        alt="OMORA BLOOMS"
        width={200}
        height={200}
        className={`${sizes[size]} rounded-full object-cover shrink-0 ring-1 ring-[color:var(--gold)]/30`}
      />
      <span className="sr-only">OMORA BLOOMS</span>
    </Link>
  );
}
