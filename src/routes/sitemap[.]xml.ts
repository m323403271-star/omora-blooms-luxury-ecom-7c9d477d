import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { COLLECTIONS } from "@/lib/collections";

const BASE_URL = "https://omorablooms.in";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/shop", changefreq: "weekly", priority: "0.9" },
          { path: "/collections", changefreq: "weekly", priority: "0.9" },
          { path: "/airport-pickup", changefreq: "monthly", priority: "0.8" },
          { path: "/about", changefreq: "monthly", priority: "0.6" },
          { path: "/contact", changefreq: "monthly", priority: "0.6" },
          { path: "/faq", changefreq: "monthly", priority: "0.6" },
          { path: "/shipping", changefreq: "yearly", priority: "0.3" },
          { path: "/returns", changefreq: "yearly", priority: "0.3" },
          { path: "/privacy", changefreq: "yearly", priority: "0.3" },
          { path: "/terms", changefreq: "yearly", priority: "0.3" },
        ];

        for (const c of COLLECTIONS) {
          entries.push({ path: `/collections/${c.slug}`, changefreq: "weekly", priority: "0.8" });
        }

        try {
          const url = process.env["VITE_SUPABASE_URL"];
          const key = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
          if (url && key) {
            const supabase = createClient(url, key, {
              auth: { persistSession: false, autoRefreshToken: false },
            });
            const { data } = await supabase
              .from("products")
              .select("slug")
              .eq("available", true);
            for (const row of data ?? []) {
              if (row?.slug) {
                entries.push({ path: `/products/${row.slug}`, changefreq: "weekly", priority: "0.7" });
              }
            }
          }
        } catch {
          // products are optional in the sitemap; static routes still ship
        }

        const seen = new Set<string>();
        const urls = entries
          .filter((e) => (seen.has(e.path) ? false : (seen.add(e.path), true)))
          .map((e) =>
            [
              `  <url>`,
              `    <loc>${BASE_URL}${e.path}</loc>`,
              e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
              e.priority ? `    <priority>${e.priority}</priority>` : null,
              `  </url>`,
            ]
              .filter(Boolean)
              .join("\n"),
          );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
