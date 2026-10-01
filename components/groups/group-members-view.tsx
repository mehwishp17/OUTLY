"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useGroupStore } from "@/context/group-store-context";
import { useSocialStore } from "@/context/social-store-context";
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
 * owner only — controls to promote/demote moderators and remove
 * members. Moderators can moderate content but member management stays
 * with the owner in this frontend-only phase. */
export function GroupMembersView({ group }: GroupMembersViewProps) {
  const { currentUser } = useSocialStore();
  const { setMemberRole, removeMember } = useGroupStore();
  const isOwner = group.members.some((m) => m.id === currentUser.id && m.role === "owner");

  return (
    <ul className="flex flex-col gap-2">
      {group.members.map((member) => (
        <li
          key={member.id}
          className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--outly-border)] bg-white p-4"
        >
          <Avatar name={member.name} avatarUrl={member.avatarUrl} size="sm" />
          <span className="flex-1 text-sm font-semibold text-[var(--outly-ink)]">{member.name}</span>
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
                  setMemberRole(group.id, member.id, member.role === "moderator" ? "member" : "moderator")
                }
              >
                {member.role === "moderator" ? "Remove moderator" : "Make moderator"}
              </Button>
              <Button size="md" variant="secondary" onClick={() => removeMember(group.id, member.id)}>
                Remove
              </Button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
