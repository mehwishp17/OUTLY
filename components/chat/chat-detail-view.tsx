"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatMessageBubble } from "@/components/chat/chat-message-bubble";
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
 * `conversation.kind`). Briefly shows a loading state on mount to stand
 * in for connecting to the real-time channel a WebSocket-backed chat
 * would use, then marks the conversation read and renders messages. */
export function ChatDetailView({ conversationId }: ChatDetailViewProps) {
  const { currentUser } = useSocialStore();
  const { getGroupById } = useGroupStore();
  const { getConversationById, sendMessage, markConversationRead } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversation = getConversationById(conversationId);

  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isLoading && conversation) {
      markConversationRead(conversation.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-mark on load/conversation change, not on every message
  }, [isLoading, conversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages.length]);

  if (isLoading) {
    return <LoadingState message="Connecting to conversation…" className="mx-auto max-w-2xl" />;
  }

  if (!conversation) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-16 sm:px-6">
        <ErrorState
          title="Conversation not found"
          description="This conversation may have been removed, or the link is incorrect."
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
  const title = conversation.kind === "group" ? group?.name ?? "Group chat" : other?.name ?? "Direct message";
  const subtitle =
    conversation.kind === "group"
      ? `${conversation.participantIds.length} members`
      : other?.username
        ? `@${other.username}`
        : undefined;

  return (
    <div className="mx-auto flex h-[calc(100svh-4rem)] w-full max-w-2xl flex-col px-4 sm:px-6">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--outly-border)] py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/chat"
            aria-label="Back to chats"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--outly-ink)] transition-colors hover:bg-[var(--outly-lavender)]"
          >
            <Icon name="chevron-left" className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-sm font-semibold text-[var(--outly-ink)]">{title}</p>
            {subtitle ? <p className="text-xs text-[var(--outly-muted)]">{subtitle}</p> : null}
          </div>
        </div>
        {conversation.kind === "group" && group ? (
          <Link
            href={`/groups/${group.id}`}
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
