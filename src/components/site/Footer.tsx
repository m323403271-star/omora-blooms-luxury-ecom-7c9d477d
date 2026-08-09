import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Mail, Phone, MessageCircle } from "lucide-react";
import { Logo } from "./Logo";
import {
  CONTACT_EMAIL,
  WHATSAPP_DISPLAY,
  whatsappLink,
  INSTAGRAM_URL,
  FACEBOOK_URL,
} from "@/lib/whatsapp";

export function Footer() {
  return (
    <footer className="mt-24 border-t hairline bg-[color:var(--noir)]">
      <div className="container-luxe py-16 grid gap-10 md:gap-12 md:grid-cols-12">
        {/* Brand block */}
        <div className="md:col-span-4 lg:col-span-5">
          <Logo size="lg" />
          <p className="mt-5 text-sm text-[color:var(--muted-foreground)] leading-relaxed max-w-sm">
            Luxury handmade bouquets and gifts, crafted to last forever. Delivered with love from India, worldwide.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2 rounded-full hairline border hover:text-[color:var(--gold)]"><Instagram className="h-4 w-4" /></a>
            <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-2 rounded-full hairline border hover:text-[color:var(--gold)]"><Facebook className="h-4 w-4" /></a>
            <a href={whatsappLink("Hi!")} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="p-2 rounded-full hairline border hover:text-[color:var(--gold)]"><MessageCircle className="h-4 w-4" /></a>
          </div>
        </div>

        {/* Link columns — compact 2-up on mobile, spread across on desktop */}
        <div className="md:col-span-8 lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
          <div>
            <p className="eyebrow mb-4">Shop</p>
            <ul className="space-y-2.5 text-sm text-[color:var(--muted-foreground)]">
              <li><Link to="/shop" className="hover:text-[color:var(--gold)]">All Products</Link></li>
              <li><Link to="/collections/crochet-bouquets" className="hover:text-[color:var(--gold)]">Crochet Bouquets</Link></li>
              <li><Link to="/collections/airport-collection" className="hover:text-[color:var(--gold)]">Airport Welcome</Link></li>
              <li><Link to="/collections/mother-recovery" className="hover:text-[color:var(--gold)]">Mother Recovery</Link></li>
              <li><Link to="/collections/baby-collection" className="hover:text-[color:var(--gold)]">Baby Collection</Link></li>
            </ul>
          </div>

          <div>
            <p className="eyebrow mb-4">Help</p>
            <ul className="space-y-2.5 text-sm text-[color:var(--muted-foreground)]">
              <li><Link to="/track" className="hover:text-[color:var(--gold)]">Track Order</Link></li>
              <li><Link to="/about" className="hover:text-[color:var(--gold)]">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-[color:var(--gold)]">Contact</Link></li>
              <li><Link to="/faq" className="hover:text-[color:var(--gold)]">FAQ</Link></li>
              <li><Link to="/shipping" className="hover:text-[color:var(--gold)]">Shipping</Link></li>
              <li><Link to="/returns" className="hover:text-[color:var(--gold)]">Return Policy</Link></li>
              <li><Link to="/privacy" className="hover:text-[color:var(--gold)]">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-[color:var(--gold)]">Terms &amp; Conditions</Link></li>
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <p className="eyebrow mb-4">Get in touch</p>
            <ul className="space-y-3 text-sm text-[color:var(--muted-foreground)]">
              <li>
                <a href={whatsappLink("Hello OMORA BLOOMS!")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-[color:var(--gold)]">
                  <MessageCircle className="h-4 w-4 flex-shrink-0" /> WhatsApp {WHATSAPP_DISPLAY}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 hover:text-[color:var(--gold)] break-all">
                  <Mail className="h-4 w-4 flex-shrink-0" /> {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a href={`tel:+${WHATSAPP_DISPLAY.replace(/\s+/g, "")}`} className="inline-flex items-center gap-2 hover:text-[color:var(--gold)]">
                  <Phone className="h-4 w-4 flex-shrink-0" /> {WHATSAPP_DISPLAY}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t hairline">
        <div className="container-luxe py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[color:var(--muted-foreground)]">
          <p>© {new Date().getFullYear()} OMORA BLOOMS · Handmade with Love, Crafted to Last Forever.</p>
          <p className="tracking-widest uppercase">Bengaluru · India · Ships Worldwide</p>
        </div>
      </div>
    </footer>
  );
}
