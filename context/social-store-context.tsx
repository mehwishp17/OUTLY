"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { Comment, Post, CreatePostInput, EditPostInput } from "@/types/post";
import type { EditProfileValues, PrivacySettings, SavedPlace, UserProfile } from "@/types/profile";
import {
  addCommentRequest,
  createPostRequest,
  deletePostRequest,
  editPostRequest,
  loadFeed,
} from "@/lib/api/feed";
import type { AuthorMap } from "@/lib/api/feed";
import {
  fetchMyProfile,
  patchMyProfile,
  profileInterests,
  profileName,
  profilePhoto,
} from "@/lib/api/profile";
import type { MyProfile } from "@/lib/api/profile";
import { MOCK_POSTS } from "@/lib/mock/mock-posts";
import { MOCK_USER } from "@/lib/mock/mock-user";
import {
  addCommentToPost,
  applyEditToPost,
  buildNewComment,
  buildNewPost,
  editCommentOnPost,
  removeCommentFromPost,
  setPostHidden as applyPostHidden,
  syncSavedPlaceForPost,
  toggleLikeOnPost,
  toggleSaveOnPost,
  toggleSavedPlaceEntry,
} from "@/lib/mock/mock-social-store";

export type FeedStatus = "idle" | "loading" | "ready" | "error";

/** Public routes never need the signed-in user, so nothing is fetched there. */
const PUBLIC_PATHS = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"];

type SocialStoreValue = {
  /**
   * The signed-in user. `id`, `name`, `username`, `avatarUrl`, `bio` and
   * `interests` come from the OUTLY backend (`GET /users/me`) once loaded
   * (blank until then). `id` stays the mock id because the Events, Groups,
   * Activities, Partner and Chat modules are still mock data keyed by it;
   * `viewerId` is the real backend id. The remaining fields (location, skill
   * level, joined communities, saved places, completed activities, privacy)
   * have no backend support yet and are still the local mock values.
   */
  currentUser: UserProfile;
  /** Whether the signed-in user's profile has loaded from the backend. */
  currentUserStatus: FeedStatus;
  /** Clears the signed-in user's data; call on log out and after logging in. */
  resetSession: () => void;
  posts: Post[];
  /** Backend user id of the signed-in account (null until the feed loads). */
  viewerId: string | null;
  /** True if `userId` is the signed-in user, whether a mock id or backend id. */
  isCurrentUser: (userId: string) => boolean;
  feedStatus: FeedStatus;
  feedError: { message: string; status: number } | null;
  /** Re-fetches the Home Feed (posts + comments) from the backend. */
  refreshFeed: () => Promise<void>;
  /** Loads the Home Feed once; no-op while loaded or loading. */
  ensureFeedLoaded: () => Promise<void>;
  /** Backend-persisted post/comment actions. Each resolves with an error
   * message on failure, so the UI never shows a change the backend rejected. */
  createBackendPost: (caption: string) => Promise<{ post?: Post; error?: string }>;
  editBackendPost: (postId: string, caption: string) => Promise<string | undefined>;
  deleteBackendPost: (postId: string) => Promise<string | undefined>;
  addBackendComment: (postId: string, content: string) => Promise<string | undefined>;
  getPostById: (postId: string) => Post | undefined;
  createPost: (input: CreatePostInput) => Post;
  editPost: (postId: string, input: EditPostInput) => void;
  deletePost: (postId: string) => void;
  setPostHidden: (postId: string, hidden: boolean) => void;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  addComment: (postId: string, content: string) => void;
  editComment: (postId: string, commentId: string, content: string) => void;
  deleteComment: (postId: string, commentId: string) => void;
  /** Saves name/username/bio/interests to the backend; resolves with an error message on failure. */
  updateProfile: (values: EditProfileValues) => Promise<string | undefined>;
  updateAvatar: (avatarUrl: string | undefined) => void;
  updatePrivacySettings: (settings: PrivacySettings) => void;
  removeSavedPlace: (placeId: string) => void;
  isPlaceSaved: (placeId: string) => boolean;
  toggleSavePlace: (place: SavedPlace) => void;
};

