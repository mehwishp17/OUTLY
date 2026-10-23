"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { CommentComposer } from "@/components/feed/comment-composer";
import { CommentList } from "@/components/feed/comment-list";
import { PostMedia } from "@/components/feed/post-media";
import { PostActionBar, PostDialogs, PostHeader, PostNotices, usePostActions } from "@/components/feed/post-parts";
import { useSocialStore } from "@/context/social-store-context";
import type { Post } from "@/types/post";

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
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
      <h1 className="sr-only">Post by {post.authorName}</h1>
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-1.5 rounded-full text-sm font-semibold text-[var(--outly-muted)] transition-colors hover:text-white"
      >
        <Icon name="chevron-left" className="h-4 w-4" />
        {backLabel}
      </Link>

      <PostDetailBody post={post} onDeleted={() => router.push(backHref)} />
    </div>
  );
}

/** The post, its photos, and the conversation (split into two columns when the post has photos). */
function PostDetailBody({ post, onDeleted }: { post: Post; onDeleted: () => void }) {
  const actions = usePostActions(post, onDeleted);
  const detailHref = `/feed/${post.id}`;
  const images = post.images ?? [];
  const hasPhotos = images.length > 0;
  const mediaAlt = `Photo shared by ${post.authorName}${post.location ? ` at ${post.location}` : ""}`;

  return (
    <article
      aria-label={`Post by ${post.authorName}`}
      className={
        hasPhotos
          ? "mt-4 grid overflow-hidden rounded-[var(--radius-lg)] border border-white/10 bg-[#17121f] shadow-[var(--shadow-elevated)] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]"
          : "mx-auto mt-4 max-w-2xl overflow-hidden rounded-[var(--radius-lg)] border border-white/10 bg-[#17121f] shadow-[var(--shadow-elevated)]"
      }
    >
      {hasPhotos ? (
        <div className="min-w-0 lg:border-r lg:border-white/10">
          <PostMedia images={images} alt={mediaAlt} className="h-full" />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col">
        <div className="border-b border-white/10 px-5 py-4">
          <PostHeader post={post} actions={actions} />
        </div>

        {post.content ? (
          <div className="px-5 pb-1 pt-4">
            <p
              className={
                hasPhotos
                  ? "whitespace-pre-wrap text-[15px] leading-relaxed text-white/90"
                  : "whitespace-pre-wrap text-xl leading-relaxed text-white"
              }
            >
              {post.content}
            </p>
          </div>
        ) : null}

        <div className="px-5 pt-3">
          <PostActionBar post={post} detailHref={`${detailHref}#comments`} actions={actions} />
          <PostNotices actions={actions} />
        </div>

        <section id="comments" aria-labelledby="comments-heading" className="mt-2 flex flex-1 flex-col border-t border-white/10 px-5 pb-5 pt-4">
          <h2 id="comments-heading" className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--outly-muted)]">
            Comments
          </h2>
          <div className="mt-4">
            <CommentComposer postId={post.id} />
          </div>
          <div className="mt-5">
            <CommentList postId={post.id} comments={post.comments} />
          </div>
        </section>
      </div>

      <PostDialogs actions={actions} />
    </article>
  );
}
