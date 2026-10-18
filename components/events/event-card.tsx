"use client";

import Link from "next/link";
import { DifficultyBadge } from "@/components/explore/difficulty-badge";
import { EventCover } from "@/components/events/event-cover";
import { CoverImage } from "@/components/ui/cover-image";
import { Icon } from "@/components/ui/icon";
import { useExplorePhoto } from "@/lib/use-explore-photo";
import { EVENT_CATEGORY_ICONS, EVENT_CATEGORY_LABELS } from "@/types/event";
import type { OutlyEvent } from "@/types/event";

type EventCardProps = {
  event: OutlyEvent;
};

const STATUS_CLASSES: Record<OutlyEvent["status"], string> = {
  upcoming: "bg-[var(--outly-lavender)] text-[var(--outly-purple-dark)]",
  completed: "bg-[#e6f4ea] text-[#1e7a3a]",
  cancelled: "bg-[#fbe1e8] text-[#b3164c]",
};

const STATUS_LABELS: Record<OutlyEvent["status"], string> = {
  upcoming: "Upcoming",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Deterministic decorative cover gradient per category — same
 * CSS-gradient-only visual language as Explore/Groups, no fabricated
 * photo data required. */
const CATEGORY_GRADIENT: Record<OutlyEvent["category"], string> = {
  hike: "linear-gradient(135deg, #351080, #7c3aed)",
  "trail-run": "linear-gradient(135deg, #7c3aed, #ec4899)",
  cycling: "linear-gradient(135deg, #5b21b6, #f6339a)",
  camping: "linear-gradient(135deg, #351080, #ec4899)",
  meetup: "linear-gradient(135deg, #5b21b6, #7c3aed)",
  cleanup: "linear-gradient(135deg, #7c3aed, #5b21b6)",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function EventCard({ event }: EventCardProps) {
  const goingCount = event.goingCount;
  const photo = useExplorePhoto(event.placeId);

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block overflow-hidden rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div
        className="relative flex h-32 items-end overflow-hidden p-4 sm:h-40"
        style={{ backgroundImage: CATEGORY_GRADIENT[event.category] }}
        role={event.coverUrl ? undefined : "img"}
        aria-label={event.coverUrl ? undefined : `${event.title} — illustrative event visual`}
      >
        {event.coverUrl ? (
          <EventCover src={event.coverUrl} alt={`Cover image for ${event.title}`} />
        ) : photo ? (
          <CoverImage src={photo} sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" />
        ) : null}
        <span className="relative flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
          <Icon name={EVENT_CATEGORY_ICONS[event.category]} className="h-3.5 w-3.5" />
          {EVENT_CATEGORY_LABELS[event.category]}
        </span>
        <span
          className={`absolute right-3 top-3 shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[event.status]}`}
        >
          {STATUS_LABELS[event.status]}
        </span>
      </div>
      <div className="flex items-start gap-4 p-5">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-[var(--outly-ink)]">{event.title}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--outly-muted)]">
            <Icon name="pin" className="h-3.5 w-3.5" />
            {event.location}
          </p>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[var(--outly-violet)]">
            {formatDate(event.startAt)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {event.difficulty ? <DifficultyBadge difficulty={event.difficulty} /> : null}
            <span className="text-xs text-[var(--outly-muted)]">
              {goingCount}/{event.capacity} going
            </span>
            {event.requiresApproval ? (
              <span className="text-xs text-[var(--outly-muted)]">· Approval required</span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
