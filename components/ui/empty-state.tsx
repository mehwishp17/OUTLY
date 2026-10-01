import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/components/ui/icon";

type EmptyStateProps = {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

/** Reusable "nothing here yet" panel — one of the shared states named in
 * the frontend component architecture (alongside `LoadingState` and
 * `ErrorState`). */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white px-5 py-10 text-center shadow-[var(--shadow-soft)] animate-fade-in motion-reduce:animate-none ${className ?? ""}`}
    >
      {icon ? <Icon name={icon} className="h-6 w-6 text-[var(--outly-muted)]" /> : null}
      <p className="text-sm font-semibold text-[var(--outly-ink)]">{title}</p>
      {description ? <p className="text-sm text-[var(--outly-muted)]">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
