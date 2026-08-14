import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatInr } from "@/lib/loyalty";
import { PAYMENT_OPTIONS, computePayment, type PaymentMode } from "@/lib/payment-options";

interface PaymentOptionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Order value before payment-mode adjustments. */
  subtotalInr: number;
  /** Called with the chosen mode; keep the sheet open while pending. */
  onSelect: (mode: PaymentMode) => void;
  pending?: boolean;
  title?: string;
}

/**
 * Bottom sheet that shows the two payment options and reports the choice.
 * Purely presentational — it holds no cart or order state.
 */
export function PaymentOptionsSheet({
  open,
  onOpenChange,
  subtotalInr,
  onSelect,
  pending = false,
  title = "Choose how to pay",
}: PaymentOptionsSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90dvh]">
        <div className="mx-auto w-full max-w-md overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xl font-light">{title}</DrawerTitle>
            <DrawerDescription>
              Order value {formatInr(subtotalInr)} · no hidden charges.
            </DrawerDescription>
          </DrawerHeader>

          <div className="grid gap-3 px-4">
            {PAYMENT_OPTIONS.map((option) => {
              const breakdown = computePayment(subtotalInr, option.mode);
              return (
                <button
                  key={option.mode}
                  type="button"
                  disabled={pending}
                  onClick={() => onSelect(option.mode)}
                  className="w-full rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-base text-foreground">
                        <span className="min-w-0">{option.title}</span>
                        {option.badge && (
                          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-primary">
                            {option.badge}
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg text-foreground">{formatInr(breakdown.dueNowInr)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {option.mode === "full"
                          ? `You save ${formatInr(breakdown.modeDiscountInr)}`
                          : `${formatInr(breakdown.balanceInr)} later`}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary">
                    <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {pending ? "Processing…" : "Pay with this option"}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="px-4 pt-4">
            <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
