"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { useSocialStore } from "@/context/social-store-context";
import { createReportRequest } from "@/lib/api/admin";
import type { NewReport } from "@/lib/api/admin";

export type CreateReportInput = NewReport;

type AdminStoreValue = {
  /** Files a report against a post, person, ...; resolves with an error message on failure. */
  createReport: (input: CreateReportInput) => Promise<string | undefined>;
  /** The signed-in account's backend role (staff screens are gated by it; the backend enforces it too). */
  role: string | undefined;
  /** Moderators and administrators: reports, content and events. */
  isModerator: boolean;
  /** Administrators only: users, places, audit log and analytics. */
  isAdministrator: boolean;
};

const AdminStoreContext = createContext<AdminStoreValue | null>(null);

/**
 * Reporting and staff-role state. Reports, moderation actions, the audit log
 * and analytics all live in the OUTLY backend (`lib/api/admin.ts`) and are
 * loaded by the Admin screens themselves; the role comes from the signed-in
 * profile. Showing or hiding a screen here is only a convenience: the
 * backend refuses every staff action from an account without the role.
 */
export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useSocialStore();
  const role = currentUser.role;

  const createReport = useCallback(async (input: CreateReportInput) => {
    const result = await createReportRequest(input);
    return result.ok ? undefined : result.message;
  }, []);

  const value = useMemo<AdminStoreValue>(
    () => ({
      createReport,
      role,
      isModerator: role === "CONTENT_MODERATOR" || role === "ADMINISTRATOR",
      isAdministrator: role === "ADMINISTRATOR",
    }),
    [createReport, role],
  );

  return <AdminStoreContext.Provider value={value}>{children}</AdminStoreContext.Provider>;
}

export function useAdminStore(): AdminStoreValue {
  const context = useContext(AdminStoreContext);
  if (!context) {
    throw new Error("useAdminStore must be used within an AdminStoreProvider");
  }
  return context;
}
