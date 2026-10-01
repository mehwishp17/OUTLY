"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { usePartnerStore } from "@/context/partner-store-context";
import { useSocialStore } from "@/context/social-store-context";
import type { JoinRequest } from "@/types/partner";

type PartnerJoinRequestsViewProps = {
  requestId: string;
};

function JoinRequestRow({
  join,
  isAuthor,
  onAccept,
  onDecline,
}: {
  join: JoinRequest;
  isAuthor: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <li className="rounded-[var(--radius-md)] border border-[var(--outly-border)] bg-white p-4">
      <div className="flex items-center gap-3">
        <Avatar name={join.name} avatarUrl={join.avatarUrl} size="sm" />
        <span className="flex-1 text-sm font-semibold text-[var(--outly-ink)]">{join.name}</span>
        {join.status === "pending" && isAuthor ? (
          <div className="flex gap-2">
            <Button size="md" onClick={onAccept}>
              Accept
            </Button>
            <Button size="md" variant="secondary" onClick={onDecline}>
              Decline
            </Button>
          </div>
        ) : (
          <span
            className={
              join.status === "accepted"
                ? "rounded-full bg-[#e6f4ea] px-2.5 py-1 text-xs font-semibold text-[#1e7a3a]"
                : join.status === "declined"
                  ? "rounded-full bg-[#fbe1e8] px-2.5 py-1 text-xs font-semibold text-[#b3164c]"
                  : "rounded-full bg-[var(--outly-lavender)] px-2.5 py-1 text-xs font-semibold text-[var(--outly-purple-dark)]"
            }
          >
            {join.status === "accepted" ? "Accepted" : join.status === "declined" ? "Declined" : "Pending"}
          </span>
        )}
      </div>
      {join.message ? (
        <p className="mt-2 pl-11 text-sm leading-relaxed text-[var(--outly-muted)]">{join.message}</p>
      ) : null}
    </li>
  );
}

/** Join Requests screen: the poster's queue of people who've asked to
 * join a partner request, with accept/decline controls. */
export function PartnerJoinRequestsView({ requestId }: PartnerJoinRequestsViewProps) {
  const { currentUser } = useSocialStore();
  const { getRequestById, acceptJoinRequest, declineJoinRequest } = usePartnerStore();
  const request = getRequestById(requestId);

  if (!request) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-bold text-[var(--outly-ink)]">Request not found</h1>
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
  const pending = request.joinRequests.filter((join) => join.status === "pending");
  const accepted = request.joinRequests.filter((join) => join.status === "accepted");
  const declined = request.joinRequests.filter((join) => join.status === "declined");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <Link
        href={`/partner/${request.id}`}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
      >
        <Icon name="chevron-left" className="h-4 w-4" />
        Back to request
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)]">Join requests</h1>
        <p className="mt-1 text-sm text-[var(--outly-muted)]">{request.destination}</p>
      </div>

      {request.joinRequests.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white px-5 py-10 text-center text-sm text-[var(--outly-muted)] shadow-[var(--shadow-soft)]">
          No one has requested to join yet.
        </p>
      ) : (
        <>
          {pending.length > 0 ? (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
                Pending ({pending.length})
              </h2>
              <ul className="flex flex-col gap-2">
                {pending.map((join) => (
                  <JoinRequestRow
                    key={join.id}
                    join={join}
                    isAuthor={isAuthor}
                    onAccept={() => acceptJoinRequest(request.id, join.id)}
                    onDecline={() => declineJoinRequest(request.id, join.id)}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          {accepted.length > 0 ? (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
                Accepted ({accepted.length}/{request.spots})
              </h2>
              <ul className="flex flex-col gap-2">
                {accepted.map((join) => (
                  <JoinRequestRow
                    key={join.id}
                    join={join}
                    isAuthor={isAuthor}
                    onAccept={() => acceptJoinRequest(request.id, join.id)}
                    onDecline={() => declineJoinRequest(request.id, join.id)}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          {declined.length > 0 ? (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
                Declined ({declined.length})
              </h2>
              <ul className="flex flex-col gap-2">
                {declined.map((join) => (
                  <JoinRequestRow
                    key={join.id}
                    join={join}
                    isAuthor={isAuthor}
                    onAccept={() => acceptJoinRequest(request.id, join.id)}
                    onDecline={() => declineJoinRequest(request.id, join.id)}
                  />
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
