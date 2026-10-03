/**
 * Shared types for the Communication module (Conversation List, Chat
 * Detail, Group Chat). Conversations and messages come from the OUTLY
 * backend (`lib/api/chat.ts`) and live in `context/chat-store-context.tsx`.
 * Group Chat conversations point at their group via `Conversation.groupId`.
 */

export type ConversationKind = "direct" | "group";

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  content: string;
  createdAt: string;
  editedAt?: string;
};

export type Conversation = {
  id: string;
  kind: ConversationKind;
  /** Present for group chats — links back to a `Group.id`. */
  groupId?: string;
  groupName?: string;
  /** The other people in the conversation (the signed-in user is not listed). */
  participantIds: string[];
  /** Everyone in the conversation, the signed-in user included. */
  participantCount: number;
  /** Messages, oldest first. Loaded when the conversation is opened. */
  messages: ChatMessage[];
  /** Whether `messages` has been loaded from the backend yet. */
  messagesLoaded: boolean;
  lastMessagePreview: string;
  lastMessageAt?: string;
  /** Messages from others that I haven't read (server-computed). */
  unreadCount: number;
};
