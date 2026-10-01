"use client";

import { useEffect, useState } from "react";
import { ConversationListItem } from "@/components/chat/conversation-list-item";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useChatStore } from "@/context/chat-store-context";

/** Conversation List. Briefly shows a loading state on mount — a small,
 * honest stand-in for the real-time channel connection a WebSocket-backed
 * chat would establish (see `docs/architecture.md` future-integration
 * notes) — before rendering conversations sorted by most recent message. */
export function ConversationListView() {
  const { conversations, getUnreadCount } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timeout);
  }, []);

  const sorted = [...conversations].sort((a, b) => {
    const aTime = a.messages[a.messages.length - 1]?.createdAt ?? "";
    const bTime = b.messages[b.messages.length - 1]?.createdAt ?? "";
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
          Chats
        </h1>
        <p className="mt-1 text-sm text-[var(--outly-muted)]">
          Direct messages and group chats with your OUTLY community.
        </p>
      </div>

      {isLoading ? (
        <LoadingState message="Connecting to your conversations…" />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon="message-circle"
          title="No conversations yet"
          description="Message someone from their profile, or start chatting in a group you've joined."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              unreadCount={getUnreadCount(conversation.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
