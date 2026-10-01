import type { Post, Comment, CreatePostInput, EditPostInput } from "@/types/post";
import type { SavedPlace, UserProfile } from "@/types/profile";

/**
 * Pure, framework-free helpers that transform the in-memory posts/profile
 * arrays used by `context/social-store-context.tsx`. Kept separate from
 * the context so the create/edit/delete/like/save/comment logic stays
 * isolated, readable, and easy to reason about without React in the mix.
 * None of this ever reads from or writes to a network, database, or
 * `localStorage` — it only ever operates on the array passed in.
 */

let localIdCounter = 0;

function nextLocalId(prefix: string): string {
  localIdCounter += 1;
  return `${prefix}-local-${Date.now()}-${localIdCounter}`;
}

export function buildNewPost(
  input: CreatePostInput,
  author: Pick<UserProfile, "id" | "name" | "avatarUrl">,
): Post {
  return {
    id: nextLocalId("post"),
    authorId: author.id,
    authorName: author.name,
    authorAvatarUrl: author.avatarUrl,
    content: input.content.trim(),
    location: input.location?.trim() || undefined,
    images: input.images,
    groupId: input.groupId,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    likedByCurrentUser: false,
    savedByCurrentUser: false,
    comments: [],
  };
}

export function applyEditToPost(post: Post, input: EditPostInput): Post {
  return {
    ...post,
    content: input.content.trim(),
    location: input.location?.trim() || undefined,
    images: input.images,
    updatedAt: new Date().toISOString(),
  };
}

export function setPostHidden(post: Post, hidden: boolean): Post {
  return { ...post, hidden };
}

export function toggleLikeOnPost(post: Post): Post {
  const likedByCurrentUser = !post.likedByCurrentUser;
  return {
    ...post,
    likedByCurrentUser,
    likeCount: Math.max(0, post.likeCount + (likedByCurrentUser ? 1 : -1)),
  };
}

export function toggleSaveOnPost(post: Post): Post {
  return { ...post, savedByCurrentUser: !post.savedByCurrentUser };
}

export function buildNewComment(
  postId: string,
  content: string,
  author: Pick<UserProfile, "id" | "name" | "avatarUrl">,
): Comment {
  return {
    id: nextLocalId("comment"),
    postId,
    authorId: author.id,
    authorName: author.name,
    authorAvatarUrl: author.avatarUrl,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };
}

export function addCommentToPost(post: Post, comment: Comment): Post {
  return { ...post, comments: [...post.comments, comment] };
}

export function editCommentOnPost(post: Post, commentId: string, content: string): Post {
  return {
    ...post,
    comments: post.comments.map((comment) =>
      comment.id === commentId ? { ...comment, content: content.trim() } : comment,
    ),
  };
}

export function removeCommentFromPost(post: Post, commentId: string): Post {
  return { ...post, comments: post.comments.filter((comment) => comment.id !== commentId) };
}

/**
 * Builds the saved-places list for the profile after a post's save state
 * changes. This keeps "saved places" (profile module) and "saved posts"
 * (social module) loosely in sync for posts that carry a location, without
 * requiring a real relational store.
 */
export function syncSavedPlaceForPost(
  savedPlaces: SavedPlace[],
  post: Post,
): SavedPlace[] {
  if (!post.location) return savedPlaces;

  if (post.savedByCurrentUser) {
    if (savedPlaces.some((place) => place.id === `post-${post.id}`)) return savedPlaces;
    return [
      ...savedPlaces,
      {
        id: `post-${post.id}`,
        title: post.content.length > 60 ? `${post.content.slice(0, 60)}…` : post.content,
        location: post.location,
        category: "Saved from feed",
      },
    ];
  }

  return savedPlaces.filter((place) => place.id !== `post-${post.id}`);
}

/**
 * Adds/removes an Explore place or trail from the profile's "Saved
 * places" list. Shares the same `SavedPlace` shape as saved posts
 * (`syncSavedPlaceForPost` above) so both surfaces appear together in
 * `ProfileSavedPlaces`.
 */
export function toggleSavedPlaceEntry(
  savedPlaces: SavedPlace[],
  place: SavedPlace,
): SavedPlace[] {
  const exists = savedPlaces.some((saved) => saved.id === place.id);
  return exists
    ? savedPlaces.filter((saved) => saved.id !== place.id)
    : [...savedPlaces, place];
}
