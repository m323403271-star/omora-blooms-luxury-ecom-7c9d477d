export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterLinkColumn {
  id: string;
  title: string;
  links: FooterLink[];
}

export interface FooterSocialLink {
  id: string;
  label: string;
  href: string;
  /** Short uppercase tag for accessibility / icon fallback, e.g. "IG", "FB". */
  badge: string;
}

export interface FooterContactItem {
  id: string;
  label: string;
  value: string;
  href?: string;
}

export interface SiteFooterProps {
  brandName: string;
  /** Short descriptor shown under the wordmark, e.g. "Floral Studio". */
  brandTagline: string;
  /** Longer brand paragraph shown in the brand column. */
  brandDescription: string;
  /** Small circular badge text used as the wordmark glyph, e.g. "OB". */
  brandMonogram: string;
  linkColumns: FooterLinkColumn[];
  socialLinks?: FooterSocialLink[];
  contact?: FooterContactItem[];
  /** Lower-bar legal text. */
  legalText: string;
  /** Optional helper links in the lower bar. */
  legalLinks?: FooterLink[];
}
