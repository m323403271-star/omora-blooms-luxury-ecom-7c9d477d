/**
 * Small elegant scarcity + craft-time note shown near primary CTAs.
 * Purely presentational.
 */
export function CraftNote({
  className = "",
  align = "left",
}: {
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <p
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] tracking-[0.14em] uppercase text-[color:var(--gold)]/80 ${
        align === "center" ? "justify-center" : ""
      } ${className}`}
    >
      <span>Limited Stock</span>
      <span aria-hidden="true" className="opacity-50">·</span>
      <span className="normal-case tracking-[0.06em]">Handcrafted: Takes 3 days</span>
    </p>
  );
}
