"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useSocialStore } from "@/context/social-store-context";
import { fetchFollowerIds, fetchFollowingIds, followRequest, unfollowRequest } from "@/lib/api/follows";

type FollowLists = { followers?: string[]; following?: string[] };

type FollowStoreValue = {
  isFollowing: (targetId: string) => boolean;
  /** True while a follow request to a private account awaits approval. */
  isPending: (targetId: string) => boolean;
  /** Optimistic: the UI updates at once and rolls back if the backend refuses. */
  follow: (targetId: string) => void;
  unfollow: (targetId: string) => void;
  /** Loaded lists only — call `loadFollowLists(userId)` first (they are empty until then). */
  getFollowerIds: (userId: string) => string[];
  getFollowingIds: (userId: string) => string[];
  /** Fetches both lists for `userId` from the backend. Resolves with an error message on failure. */
  loadFollowLists: (userId: string) => Promise<string | undefined>;
};

const FollowStoreContext = createContext<FollowStoreValue | null>(null);

/**
 * Social Graph state (Followers, Following, Follow/Unfollow), backed by the
 * OUTLY backend (`lib/api/follows.ts`). The signed-in user's own "following"
 * set is loaded automatically; any other person's lists load on demand.
 */
export function FollowStoreProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useSocialStore();
  const meId = currentUser.id;
  const [lists, setLists] = useState<Record<string, FollowLists>>({});
  const [pending, setPending] = useState<Set<string>>(new Set());

  const setUserLists = useCallback((userId: string, change: (current: FollowLists) => FollowLists) => {
    setLists((current) => ({ ...current, [userId]: change(current[userId] ?? {}) }));
  }, []);

  const loadFollowLists = useCallback(
    async (userId: string): Promise<string | undefined> => {
      const [followers, following] = await Promise.all([fetchFollowerIds(userId), fetchFollowingIds(userId)]);
      if (!followers.ok) return followers.message;
      if (!following.ok) return following.message;
      setUserLists(userId, () => ({ followers: followers.data, following: following.data }));
      return undefined;
    },
    [setUserLists],
  );

  // Who the signed-in user follows drives every Follow button, so load it up front.
  useEffect(() => {
    if (!meId) return;
    void fetchFollowingIds(meId).then((result) => {
      if (result.ok) setUserLists(meId, (current) => ({ ...current, following: result.data }));
    });
  }, [meId, setUserLists]);

  const isFollowing = useCallback(
    (targetId: string) => Boolean(meId) && (lists[meId]?.following ?? []).includes(targetId),
    [lists, meId],
  );

  const isPending = useCallback((targetId: string) => pending.has(targetId), [pending]);

  const follow = useCallback(
    (targetId: string) => {
      if (!meId || targetId === meId) return;
      const apply = (add: boolean) => {
        setUserLists(meId, (current) => ({
          ...current,
          following: add
            ? [...new Set([...(current.following ?? []), targetId])]
            : (current.following ?? []).filter((id) => id !== targetId),
        }));
        setUserLists(targetId, (current) => ({
          ...current,
          followers: current.followers
            ? add
              ? [...new Set([...current.followers, meId])]
              : current.followers.filter((id) => id !== meId)
            : current.followers,
        }));
      };
      apply(true);
      void followRequest(targetId).then((result) => {
        if (!result.ok) {
          apply(false);
        } else if (result.data.status === "PENDING") {
          // The account approves followers: not following yet, just requested.
          apply(false);
          setPending((current) => new Set(current).add(targetId));
        }
      });
    },
    [meId, setUserLists],
  );

  const unfollow = useCallback(
    (targetId: string) => {
      if (!meId) return;
      const wasPending = pending.has(targetId);
      const apply = (follows: boolean) => {
        setUserLists(meId, (current) => ({
          ...current,
          following: follows
            ? [...new Set([...(current.following ?? []), targetId])]
            : (current.following ?? []).filter((id) => id !== targetId),
        }));
        setUserLists(targetId, (current) => ({
          ...current,
          followers: current.followers
            ? follows
              ? [...new Set([...current.followers, meId])]
              : current.followers.filter((id) => id !== meId)
            : current.followers,
        }));
      };
      const wasFollowing = (lists[meId]?.following ?? []).includes(targetId);
      setPending((current) => {
        const next = new Set(current);
        next.delete(targetId);
        return next;
      });
      apply(false);
      void unfollowRequest(targetId).then((result) => {
        if (result.ok) return;
        // The backend refused: put everything back the way it was.
        if (wasFollowing) apply(true);
        if (wasPending) setPending((current) => new Set(current).add(targetId));
      });
    },
    [meId, pending, lists, setUserLists],
  );

  const getFollowerIds = useCallback((userId: string) => lists[userId]?.followers ?? [], [lists]);
  const getFollowingIds = useCallback((userId: string) => lists[userId]?.following ?? [], [lists]);

  const value = useMemo<FollowStoreValue>(
    () => ({ isFollowing, isPending, follow, unfollow, getFollowerIds, getFollowingIds, loadFollowLists }),
    [isFollowing, isPending, follow, unfollow, getFollowerIds, getFollowingIds, loadFollowLists],
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
