"use client";

import Link from "next/link";
import { DifficultyBadge } from "@/components/explore/difficulty-badge";
import { EventCover } from "@/components/events/event-cover";
import { AvatarRing } from "@/components/feed/post-parts";
import { CoverImage } from "@/components/ui/cover-image";
import { Icon } from "@/components/ui/icon";
import { useExplorePhoto } from "@/lib/use-explore-photo";
import { cn } from "@/lib/utils";
import { EVENT_CATEGORY_ICONS, EVENT_CATEGORY_LABELS } from "@/types/event";
import type { OutlyEvent } from "@/types/event";

type EventCardProps = {
  event: OutlyEvent;
};

const STATUS_CLASSES: Record<OutlyEvent["status"], string> = {
  upcoming: "bg-black/55 text-white",
  completed: "bg-[#e6f4ea] text-[#1e7a3a]",
  cancelled: "bg-[#fbe1e8] text-[#b3164c]",
};

const STATUS_LABELS: Record<OutlyEvent["status"], string> = {
  upcoming: "Upcoming",
  completed: "Completed",
  cancelled: "Cancelled",
};

const MY_STATUS_LABELS = { going: "You're going", pending: "Request pending", declined: "Request declined" } as const;

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
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/**
 * An event in the Events list, laid out like a post: the organizer on top, the cover image edge to edge,
 * then the title, when and where, difficulty and how many are going. The whole card opens the event's detail
 * page (where joining and the other actions live). It shows the same event data as before; only the
 * presentation changed, and it is used by the Events list only.
 */
export function EventCard({ event }: EventCardProps) {
  const goingCount = event.goingCount;
  const photo = useExplorePhoto(event.placeId);
  const fill = event.capacity > 0 ? Math.min(100, Math.round((goingCount / event.capacity) * 100)) : 0;
  const isFull = event.capacity > 0 && goingCount >= event.capacity;

  return (
    <article className="group relative overflow-hidden rounded-[var(--radius-lg)] border border-white/10 bg-[#17121f] shadow-[var(--shadow-soft)] transition-colors duration-200 focus-within:border-white/30 hover:border-white/20 motion-reduce:transition-none">
      <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
        <Link
          href={`/people/${event.organizerId}`}
          aria-label={`${event.organizerName}'s profile`}
          className="relative z-10 rounded-full transition-opacity hover:opacity-90"
        >
          <AvatarRing name={event.organizerName} size="md" />
        </Link>
        <div className="min-w-0 flex-1 leading-tight">
          <Link
            href={`/people/${event.organizerId}`}
            className="relative z-10 block truncate text-sm font-semibold text-white transition-colors hover:text-[var(--outly-pink)]"
          >
            {event.organizerName}
          </Link>
          <p className="truncate text-xs text-[var(--outly-muted)]">Organizer</p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur", STATUS_CLASSES[event.status])}>
          {STATUS_LABELS[event.status]}
        </span>
      </div>

      <div
        className="relative aspect-[16/10] overflow-hidden"
        style={{ backgroundImage: CATEGORY_GRADIENT[event.category] }}
        role={event.coverUrl ? undefined : "img"}
        aria-label={event.coverUrl ? undefined : `${event.title} — illustrative event visual`}
      >
        {event.coverUrl ? (
          <EventCover src={event.coverUrl} alt={`Cover image for ${event.title}`} />
        ) : photo ? (
          <CoverImage src={photo} sizes="(min-width: 1024px) 38rem, 100vw" />
        ) : (
          <>
            <svg
              className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 w-full opacity-70"
              viewBox="0 0 200 60"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M0 60 20 30 40 50 60 15 85 45 110 20 140 48 165 25 200 40 200 60Z" fill="rgba(255,255,255,0.16)" />
            </svg>
            <Icon
              name={EVENT_CATEGORY_ICONS[event.category]}
              className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 text-white/25"
            />
          </>
        )}
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          <Icon name={EVENT_CATEGORY_ICONS[event.category]} className="h-3.5 w-3.5 text-[var(--outly-pink)]" />
          {EVENT_CATEGORY_LABELS[event.category]}
        </span>
        {event.myStatus ? (
          <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            <Icon name="check-circle" className="h-3.5 w-3.5 text-[var(--outly-pink)]" />
            {MY_STATUS_LABELS[event.myStatus]}
          </span>
        ) : null}
      </div>

      <div className="space-y-3 px-4 py-4 sm:px-5">
        <Link
          href={`/events/${event.id}`}
          className="block rounded-[var(--radius-sm)] after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <h3 className="text-lg font-semibold leading-snug text-white">{event.title}</h3>
        </Link>

        <ul className="space-y-1.5 text-sm text-white/80">
          <li className="flex items-center gap-2">
            <Icon name="calendar" className="h-4 w-4 shrink-0 text-[var(--outly-pink)]" />
            <span>
              {formatDate(event.startAt)} · {formatTime(event.startAt)}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <Icon name="pin" className="h-4 w-4 shrink-0 text-[var(--outly-pink)]" />
            <span className="truncate">{event.location}</span>
          </li>
        </ul>

        {event.description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-[var(--outly-muted)]">{event.description}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {event.difficulty ? <DifficultyBadge difficulty={event.difficulty} /> : null}
          {event.requiresApproval ? <span className="text-xs text-[var(--outly-muted)]">Approval required</span> : null}
        </div>

        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <Icon name="users" className="h-3.5 w-3.5 text-[var(--outly-pink)]" />
              {goingCount}/{event.capacity} going
            </span>
            {isFull ? <span className="font-semibold text-[var(--outly-pink)]">Full</span> : null}
          </div>
          <div
            role="presentation"
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"
          >
            <div className="h-full rounded-full gradient-brand" style={{ width: `${fill}%` }} />
          </div>
        </div>
      </div>
    </article>
  );
}
