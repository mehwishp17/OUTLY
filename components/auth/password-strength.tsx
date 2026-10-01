import { Icon } from "@/components/ui/icon";
import { PASSWORD_REQUIREMENTS } from "@/lib/validation/auth-schemas";
import { cn } from "@/lib/utils";

type PasswordStrengthProps = {
  password: string;
};

/**
 * Live checklist of the sign-up password requirements. Updates as the
 * user types and announces changes politely via `aria-live` so screen
 * reader users hear progress without it interrupting typing. Each item
 * uses an icon (not just color) to show met/unmet state.
 */
export function PasswordStrength({ password }: PasswordStrengthProps) {
  const metCount = PASSWORD_REQUIREMENTS.filter((requirement) => requirement.test(password)).length;

  return (
    <div className="mt-2.5 rounded-[var(--radius-md)] border border-[var(--outly-border)] bg-[var(--outly-lavender)] p-3">
      <p className="sr-only" aria-live="polite">
        {metCount} of {PASSWORD_REQUIREMENTS.length} password requirements met.
      </p>
      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2" aria-hidden="true">
        {PASSWORD_REQUIREMENTS.map((requirement) => {
          const met = requirement.test(password);
          return (
            <li
              key={requirement.id}
              className={cn(
                "flex items-center gap-1.5 text-xs",
                met ? "text-[#155C39]" : "text-[var(--outly-muted)]",
              )}
            >
              <Icon name={met ? "check-circle" : "alert-circle"} className="h-3.5 w-3.5 shrink-0" />
              {requirement.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
