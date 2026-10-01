import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { ACTIVITY_TYPE_ICONS, ACTIVITY_TYPE_LABELS } from "@/types/activity";
import { SKILL_LEVEL_LABELS } from "@/types/partner";
import type { PartnerRequest } from "@/types/partner";

type PartnerRequestCardProps = {
  request: PartnerRequest;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function PartnerRequestCard({ request }: PartnerRequestCardProps) {
  const acceptedCount = request.joinRequests.filter((join) => join.status === "accepted").length;

  return (
    <Link
      href={`/partner/${request.id}`}
      className="flex items-start gap-4 rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-5 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-white gradient-brand"
        aria-hidden="true"
      >
        <Icon name={ACTIVITY_TYPE_ICONS[request.activity]} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-base font-semibold text-[var(--outly-ink)]">
            {ACTIVITY_TYPE_LABELS[request.activity]} partner for {request.destination}
          </h3>
          <span
            className={
              request.status === "open"
                ? "shrink-0 rounded-full bg-[var(--outly-lavender)] px-2.5 py-1 text-xs font-semibold text-[var(--outly-purple-dark)]"
                : "shrink-0 rounded-full bg-[#e6f4ea] px-2.5 py-1 text-xs font-semibold text-[#1e7a3a]"
            }
          >
            {request.status === "open" ? "Open" : "Closed"}
          </span>
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--outly-muted)]">
          <Icon name="pin" className="h-3.5 w-3.5" />
          {request.destination}
        </p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[var(--outly-violet)]">
          {formatDate(request.preferredAt)} · {SKILL_LEVEL_LABELS[request.experienceLevel]}
        </p>
        <p className="mt-2 line-clamp-2 text-sm text-[var(--outly-muted)]">{request.description}</p>
        <p className="mt-2 text-xs text-[var(--outly-muted)]">
          {acceptedCount}/{request.spots} spots filled
        </p>
      </div>
    </Link>
  );
}
