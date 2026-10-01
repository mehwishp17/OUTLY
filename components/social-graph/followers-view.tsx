"use client";

import { UserListView } from "@/components/social-graph/user-list-view";
import { useFollowStore } from "@/context/follow-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { resolveUserSummary } from "@/lib/user-directory";

type FollowersViewProps = {
  userId: string;
};

export function FollowersView({ userId }: FollowersViewProps) {
  const { currentUser } = useSocialStore();
  const { getFollowerIds } = useFollowStore();
  const owner = resolveUserSummary(userId, currentUser);
  const followerIds = getFollowerIds(userId);
  const backHref = userId === currentUser.id ? "/profile" : `/people/${userId}`;

  return (
    <UserListView
      title="Followers"
      subtitle={owner ? `People following ${owner.isCurrentUser ? "you" : owner.name}` : "Followers"}
      userIds={followerIds}
      backHref={backHref}
      emptyMessage="No followers yet."
    />
  );
}
