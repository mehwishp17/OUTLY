"use client";

import Link from "next/link";
import { DifficultyBadge } from "@/components/explore/difficulty-badge";
import { PostMedia } from "@/components/feed/post-media";
import { AvatarRing } from "@/components/feed/post-parts";
import { CoverImage } from "@/components/ui/cover-image";
import { Icon } from "@/components/ui/icon";
import { useExplorePhoto } from "@/lib/use-explore-photo";
import { cn } from "@/lib/utils";
import { ACTIVITY_PRIVACY_LABELS, ACTIVITY_TYPE_ICONS, ACTIVITY_TYPE_LABELS } from "@/types/activity";
import type { Activity, ActivityKind } from "@/types/activity";

type ActivityCardProps = {
  activity: Activity;
};

/** Decorative banner colour per activity type, used when the activity has no linked place photo. */
const TYPE_GRADIENT: Record<ActivityKind, string> = {
  hike: "linear-gradient(135deg, #351080, #7c3aed)",
  "trail-run": "linear-gradient(135deg, #7c3aed, #ec4899)",
  cycling: "linear-gradient(135deg, #5b21b6, #f6339a)",
  camping: "linear-gradient(135deg, #351080, #ec4899)",
  meetup: "linear-gradient(135deg, #5b21b6, #7c3aed)",
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
 * An activity in the Activities list, laid out like a post: who planned it on top, a banner (the linked
 * place's photo when there is one, otherwise a type-coloured banner with the type icon), then the title,
 * when and where, the numbers it has, and the participant count. The whole card opens the activity's
 * page. Only data the activity really has is shown; used by the Activities list only.
 */
export function ActivityCard({ activity }: ActivityCardProps) {
  const photo = useExplorePhoto(activity.placeId);
  const completed = activity.status === "completed";
  const facts = [
    activity.distanceKm !== undefined ? `${activity.distanceKm} km` : undefined,
    activity.durationLabel || undefined,
  ].filter(Boolean);

  return (
    <article className="group relative overflow-hidden rounded-[var(--radius-lg)] border border-white/10 bg-[#17121f] shadow-[var(--shadow-soft)] transition-colors duration-200 focus-within:border-white/30 hover:border-white/20 motion-reduce:transition-none">
      <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
        <Link
          href={`/people/${activity.creatorId}`}
          aria-label={`${activity.creatorName}'s profile`}
          className="relative z-10 rounded-full transition-opacity hover:opacity-90"
        >
          <AvatarRing name={activity.creatorName} size="md" />
        </Link>
        <div className="min-w-0 flex-1 leading-tight">
          <Link
            href={`/people/${activity.creatorId}`}
            className="relative z-10 block truncate text-sm font-semibold text-white transition-colors hover:text-[var(--outly-pink)]"
          >
            {activity.creatorName}
          </Link>
          <p className="truncate text-xs text-[var(--outly-muted)]">Planned this activity</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
            completed ? "bg-[#e6f4ea] text-[#1e7a3a]" : "bg-black/55 text-white",
          )}
        >
          {completed ? "Completed" : "Upcoming"}
        </span>
      </div>

      {activity.coverUrl ? (
        // The creator's own cover image: shown whole (not cropped) over a soft backdrop.
        <div className="relative">
          <PostMedia images={[activity.coverUrl]} alt={`Cover image for ${activity.title}`} />
          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            <Icon name={ACTIVITY_TYPE_ICONS[activity.type]} className="h-3.5 w-3.5 text-[var(--outly-pink)]" />
            {ACTIVITY_TYPE_LABELS[activity.type]}
          </span>
        </div>
      ) : (
      <div
        className="relative aspect-[16/7] overflow-hidden"
        style={{ backgroundImage: TYPE_GRADIENT[activity.type] }}
        role={photo ? undefined : "img"}
        aria-label={photo ? undefined : `${ACTIVITY_TYPE_LABELS[activity.type]} activity`}
      >
        {photo ? (
          <CoverImage src={photo} sizes="(min-width: 1024px) 38rem, 100vw" />
        ) : (
          <>
            <svg
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 w-full opacity-70"
              viewBox="0 0 200 60"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M0 60 20 30 40 50 60 15 85 45 110 20 140 48 165 25 200 40 200 60Z" fill="rgba(255,255,255,0.16)" />
            </svg>
            <Icon
              name={ACTIVITY_TYPE_ICONS[activity.type]}
              className="pointer-events-none absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 text-white/25"
            />
          </>
        )}
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          <Icon name={ACTIVITY_TYPE_ICONS[activity.type]} className="h-3.5 w-3.5 text-[var(--outly-pink)]" />
          {ACTIVITY_TYPE_LABELS[activity.type]}
        </span>
      </div>
      )}

      <div className="space-y-3 px-4 py-4 sm:px-5">
        <Link
          href={`/activities/${activity.id}`}
          className="block rounded-[var(--radius-sm)] after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <h3 className="text-lg font-semibold leading-snug text-white">{activity.title}</h3>
        </Link>

        <ul className="space-y-1.5 text-sm text-white/80">
          <li className="flex items-center gap-2">
            <Icon name="calendar" className="h-4 w-4 shrink-0 text-[var(--outly-pink)]" />
            <span>
              {formatDate(activity.startAt)} · {formatTime(activity.startAt)}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <Icon name="pin" className="h-4 w-4 shrink-0 text-[var(--outly-pink)]" />
            <span className="truncate">{activity.location}</span>
          </li>
        </ul>

        {activity.notes ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-[var(--outly-muted)]">{activity.notes}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {activity.difficulty ? <DifficultyBadge difficulty={activity.difficulty} /> : null}
          {facts.length > 0 ? <span className="text-xs text-white/75">{facts.join(" · ")}</span> : null}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs">
          <span className="flex items-center gap-1.5 font-semibold text-white">
            <Icon name="users" className="h-3.5 w-3.5 text-[var(--outly-pink)]" />
            {activity.participantCount} participant{activity.participantCount === 1 ? "" : "s"}
          </span>
          <span className="text-[var(--outly-muted)]">{ACTIVITY_PRIVACY_LABELS[activity.privacy]}</span>
        </div>
      </div>
    </article>
  );
}
