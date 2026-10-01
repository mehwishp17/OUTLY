import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/components/ui/icon";

type StatTileProps = {
  label: string;
  value: number | string;
  icon: IconName;
  href?: string;
};

/** Single-metric stat tile for the Admin Dashboard and Analytics
 * screens. A headline number is the right form here — there's no
 * multi-series comparison to encode, so this stays a plain tile rather
 * than a chart. */
export function StatTile({ label, value, icon, href }: StatTileProps) {
  const content = (
    <>
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white gradient-brand"
        aria-hidden="true"
      >
        <Icon name={icon} className="h-4.5 w-4.5" />
      </span>
      <div>
        <p className="text-2xl font-bold text-[var(--outly-purple-dark)]">{value}</p>
        <p className="text-xs font-medium text-[var(--outly-muted)]">{label}</p>
      </div>
    </>
  );

  const className =
    "flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-5 shadow-[var(--shadow-soft)]";

  return href ? (
    <Link
      href={href}
      className={`${className} transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--outly-violet)]/60 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none motion-reduce:hover:translate-y-0`}
    >
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
