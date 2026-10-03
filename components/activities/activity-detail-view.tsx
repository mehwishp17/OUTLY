"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DifficultyBadge } from "@/components/explore/difficulty-badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { LoadingState } from "@/components/ui/loading-state";
import { Icon } from "@/components/ui/icon";
import { useActivityStore } from "@/context/activity-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { displayPerson } from "@/lib/user-directory";
import { fetchExploreItem } from "@/lib/api/places";
import type { ExplorePlace } from "@/types/place";
import { ACTIVITY_PRIVACY_LABELS, ACTIVITY_TYPE_ICONS, ACTIVITY_TYPE_LABELS } from "@/types/activity";

type ActivityDetailViewProps = {
  activityId: string;
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ActivityDetailView({ activityId }: ActivityDetailViewProps) {
  const router = useRouter();
  const { currentUser } = useSocialStore();
  const { getActivityById, deleteActivity, toggleParticipation, loadActivity } = useActivityStore();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [actionError, setActionError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [linked, setLinked] = useState<{ key: string; place?: ExplorePlace }>();
  const activity = getActivityById(activityId);
  const linkedKey = activity?.placeId;
  const linkedPlace = linked && linked.key === linkedKey ? linked.place : undefined;

  useEffect(() => {
    let cancelled = false;
    void loadActivity(activityId).then(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [activityId, loadActivity]);

  // The place or trail this activity is linked to (key like "place-3" or "trail-5").
  useEffect(() => {
    if (!linkedKey) return;
    const [kind, id] = linkedKey.split("-");
    let cancelled = false;
    void fetchExploreItem(kind === "trail" ? "trail" : "place", id).then((result) => {
      if (!cancelled) setLinked({ key: linkedKey, place: result.ok ? result.data : undefined });
    });
    return () => {
      cancelled = true;
    };
  }, [linkedKey]);

  if (!activity && loading) return <LoadingState message="Loading activity…" />;

  if (!activity) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-bold text-[var(--outly-ink)]">Activity not found</h1>
        <p className="text-sm text-[var(--outly-muted)]">
          This activity may have been removed, or the link is incorrect.
        </p>
        <Link
          href="/activities"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          Back to activities
        </Link>
      </div>
    );
  }

  const isCreator = activity.creatorId === currentUser.id;
  const isParticipant = activity.participants.some((p) => p.id === currentUser.id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <Link
        href="/activities"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
      >
        <Icon name="chevron-left" className="h-4 w-4" />
        Back to activities
      </Link>

      <div className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-white gradient-brand"
              aria-hidden="true"
            >
              <Icon name={ACTIVITY_TYPE_ICONS[activity.type]} className="h-5.5 w-5.5" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-2xl">
                {activity.title}
              </h1>
              <p className="text-sm text-[var(--outly-muted)]">
                {ACTIVITY_TYPE_LABELS[activity.type]} · Organized by {isCreator ? currentUser.name || "You" : activity.creatorName}
              </p>
            </div>
          </div>

          {isCreator ? (
            <DropdownMenu
              triggerLabel="Activity actions"
              items={[
                { label: "Edit activity", onSelect: () => router.push(`/activities/${activity.id}/edit`) },
                {
                  label: "Delete activity",
                  destructive: true,
                  onSelect: () => setConfirmingDelete(true),
                },
              ]}
            />
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span
            className={
              activity.status === "completed"
                ? "rounded-full bg-[#e6f4ea] px-2.5 py-1 text-xs font-semibold text-[#1e7a3a]"
                : "rounded-full bg-[var(--outly-lavender)] px-2.5 py-1 text-xs font-semibold text-[var(--outly-purple-dark)]"
            }
          >
            {activity.status === "completed" ? "Completed" : "Upcoming"}
          </span>
          {activity.difficulty ? <DifficultyBadge difficulty={activity.difficulty} /> : null}
          <span className="text-xs text-[var(--outly-muted)]">
            {ACTIVITY_PRIVACY_LABELS[activity.privacy]}
          </span>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
              When
            </dt>
            {/* Locale/timezone differ between server and browser. */}
            <dd suppressHydrationWarning className="mt-1 text-sm text-[var(--outly-ink)]">{formatDateTime(activity.startAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
              Where
            </dt>
            <dd className="mt-1 flex items-center gap-1 text-sm text-[var(--outly-ink)]">
              <Icon name="pin" className="h-3.5 w-3.5 text-[var(--outly-violet)]" />
              {activity.location}
            </dd>
          </div>
          {activity.distanceKm ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
                Distance
              </dt>
              <dd className="mt-1 text-sm text-[var(--outly-ink)]">{activity.distanceKm} km</dd>
            </div>
          ) : null}
          {activity.durationLabel ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
                Duration
              </dt>
              <dd className="mt-1 text-sm text-[var(--outly-ink)]">{activity.durationLabel}</dd>
            </div>
          ) : null}
        </dl>

        {linkedPlace ? (
          <Link
            href={linkedPlace.kind === "trail" ? `/explore/trails/${linkedPlace.id}` : `/explore/places/${linkedPlace.id}`}
            className="mt-5 flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--outly-border)] bg-[var(--outly-lavender)] px-4 py-3 text-sm font-semibold text-[var(--outly-purple-dark)] transition-colors hover:border-[var(--outly-violet)]/60"
          >
            <Icon name="map" className="h-4 w-4" />
            View {linkedPlace.name} on Explore
            <Icon name="arrow-right" className="ml-auto h-4 w-4" />
          </Link>
        ) : null}

        {activity.notes ? (
          <p className="mt-5 text-sm leading-relaxed text-[var(--outly-ink)]">{activity.notes}</p>
        ) : null}

        <div className="mt-6 border-t border-[var(--outly-border)] pt-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
            Participants ({activity.participantCount})
          </h2>
          <ul className="mt-3 flex flex-wrap gap-3">
            {activity.participants.map((participant) => (
              <li key={participant.id} className="flex items-center gap-2">
                <Avatar name={displayPerson(participant, currentUser).name} avatarUrl={displayPerson(participant, currentUser).avatarUrl} size="sm" />
                <span className="text-sm text-[var(--outly-ink)]">{displayPerson(participant, currentUser).name}</span>
              </li>
            ))}
          </ul>

          {!isCreator && activity.status === "planned" ? (
            <Button
              variant={isParticipant ? "secondary" : "primary"}
              className="mt-5"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setActionError(undefined);
                const error = await toggleParticipation(activity.id);
                setBusy(false);
                if (error) setActionError(error);
              }}
            >
              {isParticipant ? "Leave activity" : "Join activity"}
            </Button>
          ) : null}
          {actionError ? (
            <p role="alert" className="mt-3 text-sm text-[#B3164C]">
              {actionError}
            </p>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this activity?"
        description="This can't be undone."
        onConfirm={async () => {
          const error = await deleteActivity(activity.id);
          setConfirmingDelete(false);
          if (error) {
            setActionError(error);
            return;
          }
          router.push("/activities");
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
