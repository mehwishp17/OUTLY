"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { Comment, Post } from "@/types/post";
import type { CompletedActivity, EditProfileValues, PrivacySettings, SavedPlace, UserProfile } from "@/types/profile";
import type { ExplorePlace } from "@/types/place";
import type { OnboardingData } from "@/types/onboarding";
import { fetchCompletedActivities } from "@/lib/api/activities";
import {
  addCommentRequest,
  createPostRequest,
  deleteCommentRequest,
  deletePostRequest,
  editCommentRequest,
  editPostRequest,
  likeRequest,
  loadFeed,
  loadGroupFeed,
  loadPost,
  saveRequest,
  uploadPostImage,
} from "@/lib/api/feed";
import { fetchMyGroupNames } from "@/lib/api/groups";
import { fetchSavedExplore, savedFromPlace, setExploreSaved } from "@/lib/api/places";
import {
  fetchMyProfile,
  patchMyProfile,
  profileInterests,
  profileName,
  profilePhoto,
  rememberBackendUser,
  removeMyAvatar,
  uploadMyAvatar,
} from "@/lib/api/profile";
import type { MyProfile } from "@/lib/api/profile";
import { clearUserDirectory, getUserDirectoryVersion, subscribeUserDirectory } from "@/lib/user-directory";

export type FeedStatus = "idle" | "loading" | "ready" | "error";

/** Public routes never need the signed-in user, so nothing is fetched there. */
const PUBLIC_PATHS = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"];

type LoadError = { message: string; status: number };

/** Photos chosen in the post composer: `url` is the local preview, `file` is what gets uploaded. */
export type PostImageFile = { url: string; file: File };

export type PostValues = {
  content: string;
  location?: string;
  /** Image URLs left on the post (existing http URLs + new local previews), in order. */
  images?: string[];
  /** The new local images that need uploading. */
  files?: PostImageFile[];
  groupId?: string;
};

type SocialStoreValue = {
  /**
   * The signed-in user. Everything comes from the OUTLY backend: the profile
   * (`GET /users/me`), saved places, completed activities and joined groups.
   * `id` is the backend user id ("" until the profile has loaded).
   */
  currentUser: UserProfile;
  /** Whether the signed-in user's profile has loaded from the backend. */
  currentUserStatus: FeedStatus;
  /** Clears the signed-in user's data; call on log out and after logging in. */
  resetSession: () => void;
  /** Reloads saved places, activity history and joined groups (call after those change elsewhere). */
  refreshProfileExtras: () => Promise<void>;
  posts: Post[];
  /** Backend user id of the signed-in account (null until the profile loads). */
  viewerId: string | null;
  isCurrentUser: (userId: string) => boolean;
  feedStatus: FeedStatus;
  feedError: LoadError | null;
  /** Re-fetches the Home Feed (posts + comments) from the backend. */
  refreshFeed: () => Promise<void>;
  /** Loads the Home Feed once; no-op while loaded or loading. */
  ensureFeedLoaded: () => Promise<void>;
  /** Loads one post by id (for links to a post that is not in the feed). */
  loadPostById: (postId: string) => Promise<LoadError | null>;
  /** Loads a group's own feed into `posts` (filter by `groupId`). */
  loadGroupPosts: (groupId: string) => Promise<LoadError | null>;
  getPostById: (postId: string) => Post | undefined;
  /** Every action resolves with an error message on failure, so the UI
   * never shows a change the backend rejected. */
  createPost: (values: PostValues) => Promise<{ post?: Post; error?: string }>;
  editPost: (postId: string, values: PostValues) => Promise<string | undefined>;
  deletePost: (postId: string) => Promise<string | undefined>;
  /** Optimistic: the UI updates at once and rolls back if the backend refuses. */
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  addComment: (postId: string, content: string) => Promise<string | undefined>;
  editComment: (postId: string, commentId: string, content: string) => Promise<string | undefined>;
  deleteComment: (postId: string, commentId: string) => Promise<string | undefined>;
  /** Saves name/username/bio/interests/location/skill level; resolves with an error message on failure. */
  updateProfile: (values: EditProfileValues) => Promise<string | undefined>;
  /** Uploads `file` as the new avatar, or removes the avatar when `avatarUrl` is undefined. */
  updateAvatar: (avatarUrl: string | undefined, file?: File) => Promise<string | undefined>;
  updatePrivacySettings: (settings: PrivacySettings) => Promise<string | undefined>;
  /** Saves what the person chose during onboarding (interests, level, location). */
  saveOnboarding: (data: OnboardingData) => Promise<string | undefined>;
  /** Saved places are keyed by `exploreKey` ("place-3" / "trail-5"). */
  removeSavedPlace: (key: string) => void;
  isPlaceSaved: (key: string) => boolean;
  toggleSavePlace: (place: ExplorePlace) => void;
};

