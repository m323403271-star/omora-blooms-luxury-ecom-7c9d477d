import { formatCurrency } from "./formatCurrency";
import type { OrderLine, OrderTotals } from "./types";

interface OrderSummaryProps {
  lines: OrderLine[];
  totals: OrderTotals;
  onPlaceOrder?: () => void;
  ctaLabel?: string;
  disabled?: boolean;
}

export function OrderSummary({
  lines,
  totals,
  onPlaceOrder,
  ctaLabel = "Place order",
  disabled,
}: OrderSummaryProps) {
  const c = totals.currency;

  return (
    <aside className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 lg:sticky lg:top-6">
      <h2 className="text-base font-semibold tracking-tight text-neutral-900">Order summary</h2>

      <ul className="mt-4 flex flex-col gap-4 border-b border-neutral-200 pb-4">
        {lines.map((line) => (
          <li key={line.id} className="flex items-start gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
              {line.imageUrl ? (
                <img src={line.imageUrl} alt={line.name} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-900">{line.name}</p>
              {line.variant ? (
                <p className="truncate text-xs text-neutral-500">{line.variant}</p>
              ) : null}
              <p className="text-xs text-neutral-500">Qty {line.quantity}</p>
            </div>
            <p className="text-sm font-medium text-neutral-900">
              {formatCurrency(line.unitPrice * line.quantity, c)}
            </p>
          </li>
        ))}
      </ul>

      <dl className="mt-4 flex flex-col gap-2 text-sm">
        <Row label="Subtotal" value={formatCurrency(totals.subtotal, c)} />
        <Row label="Shipping" value={formatCurrency(totals.shipping, c)} />
        {totals.discount > 0 ? (
          <Row label="Discount" value={`− ${formatCurrency(totals.discount, c)}`} accent />
        ) : null}
        <Row label="Taxes" value={formatCurrency(totals.tax, c)} />
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-4">
        <span className="text-sm font-semibold text-neutral-900">Total</span>
        <span className="text-lg font-semibold text-neutral-900">
          {formatCurrency(totals.total, c)}
        </span>
      </div>

      <button
        type="button"
        onClick={onPlaceOrder}
        disabled={disabled}
        className="mt-5 w-full rounded-lg bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {ctaLabel}
      </button>
      <p className="mt-3 text-center text-xs text-neutral-500">
        Secure checkout · Taxes included where applicable
      </p>
    </aside>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-neutral-600">{label}</dt>
      <dd className={accent ? "font-medium text-emerald-700" : "text-neutral-900"}>{value}</dd>
    </div>
  );
}
