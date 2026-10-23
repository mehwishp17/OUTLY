"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useSocialStore } from "@/context/social-store-context";
import { formatRelativeTime } from "@/lib/utils";
import { validateCommentContent } from "@/lib/validation/post-schema";
import type { Comment } from "@/types/post";

type CommentItemProps = {
  postId: string;
  comment: Comment;
};

/** A single comment row, with inline edit and delete for the comment's
 * own author. Mirrors the post-card action pattern (`DropdownMenu` +
 * `ConfirmDialog`) at a smaller scale. */
export function CommentItem({ postId, comment }: CommentItemProps) {
  const { isCurrentUser, editComment, deleteComment } = useSocialStore();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [error, setError] = useState<string>();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const isAuthor = isCurrentUser(comment.authorId);

  async function handleSaveEdit() {
    const validationError = validateCommentContent(draft);
    setError(validationError);
    if (validationError) return;

    const backendError = await editComment(postId, comment.id, draft);
    if (backendError) {
      setError(backendError);
      return;
    }
    setIsEditing(false);
  }

  function handleCancelEdit() {
    setDraft(comment.content);
    setError(undefined);
    setIsEditing(false);
  }

  return (
    <div className="flex gap-3">
      <Link href={`/people/${comment.authorId}`}>
        <Avatar name={comment.authorName} avatarUrl={comment.authorAvatarUrl} size="sm" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2 rounded-2xl rounded-tl-md border border-white/[0.07] bg-white/[0.05] px-3.5 py-2.5">
          <div className="min-w-0">
            <Link
              href={`/people/${comment.authorId}`}
              className="text-sm font-semibold text-white transition-colors hover:text-[var(--outly-pink)]"
            >
              {comment.authorName}
            </Link>
            {isEditing ? (
              <div className="mt-1.5">
                <Textarea
                  id={`comment-edit-${comment.id}`}
                  label="Edit comment"
                  hideLabel
                  rows={2}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  error={error}
                />
              </div>
            ) : (
              <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-white/90">
                {comment.content}
              </p>
            )}
          </div>

          {isAuthor && !isEditing ? (
            <DropdownMenu
              triggerLabel="Comment actions"
              items={[
                { label: "Edit comment", onSelect: () => setIsEditing(true) },
                { label: "Delete comment", destructive: true, onSelect: () => setConfirmingDelete(true) },
              ]}
            />
          ) : null}
        </div>

        {isEditing ? (
          <div className="mt-2 flex gap-2">
            <Button size="md" onClick={handleSaveEdit}>
              Save
            </Button>
            <Button size="md" variant="secondary" onClick={handleCancelEdit}>
              Cancel
            </Button>
          </div>
        ) : (
          <p className="mt-1 px-3.5 text-xs text-[var(--outly-muted)]">
            {formatRelativeTime(comment.createdAt)}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this comment?"
        description="This can't be undone."
        onConfirm={async () => {
          const backendError = await deleteComment(postId, comment.id);
          setConfirmingDelete(false);
          if (backendError) setError(backendError);
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
