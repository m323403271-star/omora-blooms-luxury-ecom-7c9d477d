import { useState } from "react";
import { Link } from "@tanstack/react-router";

const OPTIONS = ["Partner", "Mother", "Corporate"] as const;
type Option = (typeof OPTIONS)[number];

export function GiftFinder() {
  const [selected, setSelected] = useState<Option | null>(null);

  return (
    <section className="container-luxe py-10 md:py-14">
      <div className="text-center">
        <p className="eyebrow mb-3">Gift Finder</p>
        <h2 className="font-serif text-2xl md:text-4xl tracking-tight">Who are you gifting today?</h2>
        <div className="mt-5 md:mt-7 flex flex-wrap justify-center gap-2.5 md:gap-3">
          {OPTIONS.map((opt) => {
            const active = selected === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setSelected(active ? null : opt)}
                aria-pressed={active}
                className={`px-6 md:px-8 py-2.5 md:py-3 rounded-full text-sm border transition-colors ${
                  active
                    ? "border-[color:var(--gold)] bg-[color:var(--gold)]/12 text-[color:var(--gold)]"
                    : "border-[color:var(--gold)]/40 text-[color:var(--muted-foreground)] hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {selected && (
          <div className="mt-5">
            <Link
              to="/shop"
              className="btn-gold px-7 py-3 rounded-full text-sm inline-flex items-center gap-2"
            >
              See gifts for {selected}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
