import Link from "next/link";

export type ProfileStatItem = {
  label: string;
  value: number;
  /** When set, the whole cell links out (e.g. to Followers/Following). */
  href?: string;
};

type ProfileStatsProps = {
  stats: ProfileStatItem[];
};

const GRID_CLASS_BY_COUNT: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-5",
};

/** Row of summary counts shown just below a profile header — used on
 * both the current user's own profile (`/profile`) and other users'
 * Public Profile (`/people/[userId]`), with a different `stats` list for
 * each. */
export function ProfileStats({ stats }: ProfileStatsProps) {
  const gridClass = GRID_CLASS_BY_COUNT[stats.length] ?? "grid-cols-3";

  return (
    <dl
      className={`grid ${gridClass} divide-x divide-y divide-[var(--outly-border)] rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white shadow-[var(--shadow-soft)] sm:divide-y-0`}
    >
      {stats.map((stat) => {
        const content = (
          <>
            <dt className="order-2 text-xs font-medium text-[var(--outly-muted)]">{stat.label}</dt>
            <dd className="order-1 text-2xl font-bold text-[var(--outly-purple-dark)]">{stat.value}</dd>
          </>
        );

        return stat.href ? (
          <Link
            key={stat.label}
            href={stat.href}
            className="flex flex-col items-center gap-1 px-2 py-5 text-center transition-colors hover:bg-[var(--outly-lavender)]"
          >
            {content}
          </Link>
        ) : (
          <div key={stat.label} className="flex flex-col items-center gap-1 px-2 py-5 text-center">
            {content}
          </div>
        );
      })}
    </dl>
  );
}
