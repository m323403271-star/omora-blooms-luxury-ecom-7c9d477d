export const PRODUCT_BUCKET = "product-images";

/** Extract the storage object path from a stored value (public URL, signed URL, or raw path). */
export function productImagePath(value: string): string | null {
  if (!value) return null;
  const marker = `/${PRODUCT_BUCKET}/`;
  const i = value.indexOf(marker);
  if (i >= 0) {
    const rest = value.slice(i + marker.length);
    return rest.split("?")[0];
  }
  // Raw path stored without a leading slash, e.g. "product-images/<id>/file.jpg"
  if (!value.startsWith("http") && !value.startsWith("/") && !value.startsWith("data:")) {
    const raw = value.split("?")[0];
    return raw.startsWith(`${PRODUCT_BUCKET}/`) ? raw.slice(PRODUCT_BUCKET.length + 1) : raw;
  }
  return null;
}

/**
 * The product-images bucket is private, so public URLs 404 (broken images).
 * Convert any stored bucket reference into a working signed URL.
 */
export async function signProductImages(values: string[]): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  const pathByValue = new Map<string, string>();
  for (const v of values) {
    if (!v) continue;
    if (v.includes("/object/sign/")) continue; // already signed
    const p = productImagePath(v);
    if (p) pathByValue.set(v, p);
  }
  const paths = Array.from(new Set(pathByValue.values()));
  if (paths.length === 0) return map;

  try {
    const { signProductImagePaths } = await import("@/lib/storage-sign.functions");
    const byPath = await signProductImagePaths({ data: { paths: paths.slice(0, 200) } });
    for (const [value, path] of pathByValue) {
      if (byPath[path]) map[value] = byPath[path];
    }
  } catch {
    /* fall back to original values */
  }
  return map;
}
