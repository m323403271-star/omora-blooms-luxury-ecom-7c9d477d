import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { COLLECTIONS } from "@/lib/collections";
import { siteImagesQuery, homepageImageFor } from "@/lib/site-images";
import { handleImageError } from "@/lib/image-fallback";

/**
 * Horizontal category icon row (FNP-style) — circular gold-ringed thumbnails
 * that scroll sideways on mobile and fit inline on desktop.
 */
export function HomeCategoryStrip() {
  const { data: siteImages } = useQuery(siteImagesQuery);

    return (
    <section className="container-luxe pt-2 pb-4 md:pt-4 md:pb-8" aria-label="Shop by category">
      <div
        className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0 md:gap-6"
        style={{ scrollbarWidth: "none" }}
      >
        {COLLECTIONS.map((c) => {
          const src = homepageImageFor(siteImages, c.slug) ?? c.image;
          return (
            <Link
              key={c.slug}
              to="/collections/$slug"
              params={{ slug: c.slug }}
              className="group flex w-[76px] shrink-0 flex-col items-center gap-2 md:w-[104px]"
            >
              <span className="relative block h-[72px] w-[72px] overflow-hidden rounded-full ring-2 ring-[color:var(--gold)] shadow-[0_10px_28px_-14px_rgba(200,162,74,0.8)] transition group-hover:shadow-[0_14px_32px_-12px_rgba(200,162,74,0.95)] group-hover:ring-[color:var(--gold)] md:h-[92px] md:w-[92px]">
                <img
                  src={src}
                  alt={c.name}
                  loading="lazy"
                  decoding="async"
                  onError={handleImageError}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </span>
              <span className="line-clamp-2 text-center text-[11px] leading-tight text-[color:var(--muted-foreground)] group-hover:text-[color:var(--gold)] md:text-xs">
                {c.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

