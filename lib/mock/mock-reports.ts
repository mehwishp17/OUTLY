import { CURRENT_USER_ID } from "@/lib/mock/mock-user";
import type { ModerationLogEntry, Report } from "@/types/report";

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

/** Seed reports and moderation log entries for the Admin module's
 * Reports/Moderation screens. Report targets reference real posts and
 * users already seeded elsewhere. Frontend-only — see
 * `context/admin-store-context.tsx`. */
export const MOCK_REPORTS: Report[] = [
  {
    id: "report-1",
    reporterId: "rohan-mehta",
    targetType: "post",
    targetId: "post-3",
    targetLabel: "Trail condition update for Munnar's Whispering Pines…",
    reason: "misinformation",
    description: "The trail was actually fine when I went last week — this might be outdated.",
    status: "open",
    createdAt: hoursAgo(3),
  },
  {
    id: "report-2",
    reporterId: "arjun-das",
    targetType: "user",
    targetId: "isha-verma",
    targetLabel: "Isha Verma",
    reason: "harassment",
    description: "Repeated unwanted comments on my posts.",
    status: "open",
    createdAt: hoursAgo(20),
  },
  {
    id: "report-3",
    reporterId: "priya-nair",
    targetType: "post",
    targetId: "post-2",
    targetLabel: "Organizing a Saturday morning group hike near Pune…",
    reason: "spam",
    status: "actioned",
    createdAt: hoursAgo(96),
  },
  {
    id: "report-4",
    reporterId: CURRENT_USER_ID,
    targetType: "user",
    targetId: "vikram-rao",
    targetLabel: "Vikram Rao",
    reason: "other",
    description: "Profile looked like a duplicate account — turned out to be fine.",
    status: "dismissed",
    createdAt: hoursAgo(200),
  },
];

export const MOCK_MODERATION_LOG: ModerationLogEntry[] = [
  {
    id: "modlog-1",
    action: "report_actioned",
    targetLabel: "Organizing a Saturday morning group hike near Pune…",
    note: "Reviewed — genuine community post, no violation found. Reporter notified.",
    createdAt: hoursAgo(95),
  },
  {
    id: "modlog-2",
    action: "report_dismissed",
    targetLabel: "Vikram Rao",
    note: "No policy violation found — resolved report-4.",
    createdAt: hoursAgo(199),
  },
];
