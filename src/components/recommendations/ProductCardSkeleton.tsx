export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="aspect-square w-full animate-pulse bg-neutral-100" />
      <div className="space-y-2 p-3">
        <div className="h-2.5 w-1/3 animate-pulse rounded bg-neutral-100" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-neutral-100" />
        <div className="h-3 w-1/4 animate-pulse rounded bg-neutral-100" />
      </div>
    </div>
  );
}
