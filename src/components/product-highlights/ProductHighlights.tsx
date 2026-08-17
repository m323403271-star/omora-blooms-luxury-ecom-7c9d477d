import { resolveHighlights } from "./resolveHighlights";
import type { HighlightsContent } from "./types";

export interface ProductHighlightsProps {
  content: HighlightsContent;
  /** Id of the currently selected gallery media; drives which set is shown. */
  activeMediaId?: string | undefined;
  className?: string | undefined;
}

/**
 * Smart "Product Highlights & Details" panel.
 * Swaps its copy, feature list and spec table based on the selected media,
 * falling back to the product-level content when nothing matches.
 */
export function ProductHighlights({
  content,
  activeMediaId,
  className = "",
}: ProductHighlightsProps) {
  const highlight = resolveHighlights(content, activeMediaId);

  return (
    <section
      aria-label="Product highlights and details"
      className={`rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 ${className}`}
    >
      <div key={highlight.mediaId} className="animate-in fade-in duration-300">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          {highlight.eyebrow}
        </p>
        <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">
          {highlight.title}
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-neutral-600">
          {highlight.description}
        </p>

        {highlight.features.length > 0 ? (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {highlight.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-neutral-700">
                <svg
                  viewBox="0 0 20 20"
                  className="mt-0.5 h-4 w-4 shrink-0 fill-neutral-900"
                  aria-hidden="true"
                >
                  <path d="M10 1.7a8.3 8.3 0 100 16.6 8.3 8.3 0 000-16.6zm4.1 6.2l-4.9 5a.9.9 0 01-1.3 0L5.9 10.8a.9.9 0 111.3-1.3l1.4 1.5 4.2-4.3a.9.9 0 111.3 1.2z" />
                </svg>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {highlight.specs.length > 0 ? (
          <dl className="mt-5 divide-y divide-neutral-200 border-t border-neutral-200">
            {highlight.specs.map((spec, index) => (
              <div key={`${spec.label}-${index}`} className="flex items-start justify-between gap-6 py-2.5">
                <dt className="text-sm text-neutral-500">{spec.label}</dt>
                <dd className="text-right text-sm font-medium text-neutral-900">{spec.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}
