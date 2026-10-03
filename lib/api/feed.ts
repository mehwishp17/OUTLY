import { callBackend, fetchAll } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import { rememberBackendUser } from "@/lib/api/profile";
import type { Comment, Post } from "@/types/post";

/**
 * Client for the Feed (posts, media, likes, saves, comments), reached through
 * the `/api/backend/*` pass-through. Used by the social store for the Home
 * Feed and by the group store for Group Feeds (group posts are posts with a
 * `group_id`).
 *
 *   GET    posts/                  the feed (own + followed + group + public)
 *   GET    posts/{id}/             one post
 *   POST   posts/                  create  { caption, location?, media_ids?, group_id? }
 *   PATCH  posts/{id}/             edit
 *   DELETE posts/{id}/             delete
 *   POST/DELETE posts/{id}/like/   like / unlike
 *   POST/DELETE posts/{id}/save/   save / unsave
 *   GET/POST posts/{id}/comments/  list / add
 *   PATCH/DELETE comments/{id}/    edit / delete a comment
 *   POST   media/                  upload one image (multipart)
 */

export type BackendPost = {
  id: number;
  author_id: number;
  author_name?: string;
  author_username?: string;
  author_photo?: string | null;
  caption: string;
  location?: string;
  visibility?: string;
  group_id?: number | null;
  status: string;
  photos?: string[];
  media?: { id: number; url: string }[];
  likes_count: number;
  comments_count: number;
  is_liked?: boolean;
  is_saved?: boolean;
  created_at: string;
  updated_at: string;
};

export type BackendComment = {
  id: number;
  post: number;
  author_id: number;
  author_name?: string;
  author_username?: string;
  author_photo?: string | null;
  content: string;
  edited?: boolean;
  created_at: string;
};

function remember(raw: { author_id: number; author_name?: string; author_username?: string; author_photo?: string | null }) {
  return rememberBackendUser({
    user_id: raw.author_id,
    username: raw.author_username,
    display_name: raw.author_name,
    photo: raw.author_photo ?? null,
  });
}

export function mapComment(raw: BackendComment): Comment {
  const authorId = remember(raw);
  return {
    id: String(raw.id),
    postId: String(raw.post),
    authorId,
    authorName: raw.author_name || raw.author_username || "OUTLY member",
    authorAvatarUrl: raw.author_photo || undefined,
    content: raw.content,
    createdAt: raw.created_at,
    persisted: true,
  };
}

export function mapPost(raw: BackendPost, comments: Comment[] = []): Post {
  const authorId = remember(raw);
  return {
    id: String(raw.id),
    authorId,
    authorName: raw.author_name || raw.author_username || "OUTLY member",
    authorAvatarUrl: raw.author_photo || undefined,
    content: raw.caption,
    location: raw.location || undefined,
    groupId: raw.group_id ? String(raw.group_id) : undefined,
    images: raw.photos && raw.photos.length > 0 ? raw.photos : undefined,
    mediaIds: raw.media && raw.media.length > 0 ? raw.media.map((m) => m.id) : undefined,
    createdAt: raw.created_at,
    // The backend stamps updated_at a few microseconds after created_at on a new
    // post, so only treat a post as edited when they differ by over a second.
    updatedAt:
      new Date(raw.updated_at).getTime() - new Date(raw.created_at).getTime() > 1000 ? raw.updated_at : undefined,
    likeCount: raw.likes_count,
    likedByCurrentUser: Boolean(raw.is_liked),
    savedByCurrentUser: Boolean(raw.is_saved),
    comments,
    persisted: true,
  };
}

/** Comments are loaded only for posts that have some (one request each, in parallel). */
async function attachComments(raws: BackendPost[]): Promise<Post[]> {
  const lists = await Promise.all(
    raws.map(async (post) => {
      if (!post.comments_count) return [] as Comment[];
      const result = await fetchAll<BackendComment>(`posts/${post.id}/comments`, 200);
      return result.ok ? result.data.map(mapComment) : [];
    }),
  );
  return raws.map((post, index) => mapPost(post, lists[index]));
}

/** The Home Feed: newest 100 posts the viewer may see, with their comments. */
export async function loadFeed(): Promise<ApiResult<Post[]>> {
  const list = await fetchAll<BackendPost>("posts", 100);
  if (!list.ok) return list;
  return { ok: true, data: await attachComments(list.data.filter((post) => post.status === "ACTIVE")) };
}

/** A single post (for a direct link to a post that is not in the feed page). */
export async function loadPost(postId: string): Promise<ApiResult<Post>> {
  const result = await callBackend<BackendPost>("GET", `posts/${postId}`);
  if (!result.ok) return result;
  const [post] = await attachComments([result.data]);
  return { ok: true, data: post };
}

/** One group's feed (the group's own posts). */
export async function loadGroupFeed(groupId: string): Promise<ApiResult<Post[]>> {
  const list = await fetchAll<BackendPost>(`groups/${groupId}/feed`, 100);
  if (!list.ok) return list;
  return { ok: true, data: await attachComments(list.data) };
}

export type PostInput = { caption: string; location?: string; mediaIds?: number[]; groupId?: string };

export async function createPostRequest(input: PostInput): Promise<ApiResult<Post>> {
  const body: Record<string, unknown> = { caption: input.caption };
  if (input.location) body.location = input.location;
  if (input.mediaIds && input.mediaIds.length > 0) body.media_ids = input.mediaIds;
  const result = input.groupId
    ? await callBackend<BackendPost>("POST", `groups/${input.groupId}/feed`, body)
    : await callBackend<BackendPost>("POST", "posts", body);
  return result.ok ? { ok: true, data: mapPost(result.data) } : result;
}

export async function editPostRequest(
  postId: string,
  input: { caption: string; location?: string; mediaIds?: number[] },
): Promise<ApiResult<Post>> {
  const body: Record<string, unknown> = { caption: input.caption, location: input.location ?? "" };
  if (input.mediaIds) body.media_ids = input.mediaIds;
  const result = await callBackend<BackendPost>("PATCH", `posts/${postId}`, body);
  return result.ok ? { ok: true, data: mapPost(result.data) } : result;
}

export function deletePostRequest(postId: string): Promise<ApiResult<void>> {
  return callBackend<void>("DELETE", `posts/${postId}`);
}

export function likeRequest(postId: string, like: boolean): Promise<ApiResult<{ likes_count: number }>> {
  return callBackend(like ? "POST" : "DELETE", `posts/${postId}/like`);
}

export function saveRequest(postId: string, save: boolean): Promise<ApiResult<{ saves_count: number }>> {
  return callBackend(save ? "POST" : "DELETE", `posts/${postId}/save`);
}

export async function addCommentRequest(postId: string, content: string): Promise<ApiResult<Comment>> {
  const result = await callBackend<BackendComment>("POST", `posts/${postId}/comments`, { content });
  return result.ok ? { ok: true, data: mapComment(result.data) } : result;
}

export async function editCommentRequest(commentId: string, content: string): Promise<ApiResult<Comment>> {
  const result = await callBackend<BackendComment>("PATCH", `comments/${commentId}`, { content });
  return result.ok ? { ok: true, data: mapComment(result.data) } : result;
}

export function deleteCommentRequest(commentId: string): Promise<ApiResult<void>> {
  return callBackend<void>("DELETE", `comments/${commentId}`);
}

/** Uploads one image and returns the media id to attach to a post. */
export async function uploadPostImage(file: File): Promise<ApiResult<{ id: number; url: string }>> {
  const form = new FormData();
  form.append("file", file);
  return callBackend<{ id: number; url: string }>("POST", "media", form);
}
