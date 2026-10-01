"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAdminStore } from "@/context/admin-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { formatRelativeTime } from "@/lib/utils";

/** Admin Content: every post across the platform (Home Feed and every
 * Group Feed), with hide/unhide and delete moderation actions — reusing
 * `deletePost`/`setPostHidden` from the same `social-store-context` the
 * Feed module already uses, rather than a parallel content store. */
export function AdminContentView() {
  const { posts, deletePost, setPostHidden } = useSocialStore();
  const { logAction } = useAdminStore();
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const sorted = [...posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  function handleToggleHidden(postId: string, content: string, hidden: boolean) {
    setPostHidden(postId, hidden);
    const label = content.length > 60 ? `${content.slice(0, 60)}…` : content;
    logAction(hidden ? "post_hidden" : "post_unhidden", label);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
          Content
        </h1>
        <p className="mt-1 text-sm text-[var(--outly-muted)]">
          Every post across the Home Feed and Group Feeds.
        </p>
      </div>

      <AdminNav active="/admin/content" />

      {sorted.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white px-5 py-10 text-center text-sm text-[var(--outly-muted)] shadow-[var(--shadow-soft)]">
          No posts yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((post) => (
            <li
              key={post.id}
              className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-4 shadow-[var(--shadow-soft)] transition-shadow duration-200 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--outly-ink)]">{post.authorName}</p>
                  {post.hidden ? (
                    <span className="rounded-full bg-[#fbe1e8] px-2 py-0.5 text-xs font-semibold text-[#b3164c]">
                      Hidden
                    </span>
                  ) : null}
                  {post.groupId ? (
                    <span className="rounded-full bg-[var(--outly-lavender)] px-2 py-0.5 text-xs font-semibold text-[var(--outly-purple-dark)]">
                      Group post
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-[var(--outly-muted)]">{post.content}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-[var(--outly-muted)]">
                  <span>{formatRelativeTime(post.createdAt)}</span>
                  <span>{post.comments.length} comments</span>
                  <Link href={`/feed/${post.id}`} className="font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]">
                    View
                  </Link>
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <Button
                  size="md"
                  variant="secondary"
                  onClick={() => handleToggleHidden(post.id, post.content, !post.hidden)}
                >
                  {post.hidden ? "Unhide" : "Hide"}
                </Button>
                <Button size="md" variant="secondary" onClick={() => setConfirmingDeleteId(post.id)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirmingDeleteId !== null}
        title="Delete this post?"
        description="This can't be undone."
        onConfirm={() => {
          if (confirmingDeleteId) deletePost(confirmingDeleteId);
          setConfirmingDeleteId(null);
        }}
        onCancel={() => setConfirmingDeleteId(null)}
      />
    </div>
  );
}
