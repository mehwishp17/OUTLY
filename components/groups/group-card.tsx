import Link from "next/link";
import { CoverImage } from "@/components/ui/cover-image";
import { Icon } from "@/components/ui/icon";
import type { Group } from "@/types/group";

type GroupCardProps = {
  group: Group;
};

export function GroupCard({ group }: GroupCardProps) {
  return (
    <Link
      href={`/groups/${group.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div
        className="relative flex h-28 items-end overflow-hidden p-4 sm:h-32"
        style={{ backgroundImage: group.gradient }}
        role="img"
        aria-label={`${group.name} — illustrative visual`}
      >
        {group.imageUrl ? (
          <CoverImage src={group.imageUrl} sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" />
        ) : null}
        <span className="relative flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
          <Icon name={group.visibility === "private" ? "shield-check" : "compass"} className="h-3.5 w-3.5" />
          {group.visibility === "private" ? "Private" : "Public"}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-lg font-semibold text-[var(--outly-ink)]">{group.name}</h3>
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--outly-violet)]">
          {group.category}
        </p>
        <p className="flex-1 text-sm leading-relaxed text-[var(--outly-muted)]">
          {group.description}
        </p>
        <p className="flex items-center gap-1 text-xs text-[var(--outly-muted)]">
          <Icon name="compass" className="h-3.5 w-3.5" />
          {group.memberCount} member{group.memberCount === 1 ? "" : "s"}
        </p>
      </div>
    </Link>
  );
}
