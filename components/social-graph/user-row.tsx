import Link from "next/link";
import { FollowButton } from "@/components/social-graph/follow-button";
import { Avatar } from "@/components/ui/avatar";
import type { ResolvedUser } from "@/lib/user-directory";

type UserRowProps = {
  user: ResolvedUser;
  showBio?: boolean;
};

/** Shared user row for User Search results and Followers/Following
 * lists — avatar, name/username, optional bio snippet, and a
 * Follow/Unfollow button (hidden for the current user's own row). */
export function UserRow({ user, showBio = false }: UserRowProps) {
  return (
    <li className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-4 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Link href={`/people/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={user.name} avatarUrl={user.avatarUrl} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--outly-ink)]">
            {user.name}
            {user.isCurrentUser ? <span className="ml-1.5 text-xs font-normal text-[var(--outly-muted)]">(You)</span> : null}
          </p>
          <p className="truncate text-xs text-[var(--outly-muted)]">@{user.username}</p>
          {showBio && user.bio ? (
            <p className="mt-0.5 truncate text-xs text-[var(--outly-muted)]">{user.bio}</p>
          ) : null}
        </div>
      </Link>
      {!user.isCurrentUser ? <FollowButton userId={user.id} /> : null}
    </li>
  );
}
