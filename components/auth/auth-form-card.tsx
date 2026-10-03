import { AuthIconBadge } from "@/components/auth/auth-icon-badge";
import type { IconName } from "@/components/ui/icon";

type AuthFormCardProps = {
  /** Optional round icon above the heading (used by the password-recovery screens). */
  icon?: IconName;
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
};

/**
 * Consistent heading block used at the top of every auth form (mirrors
 * `SectionHeading` from the landing page, but left-aligned and sized for
 * a narrow form column).
 */
export function AuthFormCard({ icon, eyebrow, title, description, children }: AuthFormCardProps) {
  return (
    <div>
      {icon ? <AuthIconBadge name={icon} /> : null}
      {eyebrow ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--outly-violet)]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-[var(--outly-muted)]">{description}</p>
      ) : null}
      <div className="mt-7">{children}</div>
    </div>
  );
}
