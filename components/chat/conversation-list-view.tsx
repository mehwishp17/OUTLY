"use client";

import { useEffect } from "react";
import { ConversationListItem } from "@/components/chat/conversation-list-item";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useChatStore } from "@/context/chat-store-context";

/** Conversation List: loaded from the backend, newest activity first, with
 * live unread counts (new messages arrive over the WebSocket). */
export function ConversationListView() {
  const { conversations, status, error, refresh, getUnreadCount } = useChatStore();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sorted = [...conversations].sort(
    (a, b) => new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime(),
  );

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

      {(status === "idle" || status === "loading") && sorted.length === 0 ? (
        <LoadingState message="Loading your conversations…" />
      ) : status === "error" && sorted.length === 0 ? (
        <ErrorState
          title="We couldn't load your chats"
          description={error ?? undefined}
          action={
            <Button variant="secondary" onClick={() => void refresh()}>
              Try again
            </Button>
          }
        />
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
