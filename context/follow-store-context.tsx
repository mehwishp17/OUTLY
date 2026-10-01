"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { MOCK_FOLLOW_EDGES } from "@/lib/mock/mock-follow-graph";
import type { FollowEdge } from "@/lib/mock/mock-follow-graph";
import { useSocialStore } from "@/context/social-store-context";

type FollowStoreValue = {
  isFollowing: (targetId: string) => boolean;
  follow: (targetId: string) => void;
  unfollow: (targetId: string) => void;
  getFollowerIds: (userId: string) => string[];
  getFollowingIds: (userId: string) => string[];
};

const FollowStoreContext = createContext<FollowStoreValue | null>(null);

/**
 * Session-only mock "backend" for the Social Graph module (Followers,
 * Following, Follow/Unfollow). Only the current mock user can actually
 * follow/unfollow through the UI — every other edge is static seed data
 * used to populate follower/following counts and lists. Nothing here
 * persists beyond the current browser session.
 */
export function FollowStoreProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useSocialStore();
  const [edges, setEdges] = useState<FollowEdge[]>(MOCK_FOLLOW_EDGES);

  const isFollowing = useCallback(
    (targetId: string) =>
      edges.some((edge) => edge.followerId === currentUser.id && edge.followingId === targetId),
    [edges, currentUser.id],
  );

  const follow = useCallback(
    (targetId: string) => {
      setEdges((current) =>
        current.some((edge) => edge.followerId === currentUser.id && edge.followingId === targetId)
          ? current
          : [...current, { followerId: currentUser.id, followingId: targetId }],
      );
    },
    [currentUser.id],
  );

  const unfollow = useCallback(
    (targetId: string) => {
      setEdges((current) =>
        current.filter(
          (edge) => !(edge.followerId === currentUser.id && edge.followingId === targetId),
        ),
      );
    },
    [currentUser.id],
  );

  const getFollowerIds = useCallback(
    (userId: string) => edges.filter((edge) => edge.followingId === userId).map((edge) => edge.followerId),
    [edges],
  );

  const getFollowingIds = useCallback(
    (userId: string) => edges.filter((edge) => edge.followerId === userId).map((edge) => edge.followingId),
    [edges],
  );

  const value = useMemo<FollowStoreValue>(
    () => ({ isFollowing, follow, unfollow, getFollowerIds, getFollowingIds }),
    [isFollowing, follow, unfollow, getFollowerIds, getFollowingIds],
  );

  return <FollowStoreContext.Provider value={value}>{children}</FollowStoreContext.Provider>;
}

export function useFollowStore(): FollowStoreValue {
  const context = useContext(FollowStoreContext);
  if (!context) {
    throw new Error("useFollowStore must be used within a FollowStoreProvider");
  }
  return context;
}
