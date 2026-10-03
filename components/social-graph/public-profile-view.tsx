"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FollowButton } from "@/components/social-graph/follow-button";
import { ProfileStats } from "@/components/profile/profile-stats";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { ReportDialog } from "@/components/ui/report-dialog";
import { useAdminStore } from "@/context/admin-store-context";
import { useChatStore } from "@/context/chat-store-context";
import { useFollowStore } from "@/context/follow-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { fetchPublicProfile } from "@/lib/api/profile";
import type { PublicProfile } from "@/lib/api/profile";
import { resolveUserSummary } from "@/lib/user-directory";
import type { ReportReason } from "@/types/report";

const SKILL_LABELS: Record<string, string> = {
  beginner: "Beginner explorer",
  intermediate: "Intermediate explorer",
  advanced: "Advanced explorer",
};

type PublicProfileViewProps = {
  userId: string;
};

/** Public Profile screen for any user besides the current one — the
 * current user's own profile still lives at `/profile`, so this redirects
 * there if `userId` matches. Shares `ProfileStats`, `Avatar`, and `Badge`
 * with the "own profile" screen rather than duplicating that layout. */
export function PublicProfileView({ userId }: PublicProfileViewProps) {
  const router = useRouter();
  const { currentUser } = useSocialStore();
  const { getFollowerIds, getFollowingIds, loadFollowLists } = useFollowStore();
  const { startDirectConversation } = useChatStore();
  const { createReport } = useAdminStore();
  const [reportingUser, setReportingUser] = useState(false);
  const [actionError, setActionError] = useState<string>();
  const [profile, setProfile] = useState<PublicProfile>();
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const user = resolveUserSummary(userId, currentUser);
  const isSelf = userId === currentUser.id;

  useEffect(() => {
    if (isSelf) router.replace("/profile");
  }, [isSelf, router]);

  useEffect(() => {
    if (isSelf) return;
    let cancelled = false;
    void fetchPublicProfile(userId).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setProfile(result.data);
        setStatus("ready");
        if (!result.data.is_restricted) void loadFollowLists(userId);
      } else {
        setStatus(result.status === 404 ? "missing" : "error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId, isSelf, loadFollowLists]);

  if (isSelf) return null;

  if (status === "loading") return <LoadingState message="Loading profile…" />;

  if (!user || status !== "ready") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-bold text-[var(--outly-ink)]">
          {status === "error" ? "We couldn't load this profile" : "Profile not found"}
        </h1>
        <p className="text-sm text-[var(--outly-muted)]">
          {status === "error"
            ? "Please check your connection and try again."
            : "This person may not exist, or the link is incorrect."}
        </p>
        <Link
          href="/people"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          Back to search
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <Link
        href="/people"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
      >
        <Icon name="chevron-left" className="h-4 w-4" />
        Back to search
      </Link>

      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white shadow-[var(--shadow-soft)]">
        <div className="h-28 w-full gradient-brand sm:h-36" aria-hidden="true" />
        <div className="flex flex-col gap-4 px-5 pb-6 sm:flex-row sm:items-end sm:justify-between sm:px-8">
          <div className="-mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:gap-5">
            <Avatar
              name={user.name}
              avatarUrl={user.avatarUrl}
              size="xl"
              className="border-4 border-white shadow-[var(--shadow-elevated)]"
            />
            <div className="pt-2 sm:pb-1">
              <h1 className="text-xl font-bold text-[var(--outly-ink)] sm:text-2xl">{user.name}</h1>
              <p className="text-sm font-medium text-[var(--outly-muted)]">@{user.username}</p>
              {user.location ? (
                <p className="mt-1 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-[var(--outly-violet)]">
                  <Icon name="pin" className="h-3.5 w-3.5" />
                  {user.location}
                </p>
              ) : null}
              {profile && !profile.is_restricted ? (
                <Badge variant="solid" className="mt-2">
                  {SKILL_LABELS[user.skillLevel]}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="flex gap-2 pt-2 sm:pt-0">
            <Button
              variant="secondary"
              size="lg"
              onClick={async () => {
                setActionError(undefined);
                const result = await startDirectConversation(user.id);
                if (result.error || !result.id) setActionError(result.error);
                else router.push(`/chat/${result.id}`);
              }}
            >
              <Icon name="message-circle" className="h-4 w-4" />
              Message
            </Button>
            <FollowButton userId={user.id} size="lg" />
            <DropdownMenu
              triggerLabel="Profile actions"
              items={[{ label: "Report user", destructive: true, onSelect: () => setReportingUser(true) }]}
            />
          </div>
        </div>
      </section>

      {actionError ? (
        <p role="alert" className="text-sm text-[#B3164C]">
          {actionError}
        </p>
      ) : null}

      {profile && !profile.is_restricted ? (
        <ProfileStats
          stats={[
            {
              label: "Followers",
              value: Math.max(getFollowerIds(user.id).length, profile.stats?.followers ?? 0),
              href: `/people/${user.id}/followers`,
            },
            {
              label: "Following",
              value: Math.max(getFollowingIds(user.id).length, profile.stats?.following ?? 0),
              href: `/people/${user.id}/following`,
            },
          ]}
        />
      ) : null}

      <section className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-8">
        {profile?.is_restricted ? (
          <p className="text-sm text-[var(--outly-muted)]">
            This explorer keeps their profile private. Follow them to see more.
          </p>
        ) : user.bio ? (
          <p className="text-sm leading-relaxed text-[var(--outly-ink)]">{user.bio}</p>
        ) : (
          <p className="text-sm text-[var(--outly-muted)]">This explorer hasn&apos;t added a bio yet.</p>
        )}

        {user.interests.length > 0 ? (
          <div className="mt-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
              Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full border border-[var(--outly-border)] bg-[var(--outly-lavender)] px-3 py-1 text-xs font-medium text-[var(--outly-ink)]"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <ReportDialog
        open={reportingUser}
        targetLabel={user.name}
        onSubmit={async (reportReason: ReportReason, description) => {
          const error = await createReport({
            targetType: "user",
            targetId: user.id,
            reason: reportReason,
            description,
          });
          setReportingUser(false);
          setActionError(error ?? undefined);
        }}
        onCancel={() => setReportingUser(false)}
      />
    </div>
  );
}
