      </div>
    </div>
  );
}

function resolveGallery(product: Product, collectionImg: string | undefined, related: Product[]): string[] {
  const uploaded = ((product as unknown as { images?: string[] | null }).images ?? [])
    .filter((s): s is string => typeof s === "string" && s.length > 0)
    .map((s) => resolveProductImage(s));
  if (uploaded.length > 0) {
    // Uploaded photos win over the placeholder cover image.
    return Array.from(new Set([...uploaded, resolveProductImage(product.image_url)])).slice(0, 6);
  }
  const fallback = [
    resolveProductImage(product.image_url),
    collectionImg,
    ...related.slice(0, 2).map((r) => resolveProductImage(r.image_url)),
  ].filter((s): s is string => Boolean(s));
  return Array.from(new Set(fallback)).slice(0, 4);
}

