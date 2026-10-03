import { callBackend, fetchAll, firstError } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import { rememberBackendUser } from "@/lib/api/profile";
import type { ChatMessage, Conversation } from "@/types/chat";

/**
 * Chat client (`/api/backend/chats/...`):
 *   GET  chats/conversations/                          my conversations (with unread counts)
 *   POST chats/direct/ {user_id}                       open (or create) a direct conversation
 *   GET  chats/conversations/{id}/messages/            newest first
 *   POST chats/conversations/{id}/messages/ {content}
 *   POST chats/conversations/{id}/read/
 *   GET  groups/{id}/chat/                             a group's conversation id
 */

type BackendParticipant = { user_id: number; username: string; display_name?: string; photo?: string | null };

export type BackendConversation = {
  id: number;
  type: string;
  group_id?: number | null;
  group_name?: string | null;
  participants: BackendParticipant[];
  participants_count?: number;
  last_message?: string;
  last_message_at?: string | null;
  unread_count: number;
};

export type BackendMessage = {
  id: number;
  conversation: number;
  sender_id: number;
  sender_name?: string;
  sender_photo?: string | null;
  content: string;
  created_at: string;
  edited_at?: string | null;
  is_deleted?: boolean;
};

export function mapMessage(raw: BackendMessage): ChatMessage {
  const senderId = rememberBackendUser({
    user_id: raw.sender_id,
    username: raw.sender_name,
    display_name: raw.sender_name,
    photo: raw.sender_photo ?? undefined,
  });
  return {
    id: String(raw.id),
    conversationId: String(raw.conversation),
    senderId,
    senderName: raw.sender_name || "OUTLY member",
    senderAvatarUrl: raw.sender_photo || undefined,
    content: raw.is_deleted ? "This message was deleted." : raw.content,
    createdAt: raw.created_at,
    editedAt: raw.edited_at || undefined,
  };
}

export function mapConversation(raw: BackendConversation): Conversation {
  const participantIds = raw.participants.map((person) => rememberBackendUser(person));
  return {
    id: String(raw.id),
    kind: raw.type === "GROUP" ? "group" : "direct",
    groupId: raw.group_id ? String(raw.group_id) : undefined,
    groupName: raw.group_name || undefined,
    participantIds,
    participantCount: raw.participants_count ?? participantIds.length + 1,
    messages: [],
    messagesLoaded: false,
    lastMessagePreview: raw.last_message ?? "",
    lastMessageAt: raw.last_message_at || undefined,
    unreadCount: raw.unread_count,
  };
}

export async function fetchConversations(): Promise<ApiResult<Conversation[]>> {
  const result = await fetchAll<BackendConversation>("chats/conversations", 100);
  return result.ok ? { ok: true, data: result.data.map(mapConversation) } : result;
}

/** Messages, oldest first (the backend returns newest first). Latest 200. */
export async function fetchMessages(conversationId: string): Promise<ApiResult<ChatMessage[]>> {
  const result = await fetchAll<BackendMessage>(`chats/conversations/${conversationId}/messages`, 200);
  return result.ok ? { ok: true, data: result.data.map(mapMessage).reverse() } : result;
}

export async function sendMessageRequest(conversationId: string, content: string): Promise<ApiResult<ChatMessage>> {
  const result = await callBackend<BackendMessage>("POST", `chats/conversations/${conversationId}/messages`, { content });
  return result.ok ? { ok: true, data: mapMessage(result.data) } : { ...result, message: firstError(result) };
}

export function markConversationReadRequest(conversationId: string): Promise<ApiResult<unknown>> {
  return callBackend("POST", `chats/conversations/${conversationId}/read`);
}

export async function startDirectRequest(userId: string): Promise<ApiResult<Conversation>> {
  const result = await callBackend<BackendConversation>("POST", "chats/direct", { user_id: Number(userId) });
  return result.ok ? { ok: true, data: mapConversation(result.data) } : { ...result, message: firstError(result) };
}

export async function groupChatRequest(groupId: string): Promise<ApiResult<string>> {
  const result = await callBackend<{ conversation_id: number }>("GET", `groups/${groupId}/chat`);
  return result.ok ? { ok: true, data: String(result.data.conversation_id) } : result;
}
