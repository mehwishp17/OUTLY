"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { CoverImage } from "@/components/ui/cover-image";
import { Tabs } from "@/components/ui/tabs";
import { GroupFeed } from "@/components/groups/group-feed";
import { GroupMembersView } from "@/components/groups/group-members-view";
import { groupChatRequest } from "@/lib/api/chat";
import { useGroupStore } from "@/context/group-store-context";

type GroupDetailViewProps = {
  groupId: string;
};

export function GroupDetailView({ groupId }: GroupDetailViewProps) {
  const router = useRouter();
  const { getGroupById, deleteGroup, joinGroup, leaveGroup, loadGroup } = useGroupStore();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [leaveMessage, setLeaveMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState<{ groupId: string; id: string }>();
  const group = getGroupById(groupId);
  const isMember = Boolean(group?.myRole);
  const conversationId = isMember && chat?.groupId === groupId ? chat.id : undefined;

  useEffect(() => {
    let cancelled = false;
    void loadGroup(groupId).then(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [groupId, loadGroup]);

  // Members get a link to the group's chat.
  useEffect(() => {
    if (!isMember) return;
    let cancelled = false;
    void groupChatRequest(groupId).then((result) => {
      if (!cancelled && result.ok) setChat({ groupId, id: result.data });
    });
    return () => {
      cancelled = true;
    };
  }, [groupId, isMember]);

  if (!group && loading) return <LoadingState message="Loading group…" />;

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

  const isOwner = group.myRole === "owner";
  const canSeeContent = group.visibility === "public" || isMember;

  async function handleJoin() {
    setBusy(true);
    setActionError(undefined);
    const { result, error } = await joinGroup(group!.id);
    setBusy(false);
    if (error) setActionError(error);
    else if (result === "requested") setLeaveMessage("Your request was sent to the group's moderators.");
  }

  async function handleLeave() {
    setBusy(true);
    setActionError(undefined);
    const { result, error } = await leaveGroup(group!.id);
    setBusy(false);
    if (error) setActionError(error);
    else if (result === "owner-must-transfer-first") {
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
          className="group relative flex h-40 items-end overflow-hidden p-6 sm:h-52"
          style={{ backgroundImage: group.gradient }}
          role="img"
          aria-label={`${group.name} — illustrative visual`}
        >
          {group.imageUrl ? <CoverImage src={group.imageUrl} sizes="(min-width: 768px) 672px, 100vw" /> : null}
          <span className="relative flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
            <Icon name={group.visibility === "private" ? "shield-check" : "compass"} className="h-3.5 w-3.5" />
            {group.visibility === "private" ? "Private" : "Public"}
          </span>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)]">{group.name}</h1>
              <p className="mt-1 text-sm font-medium uppercase tracking-wide text-[var(--outly-violet)]">
                {group.category} · {group.memberCount} member{group.memberCount === 1 ? "" : "s"}
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
          {actionError ? <Alert variant="error" title={actionError} className="mt-4" /> : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {!isMember ? (
              group.requestPending ? (
                <Button variant="secondary" disabled>
                  Request pending
                </Button>
              ) : (
                <Button onClick={handleJoin} disabled={busy}>
                  {group.visibility === "private" ? "Request to join" : "Join group"}
                </Button>
              )
            ) : !isOwner ? (
              <Button variant="secondary" onClick={handleLeave} disabled={busy}>
                Leave group
              </Button>
            ) : null}
            {isMember && conversationId ? (
              <Button href={`/chat/${conversationId}`} variant="secondary">
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
                  { id: "feed", label: "Group feed", content: <GroupFeed key={group.id} groupId={group.id} /> },
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
        description="This can't be undone. The group, its feed and its chat will be removed for everyone."
        onConfirm={async () => {
          const error = await deleteGroup(group.id);
          setConfirmingDelete(false);
          if (error) {
            setActionError(error);
            return;
          }
          router.push("/groups");
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
