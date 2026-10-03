"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useGroupStore } from "@/context/group-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { displayPerson } from "@/lib/user-directory";
import { GROUP_ROLE_LABELS } from "@/types/group";
import type { Group } from "@/types/group";

type GroupMembersViewProps = {
  group: Group;
};

const ROLE_BADGE_CLASSES: Record<string, string> = {
  owner: "bg-[var(--outly-lavender)] text-[var(--outly-purple-dark)]",
  moderator: "bg-[#fdf1d6] text-[#9a6a00]",
  member: "bg-[var(--outly-lavender)]/60 text-[var(--outly-muted)]",
};

/** Members screen: every member with their role, and — for the group
 * owner only — controls to promote/demote moderators and remove members.
 * Owners and moderators also see the people waiting to join a private group. */
export function GroupMembersView({ group }: GroupMembersViewProps) {
  const { currentUser } = useSocialStore();
  const { setMemberRole, removeMember, reviewRequest } = useGroupStore();
  const [actionError, setActionError] = useState<string>();
  const isOwner = group.myRole === "owner";
  const canModerate = isOwner || group.myRole === "moderator";

  async function run(action: Promise<string | undefined>) {
    setActionError(undefined);
    const error = await action;
    if (error) setActionError(error);
  }

  return (
    <div className="flex flex-col gap-4">
    {actionError ? (
      <p role="alert" className="text-sm text-[#B3164C]">
        {actionError}
      </p>
    ) : null}

    {canModerate && group.joinRequests.length > 0 ? (
      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
          Requests to join ({group.joinRequests.length})
        </h3>
        <ul className="flex flex-col gap-2">
          {group.joinRequests.map((request) => (
            <li
              key={request.id}
              className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-[var(--outly-border)] bg-[var(--outly-lavender)] p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--outly-ink)]">{request.name}</p>
                {request.message ? <p className="text-xs text-[var(--outly-muted)]">{request.message}</p> : null}
              </div>
              <div className="flex gap-2">
                <Button size="md" onClick={() => run(reviewRequest(group.id, request.id, true))}>
                  Accept
                </Button>
                <Button size="md" variant="secondary" onClick={() => run(reviewRequest(group.id, request.id, false))}>
                  Decline
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    ) : null}

    <ul className="flex flex-col gap-2">
      {group.members.map((member) => (
        <li
          key={member.id}
          className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--outly-border)] bg-white p-4"
        >
          <Avatar name={displayPerson(member, currentUser).name} avatarUrl={displayPerson(member, currentUser).avatarUrl} size="sm" />
          <span className="flex-1 text-sm font-semibold text-[var(--outly-ink)]">{displayPerson(member, currentUser).name}</span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_BADGE_CLASSES[member.role]}`}
          >
            {GROUP_ROLE_LABELS[member.role]}
          </span>

          {isOwner && member.role !== "owner" ? (
            <div className="flex gap-2">
              <Button
                size="md"
                variant="secondary"
                onClick={() =>
                  run(setMemberRole(group.id, member.id, member.role === "moderator" ? "member" : "moderator"))
                }
              >
                {member.role === "moderator" ? "Remove moderator" : "Make moderator"}
              </Button>
              <Button size="md" variant="secondary" onClick={() => run(removeMember(group.id, member.id))}>
                Remove
              </Button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
    </div>
  );
}
