import { CommentItem } from "@/components/feed/comment-item";
import { Icon } from "@/components/ui/icon";
import type { Comment } from "@/types/post";

type CommentListProps = {
  postId: string;
  comments: Comment[];
};

export function CommentList({ postId, comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-white/15 px-4 py-7 text-center">
        <Icon name="message-circle" className="h-6 w-6 text-[var(--outly-pink)]" />
        <p className="text-sm text-[var(--outly-muted)]">No comments yet — be the first to reply.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem key={comment.id} postId={postId} comment={comment} />
      ))}
    </div>
  );
}
