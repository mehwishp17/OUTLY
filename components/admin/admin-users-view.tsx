"use client";

import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAdminStore } from "@/context/admin-store-context";
import { useFollowStore } from "@/context/follow-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { MOCK_OTHER_USERS } from "@/lib/mock/mock-users";
import { resolveUserSummary } from "@/lib/user-directory";

/** Admin Users: every known user, with follower counts (reused from the
 * Social Graph module) and a suspend/reinstate action. */
export function AdminUsersView() {
  const { currentUser } = useSocialStore();
  const { getFollowerIds } = useFollowStore();
  const { isUserSuspended, suspendUser, reinstateUser } = useAdminStore();

  const users = [currentUser.id, ...MOCK_OTHER_USERS.map((user) => user.id)]
    .map((id) => resolveUserSummary(id, currentUser))
    .filter((user) => user !== undefined);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
          Users
        </h1>
        <p className="mt-1 text-sm text-[var(--outly-muted)]">
          Manage account status across the platform.
        </p>
      </div>

      <AdminNav active="/admin/users" />

      <ul className="flex flex-col gap-2">
        {users.map((user) => {
          const suspended = isUserSuspended(user.id);
          return (
            <li
              key={user.id}
              className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-4 shadow-[var(--shadow-soft)] transition-shadow duration-200 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none"
            >
              <Link href={`/people/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={user.name} avatarUrl={user.avatarUrl} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--outly-ink)]">
                    {user.name}
                    {user.isCurrentUser ? (
                      <span className="ml-1.5 text-xs font-normal text-[var(--outly-muted)]">(You)</span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-[var(--outly-muted)]">
                    @{user.username} · {getFollowerIds(user.id).length} followers
                  </p>
                </div>
              </Link>

              {suspended ? (
                <span className="shrink-0 rounded-full bg-[#fbe1e8] px-2.5 py-1 text-xs font-semibold text-[#b3164c]">
                  Suspended
                </span>
              ) : null}

              {!user.isCurrentUser ? (
                <Button
                  size="md"
                  variant="secondary"
                  onClick={() =>
                    suspended ? reinstateUser(user.id, user.name) : suspendUser(user.id, user.name)
                  }
                >
                  {suspended ? "Reinstate" : "Suspend"}
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
