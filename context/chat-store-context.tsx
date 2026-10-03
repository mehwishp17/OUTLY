"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useSocialStore } from "@/context/social-store-context";
import {
  fetchConversations,
  fetchMessages,
  mapMessage,
  markConversationReadRequest,
  sendMessageRequest,
  startDirectRequest,
} from "@/lib/api/chat";
import type { BackendMessage } from "@/lib/api/chat";
import { isRealtimeConnected, subscribeRealtime } from "@/lib/realtime";
import type { ChatMessage, Conversation } from "@/types/chat";

type LoadStatus = "idle" | "loading" | "ready" | "error";
type LoadError = { message: string; status: number };

type ChatStoreValue = {
  conversations: Conversation[];
  status: LoadStatus;
  error: string | null;
  /** (Re)loads the conversation list (with unread counts). */
  refresh: () => Promise<void>;
  /** Loads a conversation's messages (and the conversation itself if it is not listed). */
  loadConversation: (conversationId: string) => Promise<LoadError | null>;
  getConversationById: (conversationId: string) => Conversation | undefined;
  /** Resolves with an error message on failure. */
  sendMessage: (conversationId: string, content: string) => Promise<string | undefined>;
  markConversationRead: (conversationId: string) => void;
  getUnreadCount: (conversationId: string) => number;
  /** Finds the existing direct conversation with `userId`, or creates one.
   * Used by the "Message" action on a Public Profile. */
  startDirectConversation: (userId: string) => Promise<{ id?: string; error?: string }>;
};

const ChatStoreContext = createContext<ChatStoreValue | null>(null);

const POLL_OPEN_CHAT_MS = 5_000;

function sortConversations(list: Conversation[]): Conversation[] {
  return [...list].sort(
    (a, b) => new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime(),
  );
}

/**
 * Communication state (Conversation List, Chat Detail, Group Chat), backed by
 * the OUTLY backend (`lib/api/chat.ts`). Messages are saved by the backend
 * and pushed to everyone in the conversation over the WebSocket
 * (`lib/realtime.ts`); an open conversation re-syncs every 5 s while the
 * socket is down.
 */
