import logoAsset from "@/assets/omora-logo.asset.json";

/**
 * Served from /public so it resolves on any host (custom domains included).
 * The CDN pointer stays as a runtime fallback.
 */
export const LOGO_SRC = "/omora-logo.jpg";
export const LOGO_FALLBACK_SRC = logoAsset.url;
