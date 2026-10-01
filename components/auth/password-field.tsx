"use client";

import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  onFocus?: () => void;
};

/**
 * Password input with an accessible show/hide toggle. The toggle button
 * is icon-only, so it always carries an `aria-label` describing the
 * action it performs (not its current state) plus `aria-pressed` so
 * assistive tech can announce whether the password is currently visible.
 */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  required,
  autoComplete = "current-password",
  placeholder,
  onFocus,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const toggleId = useId();

  return (
    <Input
      id={id}
      label={label}
      type={isVisible ? "text" : "password"}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={error}
      hint={hint}
      required={required}
      autoComplete={autoComplete}
      placeholder={placeholder}
      onFocus={onFocus}
      className="py-3 shadow-none"
      rightElement={
        <button
          type="button"
          id={toggleId}
          onClick={() => setIsVisible((visible) => !visible)}
          aria-pressed={isVisible}
          aria-label={isVisible ? "Hide password" : "Show password"}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--outly-muted)] transition-colors hover:text-[var(--outly-violet)]"
        >
          <Icon name={isVisible ? "eye-off" : "eye"} className="h-4.5 w-4.5" />
        </button>
      }
    />
  );
}
