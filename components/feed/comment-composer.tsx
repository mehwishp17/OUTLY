"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Textarea } from "@/components/ui/textarea";
import { useSocialStore } from "@/context/social-store-context";
import { validateCommentContent } from "@/lib/validation/post-schema";

type CommentComposerProps = {
  postId: string;
};

/** Compact "add a comment" form shown under a post's comment list. */
export function CommentComposer({ postId }: CommentComposerProps) {
  const { currentUser, addComment, addBackendComment, getPostById } = useSocialStore();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isPersisted = Boolean(getPostById(postId)?.persisted);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const validationError = validateCommentContent(content);
    setError(validationError);
    if (validationError) return;

    if (isPersisted) {
      setIsSubmitting(true);
      const backendError = await addBackendComment(postId, content);
      setIsSubmitting(false);
      if (backendError) {
        setError(backendError);
        return;
      }
    } else {
      addComment(postId, content);
    }
    setContent("");
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex items-start gap-3">
      <Avatar name={currentUser.name} avatarUrl={currentUser.avatarUrl} size="sm" />
      <div className="relative flex-1">
        <Textarea
          id={`comment-composer-${postId}`}
          label="Add a comment"
          hideLabel
          rows={1}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          error={error}
          placeholder="Add a comment…"
          className={`resize-none rounded-[var(--radius-lg)] py-2.5 pr-14 shadow-none transition-[height,border-color] duration-200 focus:h-24 focus:border-[var(--outly-violet)] motion-reduce:transition-none ${
            content ? "h-24" : "h-11"
          }`}
        />
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          aria-label="Post comment"
          className="absolute right-2 top-1.5 flex h-8 w-8 items-center justify-center rounded-full text-white transition-all gradient-brand hover:brightness-110 active:scale-95 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none"
        >
          {isSubmitting ? <LoadingSpinner /> : <Icon name="send" className="h-4 w-4" />}
        </button>
      </div>
    </form>
  );
}
