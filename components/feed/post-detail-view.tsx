"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { CommentComposer } from "@/components/feed/comment-composer";
import { CommentList } from "@/components/feed/comment-list";
import { PostCard } from "@/components/feed/post-card";
import { useSocialStore } from "@/context/social-store-context";

type PostDetailViewProps = {
  postId: string;
};

export function PostDetailView({ postId }: PostDetailViewProps) {
  const router = useRouter();
  const { getPostById, loadPostById } = useSocialStore();
  const post = getPostById(postId);
  const [loading, setLoading] = useState(!post);

  useEffect(() => {
    let cancelled = false;
    void loadPostById(postId).then(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [postId, loadPostById]);

  if (!post && loading) {
    return <LoadingState message="Loading post…" />;
  }

  if (!post) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-bold text-[var(--outly-ink)]">Post not found</h1>
        <p className="text-sm text-[var(--outly-muted)]">
          This post may have been deleted, or the link is incorrect.
        </p>
        <Link
          href="/feed"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          Back to feed
        </Link>
      </div>
    );
  }

  const backHref = post.groupId ? `/groups/${post.groupId}` : "/feed";
  const backLabel = post.groupId ? "Back to group" : "Back to feed";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
      >
        <Icon name="chevron-left" className="h-4 w-4" />
        {backLabel}
      </Link>

      <PostCard post={post} linkToDetail={false} onDeleted={() => router.push(backHref)} />

      <div className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
          Comments
        </h2>
        <div className="mt-4">
          <CommentComposer postId={post.id} />
        </div>
        <div className="mt-6">
          <CommentList postId={post.id} comments={post.comments} />
        </div>
      </div>
    </div>
  );
}
