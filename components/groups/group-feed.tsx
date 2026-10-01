"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { PostCard } from "@/components/feed/post-card";
import { useSocialStore } from "@/context/social-store-context";

type GroupFeedProps = {
  groupId: string;
};

/** Group Feed: reuses the same `Post`/`PostCard`/comment infrastructure
 * as the main Home Feed (`components/feed/`), filtered to this group's
 * posts (`Post.groupId`) — see `types/post.ts`. */
export function GroupFeed({ groupId }: GroupFeedProps) {
  const { currentUser, posts } = useSocialStore();
  const groupPosts = posts
    .filter((post) => post.groupId === groupId && !post.hidden)
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

      {groupPosts.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white px-5 py-8 text-center text-sm text-[var(--outly-muted)] shadow-[var(--shadow-soft)]">
          No posts yet — be the first to share something with this group.
        </p>
      ) : (
        groupPosts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
