"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { fetchAdminPosts, setPostStatusRequest } from "@/lib/api/admin";
import type { AdminPost } from "@/lib/api/admin";
import { formatRelativeTime } from "@/lib/utils";

/** Admin Content (moderators): every post across the platform (Home Feed
 * and every Group Feed), with hide/unhide and delete moderation actions.
 * Hidden posts disappear from everyone's feeds but stay here, reversibly. */
export function AdminContentView() {
  const [allPosts, setAllPosts] = useState<AdminPost[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    let cancelled = false;
    void fetchAdminPosts().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setAllPosts(result.data);
        setStatus("ready");
      } else {
        setError(result.message);
        setStatus("error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const posts = allPosts
    .filter((post) => post.status !== "DELETED")
    .map((post) => ({ ...post, hidden: post.status === "HIDDEN" }));

  const sorted = [...posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  async function changeStatus(postId: string, next: "ACTIVE" | "HIDDEN" | "DELETED") {
    setActionError(undefined);
    const result = await setPostStatusRequest(postId, next);
    if (!result.ok) {
      setActionError(result.message);
      return;
    }
    reload();
  }

  function handleToggleHidden(postId: string, _content: string, hidden: boolean) {
    void changeStatus(postId, hidden ? "HIDDEN" : "ACTIVE");
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

      {actionError ? (
        <p role="alert" className="text-sm text-[#B3164C]">
          {actionError}
        </p>
      ) : null}

      {status === "loading" ? (
        <LoadingState message="Loading posts…" />
      ) : status === "error" ? (
        <ErrorState title="We couldn't load posts" description={error} />
      ) : sorted.length === 0 ? (
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
                  <span>{post.commentCount} comments</span>
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
          if (confirmingDeleteId) void changeStatus(confirmingDeleteId, "DELETED");
          setConfirmingDeleteId(null);
        }}
        onCancel={() => setConfirmingDeleteId(null)}
      />
    </div>
  );
}
