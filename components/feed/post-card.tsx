"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { CoverImage } from "@/components/ui/cover-image";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { ReportDialog } from "@/components/ui/report-dialog";
import { LikeButton } from "@/components/social/like-button";
import { SaveButton } from "@/components/social/save-button";
import { ShareButton } from "@/components/social/share-button";
import { useAdminStore } from "@/context/admin-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { POST_PHOTOS } from "@/lib/adventure-images";
import { formatRelativeTime } from "@/lib/utils";
import type { Post } from "@/types/post";
import type { ReportReason } from "@/types/report";

type PostCardProps = {
  post: Post;
  /** Whether the author/content area should link through to the post's
   * detail page. Set `false` when the card is already rendered on the
   * detail page itself. */
  linkToDetail?: boolean;
  /** Called after this post is deleted — used by the detail page to
   * navigate back to the feed once the post it was showing is gone. */
  onDeleted?: () => void;
};

/** Feed/detail post card: author, content, optional photos, and the
 * like/save/comment/edit-delete action row. Reads and mutates post state
 * via `useSocialStore` directly rather than through prop drilling. */
export function PostCard({ post, linkToDetail = true, onDeleted }: PostCardProps) {
  const router = useRouter();
  const { currentUser, isCurrentUser, toggleLike, toggleSave, deletePost, deleteBackendPost } =
    useSocialStore();
  const { createReport } = useAdminStore();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [reportingPost, setReportingPost] = useState(false);
  const [actionError, setActionError] = useState<string>();
  const isAuthor = isCurrentUser(post.authorId);
  const detailHref = `/feed/${post.id}`;
  const photo = POST_PHOTOS[post.id];
  const latestComment = post.comments[post.comments.length - 1];

  function handleSubmitReport(reason: ReportReason, description?: string) {
    createReport({
      targetType: "post",
      targetId: post.id,
      targetLabel: post.content.length > 60 ? `${post.content.slice(0, 60)}…` : post.content,
      reason,
      description,
      reporterId: currentUser.id,
    });
    setReportingPost(false);
  }

  async function handleDelete() {
    if (post.persisted) {
      const error = await deleteBackendPost(post.id);
      setConfirmingDelete(false);
      if (error) {
        setActionError(error);
        return;
      }
    } else {
      deletePost(post.id);
      setConfirmingDelete(false);
    }
    onDeleted?.();
  }

  const body = (
    <>
      {post.content ? (
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--outly-ink)]">
          {post.content}
        </p>
      ) : null}

      {post.images && post.images.length > 0 ? (
        <div
          className={
            post.images.length === 1
              ? "mt-3 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--outly-lavender)]"
              : "mt-3 grid grid-cols-2 gap-1 overflow-hidden rounded-[var(--radius-lg)]"
          }
        >
          {post.images.map((image) => (
            // eslint-disable-next-line @next/next/no-img-element -- local blob/data preview URL only, not a remote image.
            <img
              key={image}
              src={image}
              alt=""
              className={`w-full object-cover transition-transform duration-300 ease-out hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100 ${post.images?.length === 1 ? "aspect-[4/3]" : "aspect-square"}`}
            />
          ))}
        </div>
      ) : post.gradient ? (
        <div
          aria-hidden="true"
          className="group relative mt-3 h-48 overflow-hidden rounded-[var(--radius-lg)] sm:h-64"
          style={{ backgroundImage: post.gradient }}
        >
          {photo ? <CoverImage src={photo} sizes="(min-width: 768px) 640px, 100vw" position="center 40%" /> : null}
        </div>
      ) : null}
    </>
  );

  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-5 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/people/${post.authorId}`} className="rounded-full ring-2 ring-[var(--outly-lavender)] transition-shadow hover:ring-[var(--outly-violet)]/40">
            <Avatar name={post.authorName} avatarUrl={post.authorAvatarUrl} size="md" />
          </Link>
          <div>
            <Link
              href={`/people/${post.authorId}`}
              className="text-sm font-semibold text-[var(--outly-ink)] hover:text-[var(--outly-violet)]"
            >
              {post.authorName}
            </Link>
            <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-[var(--outly-muted)]">
              <span>{formatRelativeTime(post.createdAt)}</span>
              {post.updatedAt ? <span>· Edited</span> : null}
              {post.location ? (
                <span className="flex items-center gap-1">
                  <Icon name="pin" className="h-3 w-3" />
                  {post.location}
                </span>
              ) : null}
            </p>
          </div>
        </div>

        {isAuthor ? (
          <DropdownMenu
            triggerLabel="Post actions"
            items={[
              { label: "Edit post", onSelect: () => router.push(`/feed/${post.id}/edit`) },
              { label: "Delete post", destructive: true, onSelect: () => setConfirmingDelete(true) },
            ]}
          />
        ) : (
          <DropdownMenu
            triggerLabel="Post actions"
            items={[{ label: "Report post", destructive: true, onSelect: () => setReportingPost(true) }]}
          />
        )}
      </div>

      <div className="mt-3">
        {linkToDetail ? (
          <Link href={detailHref} className="block rounded-[var(--radius-md)] focus-visible:outline-2 focus-visible:outline-offset-2">
            {body}
          </Link>
        ) : (
          body
        )}
      </div>

      {actionError ? (
        <p role="alert" className="mt-3 text-sm text-[#B3164C]">
          {actionError}
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between border-t border-[var(--outly-border)] pt-3">
        <div className="flex items-center gap-0.5">
          <LikeButton
            liked={post.likedByCurrentUser}
            count={post.likeCount}
            onToggle={() => toggleLike(post.id)}
          />
          <Link
            href={detailHref}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-[var(--outly-muted)] transition-all hover:bg-[var(--outly-lavender)] hover:text-[var(--outly-violet)] active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            <Icon name="message-circle" className="h-5 w-5" />
            <span aria-hidden="true">{post.comments.length}</span>
            <span className="sr-only">{post.comments.length} comments</span>
          </Link>
          <ShareButton postId={post.id} />
        </div>
        <SaveButton saved={post.savedByCurrentUser} onToggle={() => toggleSave(post.id)} />
      </div>

      {linkToDetail && latestComment ? (
        <div className="mt-3 space-y-1 text-sm">
          <p className="line-clamp-2 text-[var(--outly-ink)]">
            <Link
              href={`/people/${latestComment.authorId}`}
              className="mr-1.5 font-semibold hover:text-[var(--outly-violet)]"
            >
              {latestComment.authorName}
            </Link>
            {latestComment.content}
          </p>
          {post.comments.length > 1 ? (
            <Link
              href={detailHref}
              className="inline-block text-[var(--outly-muted)] transition-colors hover:text-[var(--outly-violet)]"
            >
              View all {post.comments.length} comments
            </Link>
          ) : null}
        </div>
      ) : null}

      {linkToDetail ? (
        <Link
          href={detailHref}
          className="mt-3 flex items-center justify-between rounded-full border border-[var(--outly-border)] px-4 py-2 text-sm text-[var(--outly-muted)] transition-colors hover:border-[var(--outly-violet)]/50 hover:text-[var(--outly-violet)]"
        >
          Add a comment…
          <Icon name="send" className="h-4 w-4" />
        </Link>
      ) : null}

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this post?"
        description="This can't be undone. The post and its comments will be removed for everyone (in this preview session)."
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />

      <ReportDialog
        open={reportingPost}
        targetLabel="this post"
        onSubmit={handleSubmitReport}
        onCancel={() => setReportingPost(false)}
      />
    </article>
  );
}
