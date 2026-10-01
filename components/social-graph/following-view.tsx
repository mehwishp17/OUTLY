"use client";

import { UserListView } from "@/components/social-graph/user-list-view";
import { useFollowStore } from "@/context/follow-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { resolveUserSummary } from "@/lib/user-directory";

type FollowingViewProps = {
  userId: string;
};

export function FollowingView({ userId }: FollowingViewProps) {
  const { currentUser } = useSocialStore();
  const { getFollowingIds } = useFollowStore();
  const owner = resolveUserSummary(userId, currentUser);
  const followingIds = getFollowingIds(userId);
  const backHref = userId === currentUser.id ? "/profile" : `/people/${userId}`;

  return (
    <UserListView
      title="Following"
      subtitle={owner ? `People ${owner.isCurrentUser ? "you follow" : `${owner.name} follows`}` : "Following"}
      userIds={followingIds}
      backHref={backHref}
      emptyMessage="Not following anyone yet."
    />
  );
}
