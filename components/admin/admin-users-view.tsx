"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useSocialStore } from "@/context/social-store-context";
import { fetchAdminUsers, setUserStatusRequest } from "@/lib/api/admin";
import type { AdminUser } from "@/lib/api/admin";
import { resolveUserSummary } from "@/lib/user-directory";

/** Admin Users (administrators): every account with its role, and a
 * suspend/reinstate action. Suspending signs the person out everywhere. */
export function AdminUsersView() {
  const { currentUser } = useSocialStore();
  const [accounts, setAccounts] = useState<AdminUser[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string>();
  const [actionError, setActionError] = useState<string>();

  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    let cancelled = false;
    void fetchAdminUsers("").then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setAccounts(result.data);
        setStatus("ready");
      } else {
        setError(result.message);
        setStatus("error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  async function toggleSuspended(user: AdminUser, suspend: boolean) {
    setActionError(undefined);
    const result = await setUserStatusRequest(user.id, suspend ? "SUSPENDED" : "ACTIVE");
    if (!result.ok) {
      setActionError(result.message);
      return;
    }
    reload();
  }

  const users = accounts.map((account) => ({
    ...account,
    avatarUrl: resolveUserSummary(account.id, currentUser)?.avatarUrl,
    isCurrentUser: account.id === currentUser.id,
    suspended: account.status === "SUSPENDED",
  }));

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

      {actionError ? (
        <p role="alert" className="text-sm text-[#B3164C]">
          {actionError}
        </p>
      ) : null}

      {status === "loading" ? (
        <LoadingState message="Loading accounts…" />
      ) : status === "error" ? (
        <ErrorState title="We couldn't load accounts" description={error} />
      ) : (
      <ul className="flex flex-col gap-2">
        {users.map((user) => {
          const suspended = user.suspended;
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
                    @{user.username} · {user.role.toLowerCase().replace("_", " ")}
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
                  onClick={() => toggleSuspended(user, !suspended)}
                >
                  {suspended ? "Reinstate" : "Suspend"}
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
      )}
    </div>
  );
}
