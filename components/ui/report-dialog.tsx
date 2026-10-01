"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChipButton } from "@/components/ui/chip-button";
import { Textarea } from "@/components/ui/textarea";
import { REPORT_REASON_LABELS } from "@/types/report";
import type { ReportReason } from "@/types/report";

const REASON_OPTIONS = Object.keys(REPORT_REASON_LABELS) as ReportReason[];

type ReportDialogProps = {
  open: boolean;
  targetLabel: string;
  onSubmit: (reason: ReportReason, description?: string) => void;
  onCancel: () => void;
};

/** Accessible report dialog — one of the reusable components named in
 * the frontend component architecture. Mirrors `ConfirmDialog`'s modal
 * pattern (focus trap, Escape/Cancel to close, focus the first control
 * on open) with a reason picker and optional description instead of a
 * plain confirm/cancel. */
export function ReportDialog({ open, targetLabel, onSubmit, onCancel }: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason>("spam");
  const [description, setDescription] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
        setReason("spam");
        setDescription("");
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  function resetAndClose(after: () => void) {
    after();
    setReason("spam");
    setDescription("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--outly-night)]/50 px-4 animate-fade-in-backdrop motion-reduce:animate-none">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
        className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-6 shadow-[var(--shadow-elevated)] animate-scale-in motion-reduce:animate-none"
      >
        <h2 id="report-dialog-title" className="text-lg font-semibold text-[var(--outly-ink)]">
          Report {targetLabel}
        </h2>
        <p className="mt-2 text-sm text-[var(--outly-muted)]">
          Our moderation team will review this. Reports are anonymous to the person you&apos;re
          reporting.
        </p>

        <div role="group" aria-label="Reason" className="mt-4 flex flex-wrap gap-2">
          {REASON_OPTIONS.map((option) => (
            <ChipButton key={option} active={reason === option} onClick={() => setReason(option)}>
              {REPORT_REASON_LABELS[option]}
            </ChipButton>
          ))}
        </div>

        <div className="mt-4">
          <Textarea
            id="report-description"
            label="Additional details (optional)"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Anything that helps our team understand the issue…"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => resetAndClose(onCancel)}>
            Cancel
          </Button>
          <button
            type="button"
            onClick={() => resetAndClose(() => onSubmit(reason, description))}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#B3164C] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8A0F3A] focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Submit report
          </button>
        </div>
      </div>
    </div>
  );
}
