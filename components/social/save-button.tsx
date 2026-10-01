"use client";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type SaveButtonProps = {
  saved: boolean;
  onToggle: () => void;
};

/** Save/unsave toggle. Reflects state via `aria-pressed` and the filled
 * vs. outline bookmark icon. */
export function SaveButton({ saved, onToggle }: SaveButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved places" : "Save this post"}
      onClick={onToggle}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100",
        saved
          ? "text-[var(--outly-violet)]"
          : "text-[var(--outly-muted)] hover:bg-[var(--outly-lavender)] hover:text-[var(--outly-violet)]",
      )}
    >
      <Icon name={saved ? "bookmark-filled" : "bookmark"} className="h-4.5 w-4.5" />
    </button>
  );
}