const SocialStoreContext = createContext<SocialStoreValue | null>(null);

const BLANK_USER: UserProfile = {
  id: "",
  name: "",
  username: "",
  avatarUrl: undefined,
  location: undefined,
  bio: undefined,
  interests: [],
  skillLevel: "beginner",
  joinedCommunities: [],
  savedPlaces: [],
  completedActivities: [],
  privacy: { profileVisibility: "public", showActivityHistory: true, showSavedPlaces: true },
};

/** Uploads each new photo; returns the media ids in order, or the first error. */
async function uploadFiles(files: PostImageFile[]): Promise<{ ids: number[]; error?: string }> {
  const ids: number[] = [];
  for (const { file } of files) {
    const uploaded = await uploadPostImage(file);
    if (!uploaded.ok) return { ids, error: uploaded.message };
    ids.push(uploaded.data.id);
  }
  return { ids };
}

/** Saved places, completed activities and joined groups, loaded together. */
async function loadProfileExtras() {
  const [saved, history, groups] = await Promise.all([
    fetchSavedExplore(),
    fetchCompletedActivities(),
    fetchMyGroupNames(),
  ]);
  return { saved, history, groups };
}

function replacePost(posts: Post[], postId: string, change: (post: Post) => Post): Post[] {
  return posts.map((post) => (post.id === postId ? change(post) : post));
}

