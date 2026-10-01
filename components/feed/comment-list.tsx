import { CommentItem } from "@/components/feed/comment-item";
import type { Comment } from "@/types/post";

type CommentListProps = {
  postId: string;
  comments: Comment[];
};

export function CommentList({ postId, comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-[var(--outly-muted)]">
        No comments yet — be the first to reply.
      </p>
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
