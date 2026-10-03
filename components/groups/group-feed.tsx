"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PostCard } from "@/components/feed/post-card";
import { useSocialStore } from "@/context/social-store-context";

type GroupFeedProps = {
  groupId: string;
};

/** Group Feed: reuses the same `Post`/`PostCard`/comment infrastructure
 * as the main Home Feed (`components/feed/`), filtered to this group's
 * posts (`Post.groupId`) — see `types/post.ts`. */
export function GroupFeed({ groupId }: GroupFeedProps) {
  const { currentUser, posts, loadGroupPosts } = useSocialStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    void loadGroupPosts(groupId).then((failure) => {
      if (cancelled) return;
      setError(failure?.message);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [groupId, loadGroupPosts]);

  const groupPosts = posts
    .filter((post) => post.groupId === groupId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="flex flex-col gap-5">
      <Link
        href={`/feed/new?groupId=${groupId}`}
        className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white px-5 py-4 text-left shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        <Avatar name={currentUser.name} avatarUrl={currentUser.avatarUrl} size="md" />
        <span className="text-sm font-medium text-[var(--outly-muted)]">
          Share an update with this group…
        </span>
      </Link>

      {loading && groupPosts.length === 0 ? (
        <LoadingState message="Loading the group feed…" />
      ) : error && groupPosts.length === 0 ? (
        <ErrorState title="We couldn't load the group feed" description={error} />
      ) : groupPosts.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white px-5 py-8 text-center text-sm text-[var(--outly-muted)] shadow-[var(--shadow-soft)]">
          No posts yet — be the first to share something with this group.
        </p>
      ) : (
        groupPosts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
