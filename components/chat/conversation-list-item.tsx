import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { useGroupStore } from "@/context/group-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { formatRelativeTime } from "@/lib/utils";
import { resolveUserSummary } from "@/lib/user-directory";
import type { Conversation } from "@/types/chat";

type ConversationListItemProps = {
  conversation: Conversation;
  unreadCount: number;
};

export function ConversationListItem({ conversation, unreadCount }: ConversationListItemProps) {
  const { currentUser } = useSocialStore();
  const { getGroupById } = useGroupStore();
  const lastMessage = conversation.messages[conversation.messages.length - 1];

  let title: string;
  let avatarNode: React.ReactNode;

  if (conversation.kind === "group") {
    const group = conversation.groupId ? getGroupById(conversation.groupId) : undefined;
    title = group?.name ?? "Group chat";
    avatarNode = (
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundImage: group?.gradient }}
        aria-hidden="true"
      >
        <Icon name="message-circle" className="h-5 w-5" />
      </span>
    );
  } else {
    const otherId = conversation.participantIds.find((id) => id !== currentUser.id);
    const other = otherId ? resolveUserSummary(otherId, currentUser) : undefined;
    title = other?.name ?? "Direct message";
    avatarNode = <Avatar name={title} avatarUrl={other?.avatarUrl} size="lg" />;
  }

  return (
    <li>
      <Link
        href={`/chat/${conversation.id}`}
        className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-4 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        {avatarNode}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-[var(--outly-ink)]">{title}</p>
            {lastMessage ? (
              <span className="shrink-0 text-xs text-[var(--outly-muted)]">
                {formatRelativeTime(lastMessage.createdAt)}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-sm text-[var(--outly-muted)]">
            {lastMessage ? `${lastMessage.senderName}: ${lastMessage.content}` : "No messages yet"}
          </p>
        </div>
        {unreadCount > 0 ? (
          <span
            className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-semibold text-white gradient-brand"
            aria-label={`${unreadCount} unread messages`}
          >
            {unreadCount}
          </span>
        ) : null}
      </Link>
    </li>
  );
}
