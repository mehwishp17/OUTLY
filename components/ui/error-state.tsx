import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";

type ErrorStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

/** Reusable "something's wrong" panel — one of the shared states named
 * in the frontend component architecture (alongside `LoadingState` and
 * `EmptyState`). Distinct from a 404-style "not found" message in that
 * it uses `role="alert"`. */
export function ErrorState({ title, description, action, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-[#B3164C]/30 bg-[#B3164C]/5 px-5 py-10 text-center ${className ?? ""}`}
    >
      <Icon name="alert-circle" className="h-6 w-6 text-[#B3164C]" />
      <p className="text-sm font-semibold text-[#8A0F3A]">{title}</p>
      {description ? <p className="text-sm text-[#8A0F3A]">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
