"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { MOCK_MODERATION_LOG, MOCK_REPORTS } from "@/lib/mock/mock-reports";
import type {
  ModerationActionType,
  ModerationLogEntry,
  Report,
  ReportReason,
  ReportTargetType,
} from "@/types/report";

export type CreateReportInput = {
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  reason: ReportReason;
  description?: string;
  reporterId: string;
};

type AdminStoreValue = {
  reports: Report[];
  moderationLog: ModerationLogEntry[];
  suspendedUserIds: string[];
  createReport: (input: CreateReportInput) => void;
  resolveReport: (reportId: string, resolution: "actioned" | "dismissed", note?: string) => void;
  isUserSuspended: (userId: string) => boolean;
  suspendUser: (userId: string, targetLabel: string) => void;
  reinstateUser: (userId: string, targetLabel: string) => void;
  isPlaceVerified: (placeId: string, seedVerified: boolean) => boolean;
  setPlaceVerified: (placeId: string, targetLabel: string, verified: boolean) => void;
  logAction: (action: ModerationActionType, targetLabel: string, note?: string) => void;
};

const AdminStoreContext = createContext<AdminStoreValue | null>(null);

let localReportIdCounter = 0;
let localLogIdCounter = 0;

function nextReportId(): string {
  localReportIdCounter += 1;
  return `report-local-${Date.now()}-${localReportIdCounter}`;
}

function nextLogId(): string {
  localLogIdCounter += 1;
  return `modlog-local-${Date.now()}-${localLogIdCounter}`;
}

/**
 * Session-only mock "backend" for the Admin module's Reports and
 * Moderation screens, plus the moderation-relevant flags (user
 * suspension, place verification overrides) referenced by the Users and
 * Places screens. Post hide/unhide lives in `social-store-context`
 * instead, since post state belongs with posts. Nothing here persists
 * beyond the current browser session, and — per the platform's Roles &
 * Permission Model — none of this is real authorization; a real backend
 * would still need to enforce every one of these actions itself.
 */
export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [moderationLog, setModerationLog] = useState<ModerationLogEntry[]>(MOCK_MODERATION_LOG);
  const [suspendedUserIds, setSuspendedUserIds] = useState<string[]>([]);
  const [placeVerificationOverrides, setPlaceVerificationOverrides] = useState<Record<string, boolean>>({});

  const appendLog = useCallback((action: ModerationActionType, targetLabel: string, note?: string) => {
    setModerationLog((current) => [
      { id: nextLogId(), action, targetLabel, note, createdAt: new Date().toISOString() },
      ...current,
    ]);
  }, []);

  const createReport = useCallback((input: CreateReportInput) => {
    const newReport: Report = {
      id: nextReportId(),
      reporterId: input.reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      targetLabel: input.targetLabel,
      reason: input.reason,
      description: input.description?.trim() || undefined,
      status: "open",
      createdAt: new Date().toISOString(),
    };
    setReports((current) => [newReport, ...current]);
  }, []);

  const resolveReport = useCallback(
    (reportId: string, resolution: "actioned" | "dismissed", note?: string) => {
      setReports((current) =>
        current.map((report) => (report.id === reportId ? { ...report, status: resolution } : report)),
      );
      const report = reports.find((candidate) => candidate.id === reportId);
      if (report) {
        appendLog(
          resolution === "actioned" ? "report_actioned" : "report_dismissed",
          report.targetLabel,
          note,
        );
      }
    },
    [reports, appendLog],
  );

  const isUserSuspended = useCallback(
    (userId: string) => suspendedUserIds.includes(userId),
    [suspendedUserIds],
  );

  const suspendUser = useCallback(
    (userId: string, targetLabel: string) => {
      setSuspendedUserIds((current) => (current.includes(userId) ? current : [...current, userId]));
      appendLog("user_suspended", targetLabel);
    },
    [appendLog],
  );

  const reinstateUser = useCallback(
    (userId: string, targetLabel: string) => {
      setSuspendedUserIds((current) => current.filter((id) => id !== userId));
      appendLog("user_reinstated", targetLabel);
    },
    [appendLog],
  );

  const isPlaceVerified = useCallback(
    (placeId: string, seedVerified: boolean) => placeVerificationOverrides[placeId] ?? seedVerified,
    [placeVerificationOverrides],
  );

  const setPlaceVerified = useCallback(
    (placeId: string, targetLabel: string, verified: boolean) => {
      setPlaceVerificationOverrides((current) => ({ ...current, [placeId]: verified }));
      appendLog(verified ? "place_verified" : "place_unverified", targetLabel);
    },
    [appendLog],
  );

  const value = useMemo<AdminStoreValue>(
    () => ({
      reports,
      moderationLog,
      suspendedUserIds,
      createReport,
      resolveReport,
      isUserSuspended,
      suspendUser,
      reinstateUser,
      isPlaceVerified,
      setPlaceVerified,
      logAction: appendLog,
    }),
    [
      reports,
      moderationLog,
      suspendedUserIds,
      createReport,
      resolveReport,
      isUserSuspended,
      suspendUser,
      reinstateUser,
      isPlaceVerified,
      setPlaceVerified,
      appendLog,
    ],
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
