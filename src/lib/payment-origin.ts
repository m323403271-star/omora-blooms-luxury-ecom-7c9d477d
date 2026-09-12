import { SITE_URL } from "@/lib/seo";

export const PAYMENT_PRODUCTION_ORIGIN = SITE_URL;

const PAYMENT_ORIGINS = new Set([
  PAYMENT_PRODUCTION_ORIGIN,
  "https://www.omorablooms.in",
]);

function normalizeOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function isProductionPaymentOrigin(value: string | null | undefined): boolean {
  const origin = normalizeOrigin(value);
  return origin !== null && PAYMENT_ORIGINS.has(origin);
}

export function isLocalPaymentOrigin(value: string | null | undefined): boolean {
  const origin = normalizeOrigin(value);
  if (!origin) return false;
  const hostname = new URL(origin).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function livePaymentUrl(pathname: string): string {
  const safePath = pathname.startsWith("/") ? pathname : "/";
  return new URL(safePath, PAYMENT_PRODUCTION_ORIGIN).toString();
}

export function paymentOriginFromRequest(request: Request): string | null {
  return normalizeOrigin(request.headers.get("origin") ?? request.headers.get("referer"));
}