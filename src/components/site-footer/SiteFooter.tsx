import type { FooterContactItem, FooterLinkColumn, FooterSocialLink, SiteFooterProps } from "./types";

function Wordmark({ monogram, name, tagline }: { monogram: string; name: string; tagline: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-neutral-300 bg-neutral-50 text-sm font-semibold tracking-tight text-neutral-800"
      >
        {monogram}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-lg font-semibold tracking-tight text-neutral-900">{name}</span>
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
          {tagline}
        </span>
      </span>
    </div>
  );
}

function LinkColumn({ column }: { column: FooterLinkColumn }) {
  return (
    <nav aria-label={column.title} className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
        {column.title}
      </h3>
      <ul className="flex flex-col gap-2.5">
        {column.links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="text-sm text-neutral-600 transition-colors hover:text-neutral-900"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ContactList({ items }: { items: FooterContactItem[] }) {
  return (
    <dl className="flex flex-col gap-2.5">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col gap-0.5">
          <dt className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
            {item.label}
          </dt>
          <dd className="text-sm text-neutral-600">
            {item.href ? (
              <a href={item.href} className="transition-colors hover:text-neutral-900">
                {item.value}
              </a>
            ) : (
              item.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function SocialRow({ links }: { links: FooterSocialLink[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.href}
          aria-label={link.label}
          className="grid h-9 w-9 place-items-center rounded-full border border-neutral-300 text-[11px] font-semibold tracking-tight text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-900"
        >
          {link.badge}
        </a>
      ))}
    </div>
  );
}

/**
 * Self-contained, exportable site footer.
 *
 * Layout: the brand block (wordmark + description) and the contact block sit
 * side-by-side as the two widest columns, while the link columns form a neat
 * compact grid beside them. Everything collapses to a single stack on mobile.
 */
export function SiteFooter({
  brandName,
  brandTagline,
  brandDescription,
  brandMonogram,
  linkColumns,
  socialLinks,
  contact,
  legalText,
  legalLinks,
}: SiteFooterProps) {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12">
          {/* Brand column */}
          <div className="flex flex-col gap-5 lg:col-span-4">
            <Wordmark monogram={brandMonogram} name={brandName} tagline={brandTagline} />
            <p className="max-w-sm text-sm leading-relaxed text-neutral-600">
              {brandDescription}
            </p>
            {socialLinks && socialLinks.length > 0 ? <SocialRow links={socialLinks} /> : null}
          </div>

          {/* Link columns — compact grid */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5">
            {linkColumns.map((column) => (
              <LinkColumn key={column.id} column={column} />
            ))}
          </div>

          {/* Contact column */}
          {contact && contact.length > 0 ? (
            <div className="lg:col-span-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Visit
              </h3>
              <div className="mt-3">
                <ContactList items={contact} />
              </div>
            </div>
          ) : null}
        </div>

        {/* Lower legal bar */}
        <div className="mt-10 flex flex-col gap-4 border-t border-neutral-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-neutral-500">{legalText}</p>
          {legalLinks && legalLinks.length > 0 ? (
            <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {legalLinks.map((link, index) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-xs text-neutral-500 transition-colors hover:text-neutral-900"
                >
                  {link.label}
                  {index < legalLinks.length - 1 ? (
                    <span aria-hidden="true" className="ml-4 text-neutral-300">
                      ·
                    </span>
                  ) : null}
                </a>
              ))}
            </nav>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
