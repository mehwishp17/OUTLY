"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Textarea } from "@/components/ui/textarea";
import { usePartnerStore } from "@/context/partner-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { ACTIVITY_TYPE_ICONS, ACTIVITY_TYPE_LABELS } from "@/types/activity";
import { SKILL_LEVEL_LABELS } from "@/types/partner";

type PartnerRequestDetailViewProps = {
  requestId: string;
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PartnerRequestDetailView({ requestId }: PartnerRequestDetailViewProps) {
  const router = useRouter();
  const { currentUser } = useSocialStore();
  const { getRequestById, deleteRequest, closeRequest, requestToJoin, withdrawJoinRequest } =
    usePartnerStore();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [joinMessageDraft, setJoinMessageDraft] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const request = getRequestById(requestId);

  if (!request) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-bold text-[var(--outly-ink)]">Request not found</h1>
        <p className="text-sm text-[var(--outly-muted)]">
          This request may have been removed, or the link is incorrect.
        </p>
        <Link
          href="/partner"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          Back to partner requests
        </Link>
      </div>
    );
  }

  const isAuthor = request.authorId === currentUser.id;
  const myJoinRequest = request.joinRequests.find((join) => join.id === currentUser.id);
  const acceptedCount = request.joinRequests.filter((join) => join.status === "accepted").length;

  function handleRequestToJoin() {
    const result = requestToJoin(request!.id, joinMessageDraft);
    if (result === "full") {
      setStatusMessage("All spots for this request have already been filled.");
    } else if (result === "already-requested") {
      setStatusMessage("You've already requested to join this one.");
    } else {
      setStatusMessage("Request sent! You'll be added once the poster accepts.");
      setJoinMessageDraft("");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <Link
        href="/partner"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
      >
        <Icon name="chevron-left" className="h-4 w-4" />
        Back to partner requests
      </Link>

      <div className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-white gradient-brand"
              aria-hidden="true"
            >
              <Icon name={ACTIVITY_TYPE_ICONS[request.activity]} className="h-5.5 w-5.5" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-2xl">
                {ACTIVITY_TYPE_LABELS[request.activity]} partner for {request.destination}
              </h1>
              <p className="text-sm text-[var(--outly-muted)]">Posted by {request.authorName}</p>
            </div>
          </div>

          {isAuthor ? (
            <DropdownMenu
              triggerLabel="Request actions"
              items={[
                { label: "Edit request", onSelect: () => router.push(`/partner/${request.id}/edit`) },
                { label: "View join requests", onSelect: () => router.push(`/partner/${request.id}/requests`) },
                ...(request.status === "open"
                  ? [{ label: "Close request", onSelect: () => closeRequest(request.id) }]
                  : []),
                { label: "Delete request", destructive: true, onSelect: () => setConfirmingDelete(true) },
              ]}
            />
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span
            className={
              request.status === "open"
                ? "rounded-full bg-[var(--outly-lavender)] px-2.5 py-1 text-xs font-semibold text-[var(--outly-purple-dark)]"
                : "rounded-full bg-[#e6f4ea] px-2.5 py-1 text-xs font-semibold text-[#1e7a3a]"
            }
          >
            {request.status === "open" ? "Open" : "Closed"}
          </span>
          <span className="text-xs text-[var(--outly-muted)]">
            {SKILL_LEVEL_LABELS[request.experienceLevel]}
          </span>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
              Preferred date
            </dt>
            <dd className="mt-1 text-sm text-[var(--outly-ink)]">{formatDateTime(request.preferredAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
              Destination
            </dt>
            <dd className="mt-1 flex items-center gap-1 text-sm text-[var(--outly-ink)]">
              <Icon name="pin" className="h-3.5 w-3.5 text-[var(--outly-violet)]" />
              {request.destination}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
              Spots
            </dt>
            <dd className="mt-1 text-sm text-[var(--outly-ink)]">
              {acceptedCount}/{request.spots} filled
            </dd>
          </div>
        </dl>

        <p className="mt-5 text-sm leading-relaxed text-[var(--outly-ink)]">{request.description}</p>

        {!isAuthor && request.status === "open" ? (
          <div className="mt-6 border-t border-[var(--outly-border)] pt-5">
            {statusMessage ? <Alert variant="info" title={statusMessage} className="mb-4" /> : null}

            {myJoinRequest ? (
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[var(--outly-lavender)] px-2.5 py-1 text-xs font-semibold text-[var(--outly-purple-dark)]">
                  {myJoinRequest.status === "pending"
                    ? "Request pending"
                    : myJoinRequest.status === "accepted"
                      ? "You're in!"
                      : "Request declined"}
                </span>
                {myJoinRequest.status === "pending" ? (
                  <Button variant="secondary" onClick={() => withdrawJoinRequest(request.id)}>
                    Withdraw request
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                <Textarea
                  id="partner-join-message"
                  label="Message to the poster (optional)"
                  rows={2}
                  value={joinMessageDraft}
                  onChange={(event) => setJoinMessageDraft(event.target.value)}
                  placeholder="Introduce yourself or share relevant experience…"
                />
                <Button onClick={handleRequestToJoin}>Request to join</Button>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this request?"
        description="This can't be undone."
        onConfirm={() => {
          deleteRequest(request.id);
          setConfirmingDelete(false);
          router.push("/partner");
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
