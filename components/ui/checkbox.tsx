import type { InputHTMLAttributes } from "react";
import { FormError } from "@/components/ui/form-error";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> & {
  id: string;
  label: React.ReactNode;
  error?: string;
};

/**
 * Accessible checkbox with a proper `<label>` association (clicking the
 * label text toggles the box) used for "Remember me" and the terms
 * acceptance control.
 */
export function Checkbox({ id, label, error, className, ...props }: CheckboxProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div>
      <div className="flex items-start gap-2.5">
        <input
          id={id}
          type="checkbox"
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={cn(
            "mt-0.5 h-4.5 w-4.5 shrink-0 rounded border-[var(--outly-border)] text-[var(--outly-violet)] focus-visible:outline-2 focus-visible:outline-offset-2",
            error ? "border-[#B3164C]" : undefined,
            className,
          )}
          {...props}
        />
        <label htmlFor={id} className="text-sm leading-snug text-[var(--outly-muted)]">
          {label}
        </label>
      </div>
      {error ? <FormError id={errorId!}>{error}</FormError> : null}
    </div>
  );
}
