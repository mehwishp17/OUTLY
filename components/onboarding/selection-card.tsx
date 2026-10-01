"use client";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type SelectionCardProps = {
  title: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
};

/**
 * Reusable selectable card used for both the multi-select interests grid
 * and the single-select activity-level list. Selection is a toggle
 * button (`aria-pressed`) so it stays keyboard-accessible without
 * needing a full custom radiogroup implementation, and the selected
 * state is shown via a border/background change plus a check icon (not
 * color alone).
 */
export function SelectionCard({ title, description, selected, onSelect }: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-[var(--radius-md)] border p-4 text-left transition-colors duration-150 motion-reduce:transition-none",
        selected
          ? "border-[var(--outly-violet)] bg-[var(--outly-lavender)]"
          : "border-[var(--outly-border)] bg-white hover:border-[var(--outly-violet)]/50",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
          selected
            ? "border-[var(--outly-violet)] bg-[var(--outly-violet)] text-white"
            : "border-[var(--outly-border)] text-transparent",
        )}
      >
        <Icon name="check-circle" className="h-3.5 w-3.5" />
      </span>
      <span>
        <span className="block text-sm font-semibold text-[var(--outly-ink)]">{title}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-[var(--outly-muted)]">
            {description}
          </span>
        ) : null}
      </span>
    </button>
  );
}
