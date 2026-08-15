import { Quote } from "lucide-react";
import { GIFTING_STORIES } from "@/lib/home-showcase";
import { handleImageError } from "@/lib/image-fallback";

/** Joyful Gifting Stories — horizontally scrollable customer moments. */
export function HomeGiftingStories() {
  return (
    <section className="container-luxe py-6 md:py-12" aria-label="Joyful Gifting Stories">
      <div className="mb-3 md:mb-6">
        <p className="eyebrow mb-1 text-[color:var(--gold)]">Real moments</p>
        <h2 className="font-serif text-xl leading-tight tracking-tight md:text-3xl">
          Joyful Gifting Stories
        </h2>
      </div>

      <div
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0 md:gap-5"
        style={{ scrollbarWidth: "none" }}
      >
        {GIFTING_STORIES.map((s) => (
          <article
            key={s.id}
            className="w-[78%] shrink-0 snap-start overflow-hidden rounded-2xl border hairline bg-[color:var(--card)] sm:w-[46%] lg:w-[24%]"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={s.image}
                alt={`Gifting story from ${s.name}`}
                loading="lazy"
                decoding="async"
                onError={handleImageError}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col gap-2 p-3.5">
              <Quote className="h-4 w-4 text-[color:var(--gold)]" />
              <p className="text-[13px] leading-relaxed text-[color:var(--muted-foreground)]">
                {s.quote}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[color:var(--gold)]">
                {s.name} · {s.place}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
