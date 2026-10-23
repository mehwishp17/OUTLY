"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { ReportDialog } from "@/components/ui/report-dialog";
import { LikeButton } from "@/components/social/like-button";
import { SaveButton } from "@/components/social/save-button";
import { ShareButton } from "@/components/social/share-button";
import { useAdminStore } from "@/context/admin-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { formatRelativeTime } from "@/lib/utils";
import type { Post } from "@/types/post";
import type { ReportReason } from "@/types/report";

/**
 * Pieces shared by the redesigned Feed card and the post detail page. The behaviour is the same as the
 * original `PostCard`'s (like, save, delete with confirmation, report); only the presentation is new.
 * The original `PostCard` is left untouched because the Groups feed still uses it.
 */

/** Delete / report state and handlers for one post (the same calls `PostCard` makes). */
export function usePostActions(post: Post, onDeleted?: () => void) {
  const router = useRouter();
  const { isCurrentUser, toggleLike, toggleSave, deletePost } = useSocialStore();
  const { createReport } = useAdminStore();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [reportingPost, setReportingPost] = useState(false);
  const [actionError, setActionError] = useState<string>();
  const [reportNotice, setReportNotice] = useState<string>();
  const isAuthor = isCurrentUser(post.authorId);

  async function handleSubmitReport(reason: ReportReason, description?: string) {
    const error = await createReport({ targetType: "post", targetId: post.id, reason, description });
    setReportingPost(false);
    setActionError(error ?? undefined);
    if (!error) setReportNotice("Thanks - our moderators will take a look.");
  }

  async function handleDelete() {
    const error = await deletePost(post.id);
    setConfirmingDelete(false);
    if (error) {
      setActionError(error);
      return;
    }
    onDeleted?.();
  }

  return {
    router,
    isAuthor,
    toggleLike,
    toggleSave,
    confirmingDelete,
    setConfirmingDelete,
    reportingPost,
    setReportingPost,
    actionError,
    reportNotice,
    handleSubmitReport,
    handleDelete,
  };
}

export type PostActions = ReturnType<typeof usePostActions>;

/** Avatar with a thin brand-gradient ring (the "story ring" treatment). */
export function AvatarRing({
  name,
  avatarUrl,
  size = "md",
}: {
  name: string;
  avatarUrl?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span className="inline-flex shrink-0 rounded-full bg-gradient-to-tr from-[#7c3aed] via-[var(--outly-pink-bright)] to-[var(--outly-pink)] p-[2px]">
      <span className="inline-flex rounded-full bg-[#17121f] p-[2px]">
        <Avatar name={name} avatarUrl={avatarUrl} size={size} />
      </span>
    </span>
  );
}

/** Author, time, location and the post's actions menu. */
export function PostHeader({ post, actions }: { post: Post; actions: PostActions }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href={`/people/${post.authorId}`}
          aria-label={`${post.authorName}'s profile`}
          className="rounded-full transition-opacity hover:opacity-90"
        >
          <AvatarRing name={post.authorName} avatarUrl={post.authorAvatarUrl} />
        </Link>
        <div className="min-w-0 leading-tight">
          <p className="flex flex-wrap items-baseline gap-x-1.5">
            <Link
              href={`/people/${post.authorId}`}
              className="truncate text-sm font-semibold text-white transition-colors hover:text-[var(--outly-pink)]"
            >
              {post.authorName}
            </Link>
            <span className="text-xs text-[var(--outly-muted)]">
              · {formatRelativeTime(post.createdAt)}
              {post.updatedAt ? " · Edited" : ""}
            </span>
          </p>
          {post.location ? (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--outly-muted)]">
              <Icon name="pin" className="h-3 w-3 shrink-0 text-[var(--outly-pink)]" />
              <span className="truncate">{post.location}</span>
            </p>
          ) : null}
        </div>
      </div>

      {actions.isAuthor ? (
        <DropdownMenu
          triggerLabel="Post actions"
          items={[
            { label: "Edit post", onSelect: () => actions.router.push(`/feed/${post.id}/edit`) },
            { label: "Delete post", destructive: true, onSelect: () => actions.setConfirmingDelete(true) },
          ]}
        />
      ) : (
        <DropdownMenu
          triggerLabel="Post actions"
          items={[{ label: "Report post", destructive: true, onSelect: () => actions.setReportingPost(true) }]}
        />
      )}
    </div>
  );
}

/** Like, comment, share on the left and save on the right. */
export function PostActionBar({
  post,
  detailHref,
  actions,
}: {
  post: Post;
  detailHref: string;
  actions: PostActions;
}) {
  return (
    <div className="-mx-2 flex items-center justify-between">
      <div className="flex items-center gap-0.5">
        <LikeButton
          liked={post.likedByCurrentUser}
          count={post.likeCount}
          onToggle={() => actions.toggleLike(post.id)}
        />
        <Link
          href={detailHref}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-[var(--outly-muted)] transition-all hover:bg-[var(--outly-lavender)] hover:text-[var(--outly-pink)] active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          <Icon name="message-circle" className="h-5 w-5" />
          <span aria-hidden="true">{post.comments.length}</span>
          <span className="sr-only">{post.comments.length} comments</span>
        </Link>
        <ShareButton postId={post.id} />
      </div>
      <SaveButton saved={post.savedByCurrentUser} onToggle={() => actions.toggleSave(post.id)} />
    </div>
  );
}

/** Inline action error and the "report sent" notice. */
export function PostNotices({ actions }: { actions: PostActions }) {
  return (
    <>
      {actions.actionError ? (
        <p role="alert" className="mt-3 text-sm text-[#B3164C]">
          {actions.actionError}
        </p>
      ) : null}
      {actions.reportNotice ? (
        <p role="status" className="mt-3 text-sm text-[#1e7a3a]">
          {actions.reportNotice}
        </p>
      ) : null}
    </>
  );
}

/** The delete confirmation and report dialogs (same copy as the original card). */
export function PostDialogs({ actions }: { actions: PostActions }) {
  return (
    <>
      <ConfirmDialog
        open={actions.confirmingDelete}
        title="Delete this post?"
        description="This can't be undone. The post and its comments will be removed for everyone."
        onConfirm={actions.handleDelete}
        onCancel={() => actions.setConfirmingDelete(false)}
      />
      <ReportDialog
        open={actions.reportingPost}
        targetLabel="this post"
        onSubmit={actions.handleSubmitReport}
        onCancel={() => actions.setReportingPost(false)}
      />
    </>
  );
}
