"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useAdminStore } from "@/context/admin-store-context";
import { useSocialStore } from "@/context/social-store-context";

type AdminAccessGateProps = {
  /** `moderator`: moderators and administrators. `administrator`: administrators only. */
  level: "moderator" | "administrator";
  children: ReactNode;
};

/**
 * Shows an Admin screen only to accounts with the right staff role. This is
 * a convenience, not security: the backend independently refuses every staff
 * request from an account without the role.
 */
export function AdminAccessGate({ level, children }: AdminAccessGateProps) {
  const { currentUserStatus } = useSocialStore();
  const { isModerator, isAdministrator } = useAdminStore();

  if (currentUserStatus === "idle" || currentUserStatus === "loading") {
    return <LoadingState message="Checking your access…" />;
  }

  const allowed = level === "administrator" ? isAdministrator : isModerator;
  if (!allowed) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          icon="lock"
          title="You don't have access to this area"
          description="Admin tools are only available to OUTLY moderators and administrators."
          action={
            <Link href="/feed" className="text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]">
              Back to the feed
            </Link>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}
