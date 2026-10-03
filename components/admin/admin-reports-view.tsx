"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { ChipButton } from "@/components/ui/chip-button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { decideReport, fetchReports } from "@/lib/api/admin";
import { formatRelativeTime } from "@/lib/utils";
import { DECISIONS_BY_TARGET } from "@/types/report";
import type { ModerationDecision, Report } from "@/types/report";

const REASON_LABELS: Record<string, string> = {
  SPAM: "Spam",
  HARASSMENT: "Harassment",
  HATE: "Hate speech",
  VIOLENCE: "Violence",
  NUDITY: "Nudity",
  MISINFORMATION: "Misinformation",
  INAPPROPRIATE: "Inappropriate content",
  UNSAFE: "Unsafe",
  OTHER: "Other",
};

const TARGET_HREF: Partial<Record<Report["targetType"], (id: string) => string>> = {
  post: (id) => `/feed/${id}`,
  user: (id) => `/people/${id}`,
  event: (id) => `/events/${id}`,
  group: (id) => `/groups/${id}`,
  place: (id) => `/explore/places/${id}`,
};

const STATUS_CLASSES: Record<Report["status"], string> = {
  open: "bg-[var(--outly-lavender)] text-[var(--outly-purple-dark)]",
  in_review: "bg-[#fdf1d6] text-[#9a6a00]",
  actioned: "bg-[#e6f4ea] text-[#1e7a3a]",
  dismissed: "bg-[var(--outly-lavender)]/60 text-[var(--outly-muted)]",
};

/** Admin Reports (moderators): every report filed by the community. For an
 * open report choose "Take action" (hide, delete, warn, restrict or suspend,
 * depending on what was reported) or dismiss it. Every decision is recorded
 * in the audit log and the people involved are notified. */
export function AdminReportsView() {
  const [reports, setReports] = useState<Report[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const [actingId, setActingId] = useState<string | null>(null);
  const [decision, setDecision] = useState<ModerationDecision | null>(null);
  const [busy, setBusy] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    let cancelled = false;
    void fetchReports().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setReports(result.data);
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

  async function resolveReport(reportId: string, chosen: ModerationDecision) {
    setBusy(true);
    setActionError(undefined);
    const result = await decideReport(reportId, chosen, "");
    setBusy(false);
    if (!result.ok) {
      setActionError(result.message);
      return;
    }
    setActingId(null);
    setDecision(null);
    reload();
  }

  const sorted = [...reports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
          Reports
        </h1>
        <p className="mt-1 text-sm text-[var(--outly-muted)]">
          Reports filed by the community against posts and accounts.
        </p>
      </div>

      <AdminNav active="/admin/reports" />

      {actionError ? (
        <p role="alert" className="text-sm text-[#B3164C]">
          {actionError}
        </p>
      ) : null}

      {status === "loading" ? (
        <LoadingState message="Loading reports…" />
      ) : status === "error" ? (
        <ErrorState title="We couldn't load reports" description={error} />
      ) : sorted.length === 0 ? (
        <EmptyState icon="shield-check" title="No reports" description="Nothing has been reported." />
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((report) => {
            const targetHref = TARGET_HREF[report.targetType]?.(report.targetId);

            return (
              <li
                key={report.id}
                className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-4 shadow-[var(--shadow-soft)] transition-shadow duration-200 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[report.status]}`}>
                      {report.status === "open"
                        ? "Open"
                        : report.status === "in_review"
                          ? "In review"
                          : report.status === "actioned"
                            ? "Actioned"
                            : "Dismissed"}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--outly-violet)]">
                      {REASON_LABELS[report.reason] ?? report.reason}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--outly-muted)]">
                    {formatRelativeTime(report.createdAt)}
                  </span>
                </div>

                <p className="mt-2 text-sm text-[var(--outly-ink)]">
                  <span className="capitalize">{report.targetType}</span>:{" "}
                  {targetHref ? (
                    <Link href={targetHref} className="font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]">
                      {report.targetLabel}
                    </Link>
                  ) : (
                    <span className="font-semibold">{report.targetLabel}</span>
                  )}
                </p>
                <p className="mt-1 text-xs text-[var(--outly-muted)]">
                  Reported by {report.reporterName}
                </p>
                {report.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-[var(--outly-muted)]">{report.description}</p>
                ) : null}

                {report.status === "open" || report.status === "in_review" ? (
                  actingId === report.id ? (
                    <div className="mt-3 flex flex-col gap-3">
                      <div role="group" aria-label="Moderation action" className="flex flex-wrap gap-2">
                        {DECISIONS_BY_TARGET[report.targetType].map((option) => (
                          <ChipButton key={option.value} active={decision === option.value} onClick={() => setDecision(option.value)}>
                            {option.label}
                          </ChipButton>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button size="md" disabled={!decision || busy} onClick={() => decision && resolveReport(report.id, decision)}>
                          Confirm
                        </Button>
                        <Button
                          size="md"
                          variant="secondary"
                          onClick={() => {
                            setActingId(null);
                            setDecision(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <Button size="md" onClick={() => setActingId(report.id)}>
                        Take action
                      </Button>
                      <Button size="md" variant="secondary" disabled={busy} onClick={() => resolveReport(report.id, "NO_ACTION")}>
                        Dismiss
                      </Button>
                    </div>
                  )
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
