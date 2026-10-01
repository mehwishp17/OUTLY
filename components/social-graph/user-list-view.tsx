"use client";

import Link from "next/link";
import { UserRow } from "@/components/social-graph/user-row";
import { Icon } from "@/components/ui/icon";
import { useSocialStore } from "@/context/social-store-context";
import { resolveUserSummary } from "@/lib/user-directory";

type UserListViewProps = {
  title: string;
  subtitle: string;
  userIds: string[];
  backHref: string;
  emptyMessage: string;
};

/** Shared list screen for Followers and Following — resolves each id to
 * a display-ready user via `resolveUserSummary` and renders `UserRow`. */
export function UserListView({ title, subtitle, userIds, backHref, emptyMessage }: UserListViewProps) {
  const { currentUser } = useSocialStore();
  const users = userIds
    .map((id) => resolveUserSummary(id, currentUser))
    .filter((user) => user !== undefined);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
      >
        <Icon name="chevron-left" className="h-4 w-4" />
        Back to profile
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)]">{title}</h1>
        <p className="mt-1 text-sm text-[var(--outly-muted)]">{subtitle}</p>
      </div>

      {users.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white px-5 py-10 text-center text-sm text-[var(--outly-muted)] shadow-[var(--shadow-soft)]">
          {emptyMessage}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </ul>
      )}
    </div>
  );
}
