import type { ReactNode } from "react";

/**
 * Fixed bottom action bar for mobile screens.
 * Self-contained layout wrapper — callers supply the buttons.
 */
export function MobileActionBar({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 w-full max-w-full border-t border-border/60 bg-background/95 backdrop-blur-md sm:hidden ${className}`}
    >
      <div className="w-full px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{children}</div>
    </div>
  );
}