export function ChatStoreProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useSocialStore();
  const meId = currentUser.id;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const conversationsRef = useRef<Conversation[]>([]);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const inflight = useRef<Promise<void> | null>(null);

  const setList = useCallback((updater: (current: Conversation[]) => Conversation[]) => {
    const next = updater(conversationsRef.current);
    conversationsRef.current = next;
    setConversations(next);
  }, []);

  const refresh = useCallback((): Promise<void> => {
    if (inflight.current) return inflight.current;
    inflight.current = (async () => {
      setStatus((current) => (current === "ready" ? current : "loading"));
      const result = await fetchConversations();
      if (result.ok) {
        setError(null);
        setList((current) => {
          const known = new Map(current.map((conversation) => [conversation.id, conversation]));
          // Keep messages we already loaded; the list response only carries previews.
          return result.data.map((conversation) => {
            const before = known.get(conversation.id);
            return before?.messagesLoaded
              ? { ...conversation, messages: before.messages, messagesLoaded: true }
              : conversation;
          });
        });
        setStatus("ready");
      } else {
        setError(result.message);
        setStatus("error");
      }
    })().finally(() => {
      inflight.current = null;
    });
    return inflight.current;
  }, [setList]);

  const loadConversation = useCallback(
    async (conversationId: string): Promise<LoadError | null> => {
      const result = await fetchMessages(conversationId);
      if (!result.ok) return { message: result.message, status: result.status };
      const messages = result.data;
      if (!conversationsRef.current.some((conversation) => conversation.id === conversationId)) {
        await refresh(); // a conversation we were not told about yet (e.g. opened from a link)
      }
      setList((current) =>
        current.map((conversation) =>
          conversation.id === conversationId ? { ...conversation, messages, messagesLoaded: true } : conversation,
        ),
      );
      return null;
    },
    [refresh, setList],
  );

  const getConversationById = useCallback(
    (conversationId: string) => conversations.find((conversation) => conversation.id === conversationId),
    [conversations],
  );

  const appendMessage = useCallback(
    (message: ChatMessage, { fromMe }: { fromMe: boolean }) => {
      setList((current) =>
        sortConversations(
          current.map((conversation) => {
            if (conversation.id !== message.conversationId) return conversation;
            if (conversation.messages.some((existing) => existing.id === message.id)) return conversation;
            return {
              ...conversation,
              messages: conversation.messagesLoaded ? [...conversation.messages, message] : conversation.messages,
              lastMessagePreview: message.content.slice(0, 140),
              lastMessageAt: message.createdAt,
              unreadCount: fromMe ? conversation.unreadCount : conversation.unreadCount + 1,
            };
          }),
        ),
      );
    },
    [setList],
  );

  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return undefined;
      const result = await sendMessageRequest(conversationId, trimmed);
      if (!result.ok) return result.message;
      appendMessage(result.data, { fromMe: true });
      return undefined;
    },
    [appendMessage],
  );

  const markConversationRead = useCallback(
    (conversationId: string) => {
      const conversation = conversationsRef.current.find((candidate) => candidate.id === conversationId);
      if (!conversation || conversation.unreadCount === 0) return;
      setList((current) =>
        current.map((candidate) => (candidate.id === conversationId ? { ...candidate, unreadCount: 0 } : candidate)),
      );
      void markConversationReadRequest(conversationId);
    },
    [setList],
  );

  const getUnreadCount = useCallback(
    (conversationId: string) => conversations.find((conversation) => conversation.id === conversationId)?.unreadCount ?? 0,
    [conversations],
  );

  const startDirectConversation = useCallback(
    async (userId: string) => {
      const result = await startDirectRequest(userId);
      if (!result.ok) return { error: result.message };
      setList((current) =>
        current.some((conversation) => conversation.id === result.data.id) ? current : sortConversations([result.data, ...current]),
      );
      return { id: result.data.id };
    },
    [setList],
  );

  // Live messages pushed by the backend.
  useEffect(() => {
    return subscribeRealtime((event) => {
      if (event.type === "message.created") {
        const raw = event.message as BackendMessage | undefined;
        if (!raw) return;
        const message = mapMessage(raw);
        if (!conversationsRef.current.some((conversation) => conversation.id === message.conversationId)) {
          void refresh(); // first message of a conversation we haven't listed yet
          return;
        }
        appendMessage(message, { fromMe: message.senderId === meId });
      } else if (event.type === "message.updated" || event.type === "message.deleted") {
        const raw = event.message as BackendMessage | undefined;
        if (!raw) return;
        const message = mapMessage(raw);
        setList((current) =>
          current.map((conversation) =>
            conversation.id === message.conversationId
              ? { ...conversation, messages: conversation.messages.map((m) => (m.id === message.id ? message : m)) }
              : conversation,
          ),
        );
      }
    });
  }, [appendMessage, meId, refresh, setList]);

  // While an open conversation has no live socket, re-sync its messages periodically.
  useEffect(() => {
    if (!meId) return;
    const timer = setInterval(() => {
      if (isRealtimeConnected()) return;
      for (const conversation of conversationsRef.current.filter((candidate) => candidate.messagesLoaded)) {
        void fetchMessages(conversation.id).then((result) => {
          if (!result.ok) return;
          setList((current) =>
            current.map((candidate) =>
              candidate.id === conversation.id && result.data.length !== candidate.messages.length
                ? { ...candidate, messages: result.data }
                : candidate,
            ),
          );
        });
      }
    }, POLL_OPEN_CHAT_MS);
    return () => clearInterval(timer);
  }, [meId, setList]);

  const value = useMemo<ChatStoreValue>(
    () => ({
      conversations,
      status,
      error,
      refresh,
      loadConversation,
      getConversationById,
      sendMessage,
      markConversationRead,
      getUnreadCount,
      startDirectConversation,
    }),
    [conversations, status, error, refresh, loadConversation, getConversationById, sendMessage, markConversationRead, getUnreadCount, startDirectConversation],
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
