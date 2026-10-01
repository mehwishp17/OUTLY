import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/form-error";
import { cn } from "@/lib/utils";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  rightElement?: ReactNode;
};

/**
 * Text input primitive used across every auth form. Wires up the
 * label/input/error relationship (`aria-invalid`, `aria-describedby`)
 * once here so individual forms don't have to repeat it.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, error, hint, required, rightElement, className, ...props },
  ref,
) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId ?? hintId}
          className={cn(
            "w-full rounded-[var(--radius-sm)] border bg-white px-4 py-2.5 text-sm text-[var(--outly-ink)] shadow-[var(--shadow-soft)] transition-colors placeholder:text-[var(--outly-muted)]/70 focus:outline-none",
            error
              ? "border-[#B3164C] focus:border-[#B3164C]"
              : "border-[var(--outly-border)] focus:border-[var(--outly-violet)]",
            rightElement ? "pr-11" : undefined,
            className,
          )}
          {...props}
        />
        {rightElement ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2.5">{rightElement}</div>
        ) : null}
      </div>
      {hint && !error ? (
        <p id={hintId} className="text-xs text-[var(--outly-muted)]">
          {hint}
        </p>
      ) : null}
      {error ? <FormError id={errorId!}>{error}</FormError> : null}
    </div>
  );
});
