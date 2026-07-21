import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag, Search, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { useCart } from "@/lib/cart";
import { COLLECTIONS } from "@/lib/collections";
import { WHATSAPP_DISPLAY, whatsappLink } from "@/lib/whatsapp";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/collections", label: "Collections" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const { count, open } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Announcement */}
      <div className="bg-gold-gradient text-[color:var(--noir)] text-[11px] tracking-[0.24em] uppercase font-medium py-2 text-center">
        Complimentary luxury packaging · Same-day delivery available · WhatsApp {WHATSAPP_DISPLAY}
      </div>

      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[color:var(--noir)]/80 border-b hairline">
        <div className="container-luxe flex items-center justify-between h-20 md:h-24">
          <button
            className="md:hidden text-[color:var(--gold)] p-2 -ml-2"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Logo size="md" className="md:order-1" />

          <nav className="hidden md:flex items-center gap-8 md:order-2 mx-auto absolute left-1/2 -translate-x-1/2">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="text-[13px] tracking-[0.22em] uppercase text-[color:var(--muted-foreground)] hover:text-[color:var(--gold)] transition-colors"
                activeProps={{ className: "text-[color:var(--gold)]" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 md:gap-2 md:order-3">
            <Link
              to="/shop"
              aria-label="Search"
              className="hidden md:inline-flex p-2 text-[color:var(--muted-foreground)] hover:text-[color:var(--gold)]"
            >
              <Search className="h-4 w-4" />
            </Link>
            <button
              onClick={open}
              aria-label="Open cart"
              className="relative p-2 text-[color:var(--muted-foreground)] hover:text-[color:var(--gold)]"
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-gold-gradient text-[color:var(--noir)] text-[10px] font-bold rounded-full h-4 min-w-4 px-1 grid place-items-center">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-fade-in">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-[color:var(--noir)] border-r hairline flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between px-5 py-5 border-b hairline">
              <Logo size="sm" />
              <button onClick={() => setMobileOpen(false)} className="text-[color:var(--gold)] p-2" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col p-6 gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setMobileOpen(false)}
                  className="py-3 text-2xl font-serif tracking-wide text-[color:var(--foreground)] border-b hairline/50"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="px-6 pt-2 pb-6">
              <p className="eyebrow mb-3">Collections</p>
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {COLLECTIONS.slice(0, 8).map((c) => (
                  <Link
                    key={c.slug}
                    to="/collections/$slug"
                    params={{ slug: c.slug }}
                    onClick={() => setMobileOpen(false)}
                    className="text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--gold)]"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="mt-auto p-6 border-t hairline">
              <a
                href={whatsappLink("Hi OMORA BLOOMS, I'd like to order.")}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold w-full inline-flex items-center justify-center py-3 px-4 rounded-full text-sm"
              >
                Order on WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
