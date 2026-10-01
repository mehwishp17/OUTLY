/**
 * Shared types for the Communication module (Conversation List, Chat
 * Detail, Group Chat). Data lives in `context/chat-store-context.tsx` for
 * the browser session only — frontend-only, same pattern as the other
 * domain modules. Group Chat conversations reuse an existing
 * `Group.id` from the Groups & Communities module rather than a parallel
 * concept of "group" — see `Conversation.groupId`.
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
  /** User ids who have read this message (includes the sender). */
  readBy: string[];
};

export type Conversation = {
  id: string;
  kind: ConversationKind;
  /** Present for group chats — links back to a `Group.id` from the
   * Groups & Communities module so the chat shares that group's name,
   * gradient, and membership rather than duplicating them. */
  groupId?: string;
  /** All participant ids, current user included. For a direct
   * conversation this is always exactly two ids. */
  participantIds: string[];
  messages: ChatMessage[];
};
