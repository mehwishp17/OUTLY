import { cn } from "@/lib/utils";

type ChipButtonProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

/** Small pill toggle used for filter/option chips (Explore's
 * category/difficulty filters, activity type/privacy/status pickers). */
export function ChipButton({ active, onClick, children }: ChipButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors motion-reduce:transition-none",
        active
          ? "border-transparent text-white gradient-brand"
          : "border-[var(--outly-border)] bg-white text-[var(--outly-ink)] hover:border-[var(--outly-violet)]/60",
      )}
    >
      {children}
    </button>
  );
}
