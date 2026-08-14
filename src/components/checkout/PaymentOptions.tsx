import type { PaymentOption } from "./types";

interface PaymentOptionsProps {
  options: PaymentOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function PaymentOptions({ options, selectedId, onSelect }: PaymentOptionsProps) {
  return (
    <div role="radiogroup" aria-label="Payment method" className="flex flex-col gap-3">
      {options.map((option) => {
        const active = option.id === selectedId;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(option.id)}
            className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
              active
                ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900"
                : "border-neutral-200 hover:border-neutral-400"
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                active ? "border-neutral-900" : "border-neutral-400"
              }`}
            >
              {active ? <span className="h-2 w-2 rounded-full bg-neutral-900" /> : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-neutral-900">{option.label}</span>
              {option.description ? (
                <span className="block text-xs text-neutral-500">{option.description}</span>
              ) : null}
            </span>
            {option.badge ? (
              <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[11px] font-medium text-white">
                {option.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
