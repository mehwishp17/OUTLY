import type { UserProfile } from "@/types/profile";

/**
 * Directory of the people the UI has seen so far.
 *
 * Every API response that mentions a person (post authors, comment authors,
 * group members, event participants, chat participants, follower lists,
 * search results, notification actors...) registers them here through
 * `rememberUser`, so any component can turn a user id into a display-ready
 * summary synchronously with `resolveUserSummary`. People we have not seen
 * yet are fetched on demand (`ensureUser` in `lib/api/users.ts`).
 *
 * `subscribe`/`getVersion` let the social store re-render consumers whenever
 * the directory grows (see `SocialStoreProvider`).
 */

export type ResolvedUser = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  interests: string[];
  skillLevel: UserProfile["skillLevel"];
  isCurrentUser: boolean;
  /** True when the profile is restricted by the person's privacy settings. */
  restricted?: boolean;
};

type Entry = Omit<ResolvedUser, "isCurrentUser">;

const entries = new Map<string, Entry>();
const listeners = new Set<() => void>();
let version = 0;
let notifyScheduled = false;

function scheduleNotify() {
  if (notifyScheduled) return;
  notifyScheduled = true;
  queueMicrotask(() => {
    notifyScheduled = false;
    version += 1;
    listeners.forEach((listener) => listener());
  });
}

export function subscribeUserDirectory(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getUserDirectoryVersion(): number {
  return version;
}

export type RememberedUser = {
  id: string;
  name?: string;
  username?: string;
  avatarUrl?: string | null;
  bio?: string;
  location?: string;
  interests?: string[];
  skillLevel?: UserProfile["skillLevel"];
  restricted?: boolean;
};

/** Adds or enriches a person. Later calls only overwrite fields they provide. */
export function rememberUser(user: RememberedUser): void {
  const id = String(user.id);
  const previous = entries.get(id);
  const next: Entry = {
    id,
    name: user.name || previous?.name || user.username || "OUTLY member",
    username: user.username || previous?.username || "",
    avatarUrl: user.avatarUrl === undefined ? previous?.avatarUrl : (user.avatarUrl ?? undefined),
    bio: user.bio ?? previous?.bio,
    location: user.location ?? previous?.location,
    interests: user.interests ?? previous?.interests ?? [],
    skillLevel: user.skillLevel ?? previous?.skillLevel ?? "beginner",
    restricted: user.restricted ?? previous?.restricted,
  };
  if (
    previous &&
    previous.name === next.name &&
    previous.username === next.username &&
    previous.avatarUrl === next.avatarUrl &&
    previous.bio === next.bio &&
    previous.location === next.location &&
    previous.restricted === next.restricted &&
    previous.interests.join("|") === next.interests.join("|") &&
    previous.skillLevel === next.skillLevel
  ) {
    return;
  }
  entries.set(id, next);
  scheduleNotify();
}

export function hasUser(userId: string): boolean {
  return entries.has(String(userId));
}

/** Forgets everyone (called when the session changes). */
export function clearUserDirectory(): void {
  entries.clear();
  scheduleNotify();
}

/**
 * Name/avatar to show for a person listed in a module (group members, event
 * participants, ...). When the entry is the signed-in user, the live profile
 * (which may have a newer name/avatar than the list that loaded) wins.
 */
export function displayPerson(
  person: { id: string; name: string; avatarUrl?: string },
  currentUser: UserProfile,
): { name: string; avatarUrl?: string } {
  return person.id === currentUser.id
    ? { name: currentUser.name || "You", avatarUrl: currentUser.avatarUrl }
    : { name: person.name, avatarUrl: person.avatarUrl };
}

/**
 * Resolves any user id to a display-ready summary: the signed-in user comes
 * from the live profile in the social store, everyone else from the
 * directory. Returns `undefined` for people not loaded yet.
 */
export function resolveUserSummary(userId: string, currentUser: UserProfile): ResolvedUser | undefined {
  if (currentUser.id && userId === currentUser.id) {
    return {
      id: currentUser.id,
      name: currentUser.name,
      username: currentUser.username,
      avatarUrl: currentUser.avatarUrl,
      bio: currentUser.bio,
      location: currentUser.location,
      interests: currentUser.interests,
      skillLevel: currentUser.skillLevel,
      isCurrentUser: true,
    };
  }

  const entry = entries.get(String(userId));
  return entry ? { ...entry, isCurrentUser: false } : undefined;
}
