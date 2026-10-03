import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";
import type { BadgeProgress } from "@/lib/gamification";

type BadgeCardProps = {
  progress: BadgeProgress;
};

export function BadgeCard({ progress }: BadgeCardProps) {
  const { badge, value, earned } = progress;
  const displayValue = Math.min(value, badge.target);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-lg)] border bg-white p-5 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        earned ? "border-[var(--outly-violet)]/40" : "border-[var(--outly-border)] bg-white/70",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            earned ? "text-white gradient-brand" : "bg-[var(--outly-lavender)] text-[var(--outly-muted)]",
          )}
          aria-hidden="true"
        >
          <Icon name={earned ? badge.icon : "lock"} className="h-5.5 w-5.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-semibold", earned ? "text-[var(--outly-ink)]" : "text-[var(--outly-ink)]/80")}>{badge.title}</p>
          <p className="text-xs text-[var(--outly-muted)]">{badge.description}</p>
        </div>
        {earned ? (
          <span className="shrink-0 rounded-full bg-[#e6f4ea] px-2.5 py-1 text-xs font-semibold text-[#1e7a3a]">
            Earned
          </span>
        ) : null}
      </div>

      <div>
        <ProgressBar
          value={displayValue}
          max={badge.target}
          label={`${displayValue} of ${badge.target} for ${badge.title}`}
        />
        <p className="mt-1.5 flex justify-between text-xs text-[var(--outly-muted)]">
          <span>
            {displayValue}/{badge.target}
          </span>
          <span>{earned ? "Complete" : `${badge.target - displayValue} to go`}</span>
        </p>
      </div>
    </div>
  );
}
