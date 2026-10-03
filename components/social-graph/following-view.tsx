"use client";

import { useEffect, useState } from "react";
import { UserListView } from "@/components/social-graph/user-list-view";
import { useFollowStore } from "@/context/follow-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { fetchPublicProfile } from "@/lib/api/profile";
import { resolveUserSummary } from "@/lib/user-directory";

type FollowingViewProps = {
  userId: string;
};

export function FollowingView({ userId }: FollowingViewProps) {
  const { currentUser } = useSocialStore();
  const { getFollowingIds, loadFollowLists } = useFollowStore();
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
  const followingIds = getFollowingIds(userId);
  const backHref = userId === currentUser.id ? "/profile" : `/people/${userId}`;

  return (
    <UserListView
      title="Following"
      subtitle={owner ? `People ${owner.isCurrentUser ? "you follow" : `${owner.name} follows`}` : "Following"}
      userIds={followingIds}
      backHref={backHref}
      loading={loading}
      error={error}
      emptyMessage="Not following anyone yet."
    />
  );
}