const SocialStoreContext = createContext<SocialStoreValue | null>(null);

/**
 * Profile and social state. The Home Feed (`Post.persisted`) is loaded from
 * and saved to the OUTLY backend through the `*Backend*` actions and
 * `lib/api/feed.ts`. Everything else here (group posts, likes, saves, the
 * profile, saved places) is still session-only mock state that resets on
 * reload; docs/feed-integration.md lists exactly which Feed features are
 * still local-only.
 */
export function SocialStoreProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [localUser, setLocalUser] = useState<UserProfile>(MOCK_USER);
  const [me, setMe] = useState<MyProfile | null>(null);
  const [meStatus, setMeStatus] = useState<FeedStatus>("idle");
  const meStatusRef = useRef<FeedStatus>("idle");
  const meRef = useRef<MyProfile | null>(null);
  const meInflightRef = useRef<Promise<{ profile?: MyProfile; error?: { message: string; status: number } }> | null>(null);
  const viewerId = me ? String(me.user_id) : null;

  const currentUser = useMemo<UserProfile>(
    () => ({
      ...localUser,
      name: me ? profileName(me) : "",
      username: me?.username ?? "",
      avatarUrl: localUser.avatarUrl ?? (me ? profilePhoto(me) : undefined),
      bio: me?.bio || undefined,
      interests: me ? profileInterests(me) : [],
    }),
    [localUser, me],
  );
  const [feedStatus, setFeedStatus] = useState<FeedStatus>("idle");
  const [feedError, setFeedError] = useState<{ message: string; status: number } | null>(null);
  const authorsRef = useRef<AuthorMap>({});
  const feedStatusRef = useRef<FeedStatus>("idle");
  const inflightRef = useRef<Promise<void> | null>(null);

  const isCurrentUser = useCallback(
    (userId: string) => userId === currentUser.id || userId === viewerId,
    [currentUser.id, viewerId],
  );

  const setMeState = useCallback((status: FeedStatus) => {
    meStatusRef.current = status;
    setMeStatus(status);
  }, []);

  /** Single place the signed-in user is fetched; concurrent callers share one request. */
  const loadMe = useCallback((): Promise<{ profile?: MyProfile; error?: { message: string; status: number } }> => {
    if (meInflightRef.current) return meInflightRef.current;
    meInflightRef.current = (async () => {
      setMeState("loading");
      const result = await fetchMyProfile();
      if (result.ok) {
        meRef.current = result.data;
        setMe(result.data);
        setMeState("ready");
        return { profile: result.data };
      }
      setMeState("error");
      return { error: { message: result.message, status: result.status } };
    })().finally(() => {
      meInflightRef.current = null;
    });
    return meInflightRef.current;
  }, [setMeState]);

  const setStatus = useCallback((status: FeedStatus) => {
    feedStatusRef.current = status;
    setFeedStatus(status);
  }, []);

  const refreshFeed = useCallback((): Promise<void> => {
    if (inflightRef.current) return inflightRef.current;
    inflightRef.current = (async () => {
      // Keep showing the loaded feed while refreshing in the background.
      if (feedStatusRef.current !== "ready") setStatus("loading");
      const mine = meRef.current ? { profile: meRef.current } : await loadMe();
      if (!mine.profile) {
        setFeedError(mine.error ?? { message: "We couldn't load your profile.", status: 0 });
        setStatus("error");
        return;
      }
      const result = await loadFeed(mine.profile);
      if (result.ok) {
        authorsRef.current = result.data.authors;
        setFeedError(null);
        setPosts((current) => {
          // Likes and saves are LOCAL-ONLY (the backend has no endpoints for
          // them), so carry them over from the previous copy of each post.
          const previous = new Map(current.filter((p) => p.persisted).map((p) => [p.id, p]));
          const backendPosts = result.data.posts.map((post) => {
            const before = previous.get(post.id);
            return before
              ? {
                  ...post,
                  likeCount: before.likeCount,
                  likedByCurrentUser: before.likedByCurrentUser,
                  savedByCurrentUser: before.savedByCurrentUser,
                }
              : post;
          });
          return [...backendPosts, ...current.filter((p) => !p.persisted)];
        });
        setStatus("ready");
      } else {
        setFeedError({ message: result.message, status: result.status });
        setStatus("error");
      }
    })().finally(() => {
      inflightRef.current = null;
    });
    return inflightRef.current;
  }, [setStatus, loadMe]);

  const ensureFeedLoaded = useCallback(async () => {
    if (feedStatusRef.current === "idle" || feedStatusRef.current === "error") await refreshFeed();
  }, [refreshFeed]);

  const createBackendPost = useCallback(
    async (caption: string) => {
      await ensureFeedLoaded();
      const result = await createPostRequest(caption, authorsRef.current);
      if (!result.ok) return { error: result.message };
      setPosts((current) => [result.data, ...current]);
      return { post: result.data };
    },
    [ensureFeedLoaded],
  );

  const editBackendPost = useCallback(async (postId: string, caption: string) => {
    const result = await editPostRequest(postId, caption);
    if (!result.ok) return result.message;
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, content: result.data.caption, updatedAt: result.data.updatedAt }
          : post,
      ),
    );
    return undefined;
  }, []);

  const deleteBackendPost = useCallback(async (postId: string) => {
    const result = await deletePostRequest(postId);
    if (!result.ok) return result.message;
    setPosts((current) => current.filter((post) => post.id !== postId));
    return undefined;
  }, []);

  const addBackendComment = useCallback(async (postId: string, content: string) => {
    const result = await addCommentRequest(postId, content.trim(), authorsRef.current);
    if (!result.ok) return result.message;
    const comment: Comment = result.data;
    setPosts((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, comments: [...post.comments, comment] } : post,
      ),
    );
    return undefined;
  }, []);

  const getPostById = useCallback(
    (postId: string) => posts.find((post) => post.id === postId),
    [posts],
  );

  const createPost = useCallback(
    (input: CreatePostInput) => {
      const newPost = buildNewPost(input, currentUser);
      setPosts((current) => [newPost, ...current]);
      return newPost;
    },
    [currentUser],
  );

  const editPost = useCallback((postId: string, input: EditPostInput) => {
    setPosts((current) =>
      current.map((post) => (post.id === postId ? applyEditToPost(post, input) : post)),
    );
  }, []);

  const deletePost = useCallback((postId: string) => {
    setPosts((current) => current.filter((post) => post.id !== postId));
  }, []);

  const setPostHidden = useCallback((postId: string, hidden: boolean) => {
    setPosts((current) =>
      current.map((post) => (post.id === postId ? applyPostHidden(post, hidden) : post)),
    );
  }, []);

  const toggleLike = useCallback((postId: string) => {
    setPosts((current) =>
      current.map((post) => (post.id === postId ? toggleLikeOnPost(post) : post)),
    );
  }, []);

  const toggleSave = useCallback((postId: string) => {
    setPosts((current) => {
      const updated = current.map((post) => (post.id === postId ? toggleSaveOnPost(post) : post));
      const changedPost = updated.find((post) => post.id === postId);
      if (changedPost) {
        setLocalUser((user) => ({
          ...user,
          savedPlaces: syncSavedPlaceForPost(user.savedPlaces, changedPost),
        }));
      }
      return updated;
    });
  }, []);

  const addComment = useCallback(
    (postId: string, content: string) => {
      if (!content.trim()) return;
      const comment = buildNewComment(postId, content, currentUser);
      setPosts((current) =>
        current.map((post) => (post.id === postId ? addCommentToPost(post, comment) : post)),
      );
    },
    [currentUser],
  );

  const editComment = useCallback((postId: string, commentId: string, content: string) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId ? editCommentOnPost(post, commentId, content) : post,
      ),
    );
  }, []);

  const deleteComment = useCallback((postId: string, commentId: string) => {
    setPosts((current) =>
      current.map((post) => (post.id === postId ? removeCommentFromPost(post, commentId) : post)),
    );
  }, []);

  const updateProfile = useCallback(async (values: EditProfileValues) => {
    const result = await patchMyProfile({
      display_name: values.name.trim(),
      username: values.username.trim(),
      bio: values.bio.trim(),
      interests: values.interests,
    });
    if (!result.ok) return result.message;

    meRef.current = result.data;
    setMe(result.data);
    authorsRef.current = {
      ...authorsRef.current,
      [String(result.data.user_id)]: { name: profileName(result.data), avatarUrl: profilePhoto(result.data) },
    };
    // Location and skill level have no backend field yet: local-only.
    setLocalUser((current) => ({
      ...current,
      location: values.location.trim() || undefined,
      skillLevel: values.skillLevel,
    }));
    return undefined;
  }, []);

  const updateAvatar = useCallback((avatarUrl: string | undefined) => {
    setLocalUser((current) => ({ ...current, avatarUrl }));
  }, []);

  const updatePrivacySettings = useCallback((settings: PrivacySettings) => {
    setLocalUser((current) => ({ ...current, privacy: settings }));
  }, []);

  const removeSavedPlace = useCallback((placeId: string) => {
    setLocalUser((current) => ({
      ...current,
      savedPlaces: current.savedPlaces.filter((place) => place.id !== placeId),
    }));
  }, []);

  const isPlaceSaved = useCallback(
    (placeId: string) => currentUser.savedPlaces.some((place) => place.id === placeId),
    [currentUser.savedPlaces],
  );

  const toggleSavePlace = useCallback((place: SavedPlace) => {
    setLocalUser((current) => ({
      ...current,
      savedPlaces: toggleSavedPlaceEntry(current.savedPlaces, place),
    }));
  }, []);

  const pathname = usePathname();

  useEffect(() => {
    if (PUBLIC_PATHS.includes(pathname)) return;
    if (meStatusRef.current === "idle") void loadMe();
  }, [pathname, loadMe]);

  /** Drops the signed-in user's data (profile, backend posts). Called on log
   * out and right after a successful log in / sign up, so one account's data
   * can never show for the next. */
  const resetSession = useCallback(() => {
    meRef.current = null;
    setMe(null);
    setMeState("idle");
    setLocalUser(MOCK_USER);
    authorsRef.current = {};
    setFeedError(null);
    setStatus("idle");
    setPosts((current) => current.filter((post) => !post.persisted));
  }, [setMeState, setStatus]);

  const value = useMemo<SocialStoreValue>(
    () => ({
      currentUser,
      currentUserStatus: meStatus,
      resetSession,
      posts,
      viewerId,
      isCurrentUser,
      feedStatus,
      feedError,
      refreshFeed,
      ensureFeedLoaded,
      createBackendPost,
      editBackendPost,
      deleteBackendPost,
      addBackendComment,
      getPostById,
      createPost,
      editPost,
      deletePost,
      setPostHidden,
      toggleLike,
      toggleSave,
      addComment,
      editComment,
      deleteComment,
      updateProfile,
      updateAvatar,
      updatePrivacySettings,
      removeSavedPlace,
      isPlaceSaved,
      toggleSavePlace,
    }),
    [
      currentUser,
      meStatus,
      resetSession,
      posts,
      viewerId,
      isCurrentUser,
      feedStatus,
      feedError,
      refreshFeed,
      ensureFeedLoaded,
      createBackendPost,
      editBackendPost,
      deleteBackendPost,
      addBackendComment,
      getPostById,
      createPost,
      editPost,
      deletePost,
      setPostHidden,
      toggleLike,
      toggleSave,
      addComment,
      editComment,
      deleteComment,
      updateProfile,
      updateAvatar,
      updatePrivacySettings,
      removeSavedPlace,
      isPlaceSaved,
      toggleSavePlace,
    ],
  );

  return <SocialStoreContext.Provider value={value}>{children}</SocialStoreContext.Provider>;
}

/** Reads the shared mock profile/social state. Must be used within
 * `SocialStoreProvider` (mounted once in `app/layout.tsx`). */
export function useSocialStore(): SocialStoreValue {
  const context = useContext(SocialStoreContext);
  if (!context) {
    throw new Error("useSocialStore must be used within a SocialStoreProvider");
  }
  return context;
}
