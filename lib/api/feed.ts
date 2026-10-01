import { callBackend as call } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type { MyProfile } from "@/lib/api/profile";
import type { Comment, Post } from "@/types/post";

/**
 * Client for the backend-supported Feed features, reached through the
 * `/api/backend/*` pass-through (which adds the session's bearer token):
 *
 *   GET    /api/v1/posts/                  list posts
 *   POST   /api/v1/posts/                  create  { caption }
 *   PATCH  /api/v1/posts/{id}/             edit    { caption }
 *   DELETE /api/v1/posts/{id}/             delete
 *   GET    /api/v1/posts/{id}/comments/    list comments
 *   POST   /api/v1/posts/{id}/comments/    add     { content }
 *   GET    /api/v1/users/me/ , /users/{id}/ author names + avatars
 *
 * The backend has NO likes, saves, images, location, group id, or comment
 * edit/delete. Those are not represented here — see docs/feed-integration.md.
 */

type BackendPost = {
  id: number;
  author_id: number;
  caption: string;
  status: "ACTIVE" | "DELETED";
  created_at: string;
  updated_at: string;
};

type BackendComment = {
  id: number;
  post: number;
  author_id: number;
  content: string;
  created_at: string;
};

type BackendUser = {
  user_id: number;
  username?: string;
  display_name?: string;
  photo?: unknown;
};

export type Author = { name: string; avatarUrl?: string };
export type AuthorMap = Record<string, Author>;

function toAuthor(user: BackendUser): Author {
  return {
    name: user.display_name || user.username || "OUTLY member",
    avatarUrl: typeof user.photo === "string" && user.photo ? user.photo : undefined,
  };
}

function authorOf(authors: AuthorMap, id: number): Author {
  return authors[String(id)] ?? { name: "OUTLY member" };
}

export function mapComment(raw: BackendComment, authors: AuthorMap): Comment {
  const author = authorOf(authors, raw.author_id);
  return {
    id: String(raw.id),
    postId: String(raw.post),
    authorId: String(raw.author_id),
    authorName: author.name,
    authorAvatarUrl: author.avatarUrl,
    content: raw.content,
    createdAt: raw.created_at,
    persisted: true,
  };
}

/** Maps a backend post. Likes/saves are local-only and start empty here; the
 * store carries any existing local values over when it refreshes. */
export function mapPost(raw: BackendPost, comments: Comment[], authors: AuthorMap): Post {
  const author = authorOf(authors, raw.author_id);
  return {
    id: String(raw.id),
    authorId: String(raw.author_id),
    authorName: author.name,
    authorAvatarUrl: author.avatarUrl,
    content: raw.caption,
    createdAt: raw.created_at,
    // The backend stamps updated_at a few microseconds after created_at on a new
    // post, so only treat a post as edited when they differ by over a second.
    updatedAt:
      new Date(raw.updated_at).getTime() - new Date(raw.created_at).getTime() > 1000
        ? raw.updated_at
        : undefined,
    likeCount: 0,
    likedByCurrentUser: false,
    savedByCurrentUser: false,
    comments,
    persisted: true,
  };
}

/** Loads the signed-in user, every active post, each post's comments, and the
 * authors involved. Comment and author lookups degrade gracefully (empty
 * comments / "OUTLY member") rather than failing the whole feed. */
export async function loadFeed(
  myProfile: MyProfile,
): Promise<ApiResult<{ viewerId: string; authors: AuthorMap; posts: Post[] }>> {
  const me = { ok: true as const, data: myProfile };
  const list = await call<BackendPost[]>("GET", "posts");
  if (!list.ok) return list;

  const rawPosts = list.data.filter((post) => post.status === "ACTIVE");
  const commentLists = await Promise.all(
    rawPosts.map((post) => call<BackendComment[]>("GET", `posts/${post.id}/comments`)),
  );
  const rawComments = commentLists.map((result) => (result.ok ? result.data : []));

  const authors: AuthorMap = { [String(me.data.user_id)]: toAuthor(me.data) };
  const otherIds = new Set<number>();
  rawPosts.forEach((post) => otherIds.add(post.author_id));
  rawComments.flat().forEach((comment) => otherIds.add(comment.author_id));
  otherIds.delete(me.data.user_id);

  const users = await Promise.all(
    [...otherIds].map(async (id) => [id, await call<BackendUser>("GET", `users/${id}`)] as const),
  );
  for (const [id, result] of users) {
    if (result.ok) authors[String(id)] = toAuthor(result.data);
  }

  const posts = rawPosts.map((post, index) =>
    mapPost(post, rawComments[index].map((comment) => mapComment(comment, authors)), authors),
  );
  return { ok: true, data: { viewerId: String(me.data.user_id), authors, posts } };
}

export async function createPostRequest(caption: string, authors: AuthorMap): Promise<ApiResult<Post>> {
  const result = await call<BackendPost>("POST", "posts", { caption });
  return result.ok ? { ok: true, data: mapPost(result.data, [], authors) } : result;
}

export async function editPostRequest(
  postId: string,
  caption: string,
): Promise<ApiResult<{ caption: string; updatedAt: string }>> {
  const result = await call<BackendPost>("PATCH", `posts/${postId}`, { caption });
  return result.ok
    ? { ok: true, data: { caption: result.data.caption, updatedAt: result.data.updated_at } }
    : result;
}

export function deletePostRequest(postId: string): Promise<ApiResult<void>> {
  return call<void>("DELETE", `posts/${postId}`);
}

export async function addCommentRequest(
  postId: string,
  content: string,
  authors: AuthorMap,
): Promise<ApiResult<Comment>> {
  const result = await call<BackendComment>("POST", `posts/${postId}/comments`, { content });
  return result.ok ? { ok: true, data: mapComment(result.data, authors) } : result;
}
