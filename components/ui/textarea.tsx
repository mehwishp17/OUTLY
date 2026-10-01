import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/form-error";
import { cn } from "@/lib/utils";

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  /** Visually hides the label while keeping it in the accessibility
   * tree (`sr-only`) — for compact contexts like inline comment editing
   * where a visible label would be redundant. */
  hideLabel?: boolean;
};

/**
 * Multi-line text field mirroring `Input`'s label/error wiring
 * (`aria-invalid`, `aria-describedby`) — used for post content, bio, and
 * comment composition.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { id, label, error, hint, required, hideLabel, className, ...props },
  ref,
) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} required={required} className={hideLabel ? "sr-only" : undefined}>
        {label}
      </Label>
      <textarea
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId ?? hintId}
        className={cn(
          "w-full resize-y rounded-[var(--radius-sm)] border bg-white px-4 py-2.5 text-sm text-[var(--outly-ink)] shadow-[var(--shadow-soft)] transition-colors placeholder:text-[var(--outly-muted)]/70 focus:outline-none",
          error
            ? "border-[#B3164C] focus:border-[#B3164C]"
            : "border-[var(--outly-border)] focus:border-[var(--outly-violet)]",
          className,
        )}
        {...props}
      />
      {hint && !error ? (
        <p id={hintId} className="text-xs text-[var(--outly-muted)]">
          {hint}
        </p>
      ) : null}
      {error ? <FormError id={errorId!}>{error}</FormError> : null}
    </div>
  );
});
