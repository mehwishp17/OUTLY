"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Tabs } from "@/components/ui/tabs";
import { GroupFeed } from "@/components/groups/group-feed";
import { GroupMembersView } from "@/components/groups/group-members-view";
import { useChatStore } from "@/context/chat-store-context";
import { useGroupStore } from "@/context/group-store-context";
import { useSocialStore } from "@/context/social-store-context";

type GroupDetailViewProps = {
  groupId: string;
};

export function GroupDetailView({ groupId }: GroupDetailViewProps) {
  const router = useRouter();
  const { currentUser } = useSocialStore();
  const { getGroupById, deleteGroup, joinGroup, leaveGroup } = useGroupStore();
  const { conversations } = useChatStore();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [leaveMessage, setLeaveMessage] = useState<string | null>(null);
  const group = getGroupById(groupId);

  if (!group) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-bold text-[var(--outly-ink)]">Group not found</h1>
        <p className="text-sm text-[var(--outly-muted)]">
          This group may have been removed, or the link is incorrect.
        </p>
        <Link
          href="/groups"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          Back to groups
        </Link>
      </div>
    );
  }

  const membership = group.members.find((member) => member.id === currentUser.id);
  const isOwner = membership?.role === "owner";
  const isMember = Boolean(membership);
  const canSeeContent = group.visibility === "public" || isMember;
  const groupConversation = conversations.find((conversation) => conversation.groupId === group.id);

  function handleLeave() {
    const result = leaveGroup(group!.id);
    if (result === "owner-must-transfer-first") {
      setLeaveMessage("As the owner, you can't leave your own group yet — this app doesn't support transferring ownership.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <Link
        href="/groups"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
      >
        <Icon name="chevron-left" className="h-4 w-4" />
        Back to groups
      </Link>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white shadow-[var(--shadow-soft)]">
        <div
          className="relative flex h-32 items-end p-6"
          style={{ backgroundImage: group.gradient }}
          role="img"
          aria-label={`${group.name} — illustrative visual`}
        >
          <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
            <Icon name={group.visibility === "private" ? "shield-check" : "compass"} className="h-3.5 w-3.5" />
            {group.visibility === "private" ? "Private" : "Public"}
          </span>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)]">{group.name}</h1>
              <p className="mt-1 text-sm font-medium uppercase tracking-wide text-[var(--outly-violet)]">
                {group.category} · {group.members.length} member{group.members.length === 1 ? "" : "s"}
              </p>
            </div>

            {isOwner ? (
              <DropdownMenu
                triggerLabel="Group actions"
                items={[
                  { label: "Edit group", onSelect: () => router.push(`/groups/${group.id}/edit`) },
                  { label: "Delete group", destructive: true, onSelect: () => setConfirmingDelete(true) },
                ]}
              />
            ) : null}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-[var(--outly-ink)]">{group.description}</p>

          {leaveMessage ? <Alert variant="info" title={leaveMessage} className="mt-4" /> : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {!isMember ? (
              <Button onClick={() => joinGroup(group.id)}>Join group</Button>
            ) : !isOwner ? (
              <Button variant="secondary" onClick={handleLeave}>
                Leave group
              </Button>
            ) : null}
            {isMember && groupConversation ? (
              <Button href={`/chat/${groupConversation.id}`} variant="secondary">
                <Icon name="message-circle" className="h-4 w-4" />
                Group chat
              </Button>
            ) : null}
          </div>

          {canSeeContent ? (
            <div className="mt-6">
              <Tabs
                ariaLabel="Group sections"
                items={[
                  { id: "feed", label: "Group feed", content: <GroupFeed groupId={group.id} /> },
                  { id: "members", label: "Members", content: <GroupMembersView group={group} /> },
                  {
                    id: "about",
                    label: "About",
                    content: group.rules ? (
                      <p className="text-sm leading-relaxed text-[var(--outly-ink)]">{group.rules}</p>
                    ) : (
                      <p className="text-sm text-[var(--outly-muted)]">No group rules have been posted.</p>
                    ),
                  },
                ]}
              />
            </div>
          ) : (
            <p className="mt-6 rounded-[var(--radius-md)] border border-[var(--outly-border)] bg-[var(--outly-lavender)] px-4 py-3 text-sm text-[var(--outly-purple-dark)]">
              This is a private group. Join to see the feed, members, and group rules.
            </p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this group?"
        description="This can't be undone. Group posts will remain in members' post history but will no longer appear here."
        onConfirm={() => {
          deleteGroup(group.id);
          setConfirmingDelete(false);
          router.push("/groups");
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
