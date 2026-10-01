import { cn } from "@/lib/utils";

type LoadingSpinnerProps = {
  className?: string;
};

/**
 * Small spinning ring used inside buttons/panels to indicate a pending
 * mock request. Purely decorative — the surrounding button/text already
 * communicates the loading state to assistive technology (e.g. changed
 * button text such as "Logging in…"), so this is `aria-hidden`.
 */
export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none",
        className,
      )}
    />
  );
}
