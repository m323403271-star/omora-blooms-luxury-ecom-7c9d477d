import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, ShoppingBag, Search, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { DeliveryEtaChecker } from "./DeliveryEtaChecker";
import { DeliveryBanner } from "./DeliveryBanner";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [etaOpen, setEtaOpen] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-[#0d231a]/95 backdrop-blur-md border-b border-[#c5a869]/20 transition-all">
      <DeliveryBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 md:h-24">
          {/* Mobile menu trigger */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-[#c5a869] hover:text-[#e5cf92] p-2"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Enlarged Centered Logo */}
          <div className="flex items-center">
            <Link to="/" className="inline-flex items-center py-1">
              <div className="h-14 sm:h-16 md:h-20 w-auto flex items-center justify-center">
                <Logo />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {NAV.map((item) => {
              const active = currentPath === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`text-sm font-medium tracking-wide transition-colors ${
                    active
                      ? "text-[#c5a869] border-b-2 border-[#c5a869] pb-1"
                      : "text-[#f4efe6]/80 hover:text-[#c5a869]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            <button
              onClick={() => setEtaOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#c5a869]/30 text-[#c5a869] text-xs hover:bg-[#c5a869]/10 transition-colors"
            >
              <span>Check Delivery</span>
            </button>

            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="text-[#c5a869] hover:text-[#e5cf92] p-2 transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            <Link
              to="/cart"
              className="relative text-[#c5a869] hover:text-[#e5cf92] p-2 transition-colors inline-flex items-center"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-[#c5a869] text-[#0d231a] font-bold text-[10px] h-4 w-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#0a1b14] border-b border-[#c5a869]/30 px-4 pt-3 pb-6 space-y-3">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-[#f4efe6] hover:bg-[#133024] hover:text-[#c5a869]"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-[#c5a869]/20">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-[#c5a869] px-3 py-1"
            >
              WhatsApp Support: {WHATSAPP_DISPLAY}
            </a>
          </div>
        </div>
      )}

      {/* Delivery ETA Checker Popup */}
      {etaOpen && <DeliveryEtaChecker onClose={() => setEtaOpen(false)} />}
    </header>
  );
}
