import type { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

/**
 * Accessible form label. `required` renders a visually distinct marker
 * that also has a screen-reader-only word (not color-only).
 */
export function Label({ children, required, className, ...props }: LabelProps) {
  return (
    <label
      className={cn("block text-sm font-semibold text-[var(--outly-ink)]", className)}
      {...props}
    >
      {children}
      {required ? (
        <span className="ml-0.5 text-[var(--outly-pink-bright)]">
          {" "}
          *<span className="sr-only"> (required)</span>
        </span>
      ) : null}
    </label>
  );
}
