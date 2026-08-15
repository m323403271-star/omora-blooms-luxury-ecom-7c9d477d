import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";

/** FNP-style sticky search bar for the homepage. */
export function HomeSearchBar() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");

  return (
    <div className="sticky top-[var(--header-offset,0px)] z-30 bg-[color:var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--background)]/80">
      <div className="container-luxe py-2.5 md:py-4">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/shop", search: value.trim() ? { q: value.trim() } : {} });
          }}
          className="flex items-center gap-2 rounded-full border hairline bg-[color:var(--card)] px-4 py-2.5 md:py-3 ring-1 ring-[color:var(--gold)]/25 focus-within:ring-[color:var(--gold)]/70 transition"
        >
          <Search className="h-4 w-4 shrink-0 text-[color:var(--gold)]" />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            type="search"
            aria-label="Search bouquets, gift boxes and kits"
            placeholder="Search bouquets, gift boxes, kits…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--muted-foreground)]"
          />
          <button
            type="submit"
            className="btn-gold shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide"
          >
            Search
          </button>
        </form>
      </div>
    </div>
  );
}
