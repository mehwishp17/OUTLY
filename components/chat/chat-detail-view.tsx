"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatMessageBubble } from "@/components/chat/chat-message-bubble";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { useChatStore } from "@/context/chat-store-context";
import { useGroupStore } from "@/context/group-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { resolveUserSummary } from "@/lib/user-directory";

type ChatDetailViewProps = {
  conversationId: string;
};

/** Chat Detail / Group Chat (the same screen — distinguished by
 * `conversation.kind`). Loads the messages from the backend, marks the
 * conversation read, and shows new messages as they arrive. */
export function ChatDetailView({ conversationId }: ChatDetailViewProps) {
  const { currentUser } = useSocialStore();
  const { getGroupById } = useGroupStore();
  const { getConversationById, sendMessage, markConversationRead, loadConversation } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversation = getConversationById(conversationId);

  useEffect(() => {
    let cancelled = false;
    void loadConversation(conversationId).then((error) => {
      if (cancelled) return;
      setLoadError(error ? (error.status === 404 ? undefined : error.message) : undefined);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [conversationId, loadConversation]);

  // Opening the conversation, or a message arriving while it is open, counts as reading it.
  useEffect(() => {
    if (!isLoading && conversation) {
      markConversationRead(conversation.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-mark when the message count changes
  }, [isLoading, conversation?.id, conversation?.messages.length, conversation?.unreadCount]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages.length]);

  if (isLoading) {
    return <LoadingState message="Loading conversation…" className="mx-auto max-w-2xl" />;
  }

  if (!conversation) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-16 sm:px-6">
        <ErrorState
          title={loadError ? "We couldn't load this conversation" : "Conversation not found"}
          description={loadError ?? "This conversation may have been removed, or the link is incorrect."}
        />
        <Link
          href="/chat"
          className="mx-auto inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          Back to chats
        </Link>
      </div>
    );
  }

  const group = conversation.groupId ? getGroupById(conversation.groupId) : undefined;
  const otherId = conversation.participantIds.find((id) => id !== currentUser.id);
  const other = otherId ? resolveUserSummary(otherId, currentUser) : undefined;
  const title =
    conversation.kind === "group" ? conversation.groupName ?? group?.name ?? "Group chat" : other?.name ?? "Direct message";
  const subtitle =
    conversation.kind === "group"
      ? `${conversation.participantCount} members`
      : other?.username
        ? `@${other.username}`
        : undefined;

  return (
    <div className="mx-auto flex h-[calc(100svh-4rem)] w-full max-w-2xl flex-col px-4 sm:px-6">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--outly-border)] py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/chat"
            aria-label="Back to chats"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--outly-ink)] transition-colors hover:bg-[var(--outly-lavender)]"
          >
            <Icon name="chevron-left" className="h-5 w-5" />
          </Link>
          {conversation.kind === "group" ? (
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white gradient-brand"
              style={group?.gradient ? { backgroundImage: group.gradient } : undefined}
              aria-hidden="true"
            >
              <Icon name="message-circle" className="h-4.5 w-4.5" />
            </span>
          ) : (
            <Avatar name={title} avatarUrl={other?.avatarUrl} size="md" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--outly-ink)]">{title}</p>
            {subtitle ? <p className="text-xs text-[var(--outly-muted)]">{subtitle}</p> : null}
          </div>
        </div>
        {conversation.kind === "group" && conversation.groupId ? (
          <Link
            href={`/groups/${conversation.groupId}`}
            className="text-xs font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
          >
            View group
          </Link>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {conversation.messages.length === 0 ? (
          <EmptyState
            icon="message-circle"
            title="No messages yet"
            description="Say hello to get the conversation started."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {conversation.messages.map((message) => (
              <ChatMessageBubble
                key={message.id}
                message={message}
                isMine={message.senderId === currentUser.id}
                showSenderName={conversation.kind === "group"}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <ChatComposer onSend={(content) => sendMessage(conversation.id, content)} />
    </div>
  );
}
