import type { PickupPoint } from "./types";

interface PickupPointSelectorProps {
  points: PickupPoint[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function PickupPointSelector({ points, selectedId, onSelect }: PickupPointSelectorProps) {
  return (
    <ul className="flex flex-col gap-3">
      {points.map((point) => {
        const active = point.id === selectedId;
        return (
          <li key={point.id}>
            <button
              type="button"
              onClick={() => onSelect(point.id)}
              aria-pressed={active}
              className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                active
                  ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900"
                  : "border-neutral-200 hover:border-neutral-400"
              }`}
            >
              <span
                className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  active ? "border-neutral-900" : "border-neutral-400"
                }`}
              >
                {active ? <span className="h-2 w-2 rounded-full bg-neutral-900" /> : null}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-neutral-900">{point.name}</span>
                <span className="mt-0.5 block text-sm text-neutral-600">{point.addressLine}</span>
                <span className="mt-1 block text-xs text-neutral-500">
                  {point.distanceLabel} · {point.timingsLabel}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
