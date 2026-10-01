/**
 * Shared types for the Phase 3 social module (feed, post detail, create
 * / edit post, comments). All posts and comments live in
 * `context/social-store-context.tsx` for the duration of the browser
 * session only — nothing here is persisted to a backend or database, and
 * everything resets on page reload.
 */

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  createdAt: string;
  /** True when this comment came from the OUTLY backend. The backend has no
   * comment edit/delete endpoints, so persisted comments are read-only. */
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
  /** Local object URLs / data URLs only — never uploaded anywhere. */
  images?: string[];
  /** CSS gradient used as a lightweight illustrative visual when a seed
   * post has no attached image. */
  gradient?: string;
  createdAt: string;
  updatedAt?: string;
  /** True when this post was loaded from / saved to the OUTLY backend
   * (Home Feed). Mock posts (e.g. group posts) leave this unset. */
  persisted?: boolean;
  /** LOCAL-ONLY (no backend endpoint): like state lasts for this browser
   * session and is never sent anywhere. */
  likeCount: number;
  likedByCurrentUser: boolean;
  /** LOCAL-ONLY (no backend endpoint), like `likeCount`. */
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
