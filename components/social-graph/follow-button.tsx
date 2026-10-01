"use client";

import { Button } from "@/components/ui/button";
import { useFollowStore } from "@/context/follow-store-context";

type FollowButtonProps = {
  userId: string;
  size?: "md" | "lg";
};

/** Follow/unfollow toggle, reused across User Search, Public Profile,
 * and the Followers/Following lists. Renders nothing for the current
 * user's own id — you can't follow yourself. */
export function FollowButton({ userId, size = "md" }: FollowButtonProps) {
  const { isFollowing, follow, unfollow } = useFollowStore();
  const following = isFollowing(userId);

  return (
    <Button
      size={size}
      variant={following ? "secondary" : "primary"}
      onClick={() => (following ? unfollow(userId) : follow(userId))}
      aria-label={following ? "Unfollow" : "Follow"}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}
