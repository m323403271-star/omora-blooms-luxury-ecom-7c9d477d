import type { SiteFooterProps } from "./types";

/**
 * Sample footer data for an "Omora Blooms" floral studio.
 * Every link, contact detail, and piece of brand copy is preserved here so
 * the component can be dropped into the real site without losing content.
 */
export const sampleFooter: SiteFooterProps = {
  brandName: "Omora Blooms",
  brandTagline: "Floral Studio",
  brandMonogram: "OB",
  brandDescription:
    "Omora Blooms is an independent floral studio crafting seasonal arrangements, wedding florals, and signature bouquets from sustainably grown stems. Each piece is hand-arranged in our studio and delivered fresh across the city, with same-day options for orders placed before noon.",
  linkColumns: [
    {
      id: "shop",
      title: "Shop",
      links: [
        { label: "Signature Bouquets", href: "#" },
        { label: "Seasonal Arrangements", href: "#" },
        { label: "Wedding Florals", href: "#" },
        { label: "Subscriptions", href: "#" },
        { label: "Gift Cards", href: "#" },
        { label: "Vases & Vessels", href: "#" },
      ],
    },
    {
      id: "about",
      title: "About",
      links: [
        { label: "Our Story", href: "#" },
        { label: "Sustainable Sourcing", href: "#" },
        { label: "The Studio", href: "#" },
        { label: "Press & Features", href: "#" },
        { label: "Careers", href: "#" },
      ],
    },
    {
      id: "help",
      title: "Help & Care",
      links: [
        { label: "Flower Care Guide", href: "#" },
        { label: "Delivery & Timing", href: "#" },
        { label: "Substitution Policy", href: "#" },
        { label: "Returns & Refunds", href: "#" },
        { label: "Track Your Order", href: "#" },
        { label: "Contact Us", href: "#" },
      ],
    },
  ],
  contact: [
    { id: "studio", label: "Studio", value: "218 Garden Lane, East Village" },
    { id: "hours", label: "Hours", value: "Mon–Sat, 9am–7pm" },
    { id: "phone", label: "Phone", value: "(212) 555-0147", href: "tel:+12125550147" },
    { id: "email", label: "Email", value: "hello@omorablooms.com", href: "mailto:hello@omorablooms.com" },
  ],
  socialLinks: [
    { id: "instagram", label: "Instagram", href: "#", badge: "IG" },
    { id: "pinterest", label: "Pinterest", href: "#", badge: "PIN" },
    { id: "facebook", label: "Facebook", href: "#", badge: "FB" },
    { id: "tiktok", label: "TikTok", href: "#", badge: "TT" },
  ],
  legalText: "© 2026 Omora Blooms. All rights reserved. Hand-arranged with care.",
  legalLinks: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Accessibility", href: "#" },
    { label: "Cookie Settings", href: "#" },
  ],
};
