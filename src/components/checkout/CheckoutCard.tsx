import type { ReactNode } from "react";

interface CheckoutCardProps {
  step?: number;
  title: string;
  description?: string;
  children: ReactNode;
}

export function CheckoutCard({ step, title, description, children }: CheckoutCardProps) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
      <header className="mb-4 flex items-start gap-3">
        {step ? (
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
            {step}
          </span>
        ) : null}
        <div>
          <h2 className="text-base font-semibold tracking-tight text-neutral-900">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-neutral-500">{description}</p>
          ) : null}
        </div>
      </header>
      {children}
    </section>
  );
}
