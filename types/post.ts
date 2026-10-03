/**
 * Shared types for the social module (feed, post detail, create / edit
 * post, comments). Posts and comments come from the OUTLY backend through
 * `lib/api/feed.ts` and live in `context/social-store-context.tsx`.
 */

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  createdAt: string;
  /** True when this comment is stored by the OUTLY backend. */
  persisted?: boolean;
};

export type Post = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  location?: string;
  /** Present when this post belongs to a group's Group Feed rather than
   * the main Home Feed (`Group.id`) — see `types/group.ts`. */
  groupId?: string;
  /** Set by an Admin "Content" moderation action — hidden posts are
   * filtered out of the Home Feed and Group Feed but still visible (and
   * reversible) from the Admin Content screen. */
  hidden?: boolean;
  /** Photo URLs served by the backend (same order as `mediaIds`). */
  images?: string[];
  /** Backend media ids of `images`, used to keep photos when a post is edited. */
  mediaIds?: number[];
  /** CSS gradient used as a lightweight illustrative visual when a seed
   * post has no attached image. */
  gradient?: string;
  createdAt: string;
  updatedAt?: string;
  /** True when this post is stored by the OUTLY backend (always, now). */
  persisted?: boolean;
  likeCount: number;
  likedByCurrentUser: boolean;
  savedByCurrentUser: boolean;
  comments: Comment[];
};

export type CreatePostInput = {
  content: string;
  location?: string;
  images?: string[];
  groupId?: string;
};

export type EditPostInput = {
  content: string;
  location?: string;
  images?: string[];
};

export type PostComposerErrors = {
  content?: string;
};
