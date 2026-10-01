/**
 * Joins class names, filtering out falsy values. Small local replacement
 * for `clsx`/`cn` helpers so we avoid adding an extra dependency for this
 * milestone.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Formats an ISO timestamp as a short relative string (e.g. "2h ago",
 * "Just now", "3d ago") for feed/comment timestamps. Falls back to a
 * short date once older than a week so the feed never shows a huge
 * number.
 */
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
