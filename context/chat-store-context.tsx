"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { MOCK_CONVERSATIONS } from "@/lib/mock/mock-conversations";
import { useSocialStore } from "@/context/social-store-context";
import type { Conversation } from "@/types/chat";

type ChatStoreValue = {
  conversations: Conversation[];
  getConversationById: (conversationId: string) => Conversation | undefined;
  sendMessage: (conversationId: string, content: string) => void;
  markConversationRead: (conversationId: string) => void;
  getUnreadCount: (conversationId: string) => number;
  /** Finds the existing direct conversation with `userId`, or creates one,
   * returning its id either way. Used by the "Message" action on a
   * Public Profile. */
  startDirectConversation: (userId: string) => string;
};

const ChatStoreContext = createContext<ChatStoreValue | null>(null);

let localMessageIdCounter = 0;
let localConversationIdCounter = 0;

function nextMessageId(): string {
  localMessageIdCounter += 1;
  return `message-local-${Date.now()}-${localMessageIdCounter}`;
}

function nextConversationId(): string {
  localConversationIdCounter += 1;
  return `conversation-local-${Date.now()}-${localConversationIdCounter}`;
}

/**
 * Session-only mock "backend" for the Communication module (Conversation
 * List, Chat Detail, Group Chat). No real network or WebSocket
 * connection exists in this phase — sending a message updates local
 * state immediately and synchronously. Nothing here persists beyond the
 * current browser session.
 */
export function ChatStoreProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useSocialStore();
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);

  const getConversationById = useCallback(
    (conversationId: string) =>
      conversations.find((conversation) => conversation.id === conversationId),
    [conversations],
  );

  const sendMessage = useCallback(
    (conversationId: string, content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: [
                  ...conversation.messages,
                  {
                    id: nextMessageId(),
                    conversationId,
                    senderId: currentUser.id,
                    senderName: currentUser.name,
                    senderAvatarUrl: currentUser.avatarUrl,
                    content: trimmed,
                    createdAt: new Date().toISOString(),
                    readBy: [currentUser.id],
                  },
                ],
              }
            : conversation,
        ),
      );
    },
    [currentUser],
  );

  const markConversationRead = useCallback(
    (conversationId: string) => {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: conversation.messages.map((msg) =>
                  msg.readBy.includes(currentUser.id)
                    ? msg
                    : { ...msg, readBy: [...msg.readBy, currentUser.id] },
                ),
              }
            : conversation,
        ),
      );
    },
    [currentUser.id],
  );

  const getUnreadCount = useCallback(
    (conversationId: string) => {
      const conversation = conversations.find((candidate) => candidate.id === conversationId);
      if (!conversation) return 0;
      return conversation.messages.filter(
        (msg) => msg.senderId !== currentUser.id && !msg.readBy.includes(currentUser.id),
      ).length;
    },
    [conversations, currentUser.id],
  );

  const startDirectConversation = useCallback(
    (userId: string) => {
      const existing = conversations.find(
        (conversation) =>
          conversation.kind === "direct" &&
          conversation.participantIds.includes(currentUser.id) &&
          conversation.participantIds.includes(userId),
      );
      if (existing) return existing.id;

      const newConversation: Conversation = {
        id: nextConversationId(),
        kind: "direct",
        participantIds: [currentUser.id, userId],
        messages: [],
      };
      setConversations((current) => [newConversation, ...current]);
      return newConversation.id;
    },
    [conversations, currentUser.id],
  );

  const value = useMemo<ChatStoreValue>(
    () => ({
      conversations,
      getConversationById,
      sendMessage,
      markConversationRead,
      getUnreadCount,
      startDirectConversation,
    }),
    [
      conversations,
      getConversationById,
      sendMessage,
      markConversationRead,
      getUnreadCount,
      startDirectConversation,
    ],
  );

  return <ChatStoreContext.Provider value={value}>{children}</ChatStoreContext.Provider>;
}

export function useChatStore(): ChatStoreValue {
  const context = useContext(ChatStoreContext);
  if (!context) {
    throw new Error("useChatStore must be used within a ChatStoreProvider");
  }
  return context;
}
