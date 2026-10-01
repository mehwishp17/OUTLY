import { LoadingSpinner } from "@/components/ui/loading-spinner";

type LoadingStateProps = {
  message?: string;
  className?: string;
};

/** Full-panel loading placeholder — one of the reusable states named in
 * the frontend component architecture (alongside `EmptyState` and
 * `ErrorState`). Used where a screen has a real (if brief) "connecting"
 * step, such as opening a chat conversation. */
export function LoadingState({ message = "Loading…", className }: LoadingStateProps) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-3 px-5 py-16 text-center text-sm text-[var(--outly-muted)] ${className ?? ""}`}
    >
      <LoadingSpinner className="h-6 w-6 text-[var(--outly-violet)]" />
      <span>{message}</span>
    </div>
  );
}
