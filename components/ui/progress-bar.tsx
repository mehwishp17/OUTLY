type ProgressBarProps = {
  value: number;
  max: number;
  label: string;
};

/** Simple horizontal progress indicator — used for badge progress
 * toward its target. `label` is the accessible name announced by
 * assistive tech (e.g. "3 of 10 hikes"). */
export function ProgressBar({ value, max, label }: ProgressBarProps) {
  const ratio = max <= 0 ? 1 : Math.min(1, value / max);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.min(value, max)}
      aria-valuemin={0}
      aria-valuemax={max}
      className="h-2 w-full overflow-hidden rounded-full bg-[var(--outly-lavender)]"
    >
      <div
        className="h-full rounded-full gradient-brand transition-[width] duration-300 motion-reduce:transition-none"
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}