export function SocialStoreProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const postsRef = useRef<Post[]>([]);
  const [me, setMe] = useState<MyProfile | null>(null);
  const [meStatus, setMeStatus] = useState<FeedStatus>("idle");
  const meStatusRef = useRef<FeedStatus>("idle");
  const meRef = useRef<MyProfile | null>(null);
  const meInflightRef = useRef<Promise<{ profile?: MyProfile; error?: LoadError }> | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [completedActivities, setCompletedActivities] = useState<CompletedActivity[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>([]);
  const [feedStatus, setFeedStatus] = useState<FeedStatus>("idle");
  const [feedError, setFeedError] = useState<LoadError | null>(null);
  const feedStatusRef = useRef<FeedStatus>("idle");
  const inflightRef = useRef<Promise<void> | null>(null);
  // Re-render consumers whenever the shared user directory learns about someone.
  const directoryVersion = useSyncExternalStore(subscribeUserDirectory, getUserDirectoryVersion, () => 0);

  const viewerId = me ? String(me.user_id) : null;

  const setPostList = useCallback((updater: (current: Post[]) => Post[]) => {
    const next = updater(postsRef.current);
    postsRef.current = next;
    setPosts(next);
  }, []);

  const currentUser = useMemo<UserProfile>(() => {
    if (!me) return { ...BLANK_USER, savedPlaces, completedActivities, joinedCommunities };
    const privacy = me.privacy_settings ?? {};
    return {
      id: String(me.user_id),
      role: me.role,
      name: profileName(me),
      username: me.username,
      avatarUrl: profilePhoto(me),
      location: me.location || undefined,
      bio: me.bio || undefined,
      interests: profileInterests(me),
      skillLevel: me.skill_level ?? "beginner",
      joinedCommunities,
      savedPlaces,
      completedActivities,
      privacy: {
        profileVisibility: privacy.profileVisibility ?? "public",
        showActivityHistory: privacy.showActivityHistory ?? true,
        showSavedPlaces: privacy.showSavedPlaces ?? true,
      },
    };
  }, [me, savedPlaces, completedActivities, joinedCommunities]);

  const isCurrentUser = useCallback((userId: string) => Boolean(viewerId) && userId === viewerId, [viewerId]);

  const setMeState = useCallback((status: FeedStatus) => {
    meStatusRef.current = status;
    setMeStatus(status);
  }, []);

  const applyMe = useCallback((profile: MyProfile) => {
    meRef.current = profile;
    setMe(profile);
    rememberBackendUser({
      user_id: profile.user_id,
      username: profile.username,
      display_name: profile.display_name,
      photo: profile.photo ?? null,
      bio: profile.bio,
      location: profile.location,
      interests: profile.interests,
      skill_level: profile.skill_level,
    });
  }, []);

  /** Single place the signed-in user is fetched; concurrent callers share one request. */
  const loadMe = useCallback((): Promise<{ profile?: MyProfile; error?: LoadError }> => {
    if (meInflightRef.current) return meInflightRef.current;
    meInflightRef.current = (async () => {
      setMeState("loading");
      const result = await fetchMyProfile();
      if (result.ok) {
        applyMe(result.data);
        setMeState("ready");
        return { profile: result.data };
      }
      setMeState("error");
      return { error: { message: result.message, status: result.status } };
    })().finally(() => {
      meInflightRef.current = null;
    });
    return meInflightRef.current;
  }, [setMeState, applyMe]);

  const refreshProfileExtras = useCallback(async () => {
    const extras = await loadProfileExtras();
    if (extras.saved.ok) setSavedPlaces(extras.saved.data);
    if (extras.history.ok) setCompletedActivities(extras.history.data);
    if (extras.groups.ok) setJoinedCommunities(extras.groups.data);
  }, []);

  const setStatus = useCallback((status: FeedStatus) => {
    feedStatusRef.current = status;
    setFeedStatus(status);
  }, []);

  const refreshFeed = useCallback((): Promise<void> => {
    if (inflightRef.current) return inflightRef.current;
    inflightRef.current = (async () => {
      // Keep showing the loaded feed while refreshing in the background.
      if (feedStatusRef.current !== "ready") setStatus("loading");
      if (!meRef.current) {
        const mine = await loadMe();
        if (!mine.profile) {
          setFeedError(mine.error ?? { message: "We couldn't load your profile.", status: 0 });
          setStatus("error");
          return;
        }
      }
      const result = await loadFeed();
      if (result.ok) {
        setFeedError(null);
        setPostList((current) => {
          const fresh = new Set(result.data.map((post) => post.id));
          // Keep posts that came from elsewhere (a group feed, a direct link).
          return [...result.data, ...current.filter((post) => !fresh.has(post.id))];
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
  }, [setStatus, loadMe, setPostList]);

  const ensureFeedLoaded = useCallback(async () => {
    if (feedStatusRef.current === "idle" || feedStatusRef.current === "error") await refreshFeed();
  }, [refreshFeed]);

  const loadPostById = useCallback(
    async (postId: string): Promise<LoadError | null> => {
      if (postsRef.current.some((post) => post.id === postId)) return null;
      const result = await loadPost(postId);
      if (!result.ok) return { message: result.message, status: result.status };
      setPostList((current) => (current.some((post) => post.id === postId) ? current : [...current, result.data]));
      return null;
    },
    [setPostList],
  );

  const loadGroupPosts = useCallback(
    async (groupId: string): Promise<LoadError | null> => {
      const result = await loadGroupFeed(groupId);
      if (!result.ok) return { message: result.message, status: result.status };
      setPostList((current) => {
        const fresh = new Set(result.data.map((post) => post.id));
        return [...result.data, ...current.filter((post) => !fresh.has(post.id) && post.groupId !== groupId)];
      });
      return null;
    },
    [setPostList],
  );

  const getPostById = useCallback((postId: string) => posts.find((post) => post.id === postId), [posts]);

  const createPost = useCallback(
    async (values: PostValues) => {
      const uploaded = await uploadFiles(values.files ?? []);
      if (uploaded.error) return { error: uploaded.error };
      const result = await createPostRequest({
        caption: values.content,
        location: values.location,
        mediaIds: uploaded.ids,
        groupId: values.groupId,
      });
      if (!result.ok) return { error: result.message };
      setPostList((current) => [result.data, ...current]);
      return { post: result.data };
    },
    [setPostList],
  );

  const editPost = useCallback(
    async (postId: string, values: PostValues) => {
      const existing = postsRef.current.find((post) => post.id === postId);
      const uploaded = await uploadFiles(values.files ?? []);
      if (uploaded.error) return uploaded.error;
      // Keep the post's current photos that are still listed, then add the new ones.
      const keptIds = (existing?.mediaIds ?? []).filter((_, index) => values.images?.includes(existing?.images?.[index] ?? ""));
      const result = await editPostRequest(postId, {
        caption: values.content,
        location: values.location,
        mediaIds: [...keptIds, ...uploaded.ids],
      });
      if (!result.ok) return result.message;
      setPostList((current) => replacePost(current, postId, (post) => ({ ...result.data, comments: post.comments })));
      return undefined;
    },
    [setPostList],
  );

  const deletePost = useCallback(
    async (postId: string) => {
      const result = await deletePostRequest(postId);
      if (!result.ok) return result.message;
      setPostList((current) => current.filter((post) => post.id !== postId));
      return undefined;
    },
    [setPostList],
  );

  const toggleLike = useCallback(
    (postId: string) => {
      const post = postsRef.current.find((candidate) => candidate.id === postId);
      if (!post) return;
      const liking = !post.likedByCurrentUser;
      const apply = (liked: boolean, count: number) =>
        setPostList((current) =>
          replacePost(current, postId, (p) => ({ ...p, likedByCurrentUser: liked, likeCount: Math.max(0, count) })),
        );
      apply(liking, post.likeCount + (liking ? 1 : -1));
      void likeRequest(postId, liking).then((result) => {
        if (!result.ok) apply(post.likedByCurrentUser, post.likeCount); // roll back
        else apply(liking, result.data.likes_count);
      });
    },
    [setPostList],
  );

  const toggleSave = useCallback(
    (postId: string) => {
      const post = postsRef.current.find((candidate) => candidate.id === postId);
      if (!post) return;
      const saving = !post.savedByCurrentUser;
      const apply = (saved: boolean) =>
        setPostList((current) => replacePost(current, postId, (p) => ({ ...p, savedByCurrentUser: saved })));
      apply(saving);
      void saveRequest(postId, saving).then((result) => {
        if (!result.ok) apply(post.savedByCurrentUser); // roll back
      });
    },
    [setPostList],
  );

  const addComment = useCallback(
    async (postId: string, content: string) => {
      const result = await addCommentRequest(postId, content.trim());
      if (!result.ok) return result.message;
      const comment: Comment = result.data;
      setPostList((current) => replacePost(current, postId, (post) => ({ ...post, comments: [...post.comments, comment] })));
      return undefined;
    },
    [setPostList],
  );

  const editComment = useCallback(
    async (postId: string, commentId: string, content: string) => {
      const result = await editCommentRequest(commentId, content.trim());
      if (!result.ok) return result.message;
      setPostList((current) =>
        replacePost(current, postId, (post) => ({
          ...post,
          comments: post.comments.map((comment) => (comment.id === commentId ? { ...comment, content: result.data.content } : comment)),
        })),
      );
      return undefined;
    },
    [setPostList],
  );

  const deleteComment = useCallback(
    async (postId: string, commentId: string) => {
      const result = await deleteCommentRequest(commentId);
      if (!result.ok) return result.message;
      setPostList((current) =>
        replacePost(current, postId, (post) => ({ ...post, comments: post.comments.filter((comment) => comment.id !== commentId) })),
      );
      return undefined;
    },
    [setPostList],
  );

  const updateProfile = useCallback(
    async (values: EditProfileValues) => {
      const result = await patchMyProfile({
        display_name: values.name.trim(),
        username: values.username.trim(),
        bio: values.bio.trim(),
        interests: values.interests,
        location: values.location.trim(),
        skill_level: values.skillLevel,
      });
      if (!result.ok) return result.message;
      applyMe({ ...(meRef.current ?? result.data), ...result.data });
      return undefined;
    },
    [applyMe],
  );

  const updateAvatar = useCallback(
    async (avatarUrl: string | undefined, file?: File) => {
      if (file) {
        const result = await uploadMyAvatar(file);
        if (!result.ok) return result.message;
        applyMe({ ...(meRef.current ?? result.data), ...result.data });
      } else if (!avatarUrl && meRef.current?.photo) {
        const result = await removeMyAvatar();
        if (!result.ok) return result.message;
        applyMe({ ...(meRef.current ?? result.data), ...result.data, photo: null });
      }
      return undefined;
    },
    [applyMe],
  );

  const updatePrivacySettings = useCallback(
    async (settings: PrivacySettings) => {
      const result = await patchMyProfile({ privacy_settings: settings });
      if (!result.ok) return result.message;
      applyMe({ ...(meRef.current ?? result.data), ...result.data });
      return undefined;
    },
    [applyMe],
  );

  const saveOnboarding = useCallback(
    async (data: OnboardingData) => {
      const result = await patchMyProfile({
        interests: data.interests,
        location: data.location.trim(),
        ...(data.activityLevel ? { skill_level: data.activityLevel } : {}),
        onboarding_completed: true,
      });
      if (!result.ok) return result.message;
      applyMe({ ...(meRef.current ?? result.data), ...result.data });
      return undefined;
    },
    [applyMe],
  );

  const isPlaceSaved = useCallback((key: string) => savedPlaces.some((place) => place.id === key), [savedPlaces]);

  const removeSavedPlace = useCallback(
    (key: string) => {
      const [kind, id] = key.split("-");
      const previous = savedPlaces;
      setSavedPlaces((current) => current.filter((place) => place.id !== key));
      void setExploreSaved(kind === "trail" ? "trail" : "place", id, false).then((result) => {
        if (!result.ok) setSavedPlaces(previous);
      });
    },
    [savedPlaces],
  );

  const toggleSavePlace = useCallback(
    (place: ExplorePlace) => {
      const saved = savedFromPlace(place);
      const previous = savedPlaces;
      const saving = !previous.some((candidate) => candidate.id === saved.id);
      setSavedPlaces(saving ? [saved, ...previous] : previous.filter((candidate) => candidate.id !== saved.id));
      void setExploreSaved(place.kind, place.id, saving).then((result) => {
        if (!result.ok) setSavedPlaces(previous);
      });
    },
    [savedPlaces],
  );

  const pathname = usePathname();

  useEffect(() => {
    if (PUBLIC_PATHS.includes(pathname)) return;
    if (meStatusRef.current === "idle") void loadMe();
  }, [pathname, loadMe]);

  // Once the profile is known, load what hangs off it.
  useEffect(() => {
    if (!viewerId) return;
    let cancelled = false;
    void loadProfileExtras().then((extras) => {
      if (cancelled) return;
      if (extras.saved.ok) setSavedPlaces(extras.saved.data);
      if (extras.history.ok) setCompletedActivities(extras.history.data);
      if (extras.groups.ok) setJoinedCommunities(extras.groups.data);
    });
    return () => {
      cancelled = true;
    };
  }, [viewerId]);

  /** Drops the signed-in user's data. Called on log out and right after a
   * successful log in / sign up, so one account's data can never show for
   * the next. */
  const resetSession = useCallback(() => {
    meRef.current = null;
    setMe(null);
    setMeState("idle");
    setSavedPlaces([]);
    setCompletedActivities([]);
    setJoinedCommunities([]);
    setFeedError(null);
    setStatus("idle");
    setPostList(() => []);
    clearUserDirectory();
  }, [setMeState, setStatus, setPostList]);

  const value = useMemo<SocialStoreValue>(
    () => ({
      currentUser,
      currentUserStatus: meStatus,
      resetSession,
      refreshProfileExtras,
      posts,
      viewerId,
      isCurrentUser,
      feedStatus,
      feedError,
      refreshFeed,
      ensureFeedLoaded,
      loadPostById,
      loadGroupPosts,
      getPostById,
      createPost,
      editPost,
      deletePost,
      toggleLike,
      toggleSave,
      addComment,
      editComment,
      deleteComment,
      updateProfile,
      updateAvatar,
      updatePrivacySettings,
      saveOnboarding,
      removeSavedPlace,
      isPlaceSaved,
      toggleSavePlace,
    }),
    // `directoryVersion` is listed so consumers re-render when the user directory grows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      currentUser,
      meStatus,
      resetSession,
      refreshProfileExtras,
      posts,
      viewerId,
      isCurrentUser,
      feedStatus,
      feedError,
      refreshFeed,
      ensureFeedLoaded,
      loadPostById,
      loadGroupPosts,
      getPostById,
      createPost,
      editPost,
      deletePost,
      toggleLike,
      toggleSave,
      addComment,
      editComment,
      deleteComment,
      updateProfile,
      updateAvatar,
      updatePrivacySettings,
      saveOnboarding,
      removeSavedPlace,
      isPlaceSaved,
      toggleSavePlace,
      directoryVersion,
    ],
  );

  return <SocialStoreContext.Provider value={value}>{children}</SocialStoreContext.Provider>;
}

/** Reads the shared profile/social state. Must be used within
 * `SocialStoreProvider` (mounted once in `app/layout.tsx`). */
export function useSocialStore(): SocialStoreValue {
  const context = useContext(SocialStoreContext);
  if (!context) {
    throw new Error("useSocialStore must be used within a SocialStoreProvider");
  }
  return context;
}
