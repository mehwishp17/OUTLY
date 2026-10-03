"use client";

import { useEffect, useState } from "react";
import { UserListView } from "@/components/social-graph/user-list-view";
import { useFollowStore } from "@/context/follow-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { fetchPublicProfile } from "@/lib/api/profile";
import { resolveUserSummary } from "@/lib/user-directory";

type FollowersViewProps = {
  userId: string;
};

export function FollowersView({ userId }: FollowersViewProps) {
  const { currentUser } = useSocialStore();
  const { getFollowerIds, loadFollowLists } = useFollowStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const isSelf = userId === currentUser.id;

  useEffect(() => {
    let cancelled = false;
    void Promise.all([loadFollowLists(userId), isSelf ? Promise.resolve() : fetchPublicProfile(userId)]).then(([message]) => {
      if (cancelled) return;
      setError(message);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, isSelf, loadFollowLists]);

  const owner = resolveUserSummary(userId, currentUser);
  const followerIds = getFollowerIds(userId);
  const backHref = userId === currentUser.id ? "/profile" : `/people/${userId}`;

  return (
    <UserListView
      title="Followers"
      subtitle={owner ? `People following ${owner.isCurrentUser ? "you" : owner.name}` : "Followers"}
      userIds={followerIds}
      backHref={backHref}
      loading={loading}
      error={error}
      emptyMessage="No followers yet."
    />
  );
}
