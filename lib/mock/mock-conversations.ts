import { CURRENT_USER_ID } from "@/lib/mock/mock-user";
import type { ChatMessage, Conversation } from "@/types/chat";

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function message(
  id: string,
  conversationId: string,
  senderId: string,
  senderName: string,
  content: string,
  minutesAgoValue: number,
  readBy: string[],
): ChatMessage {
  return {
    id,
    conversationId,
    senderId,
    senderName,
    content,
    createdAt: minutesAgo(minutesAgoValue),
    readBy,
  };
}

/** Seed conversations for the Communication module. Frontend-only — see
 * `context/chat-store-context.tsx`. Group chat membership is a snapshot
 * of the linked group's members at seed time, not live-synced with the
 * Groups & Communities module. */
export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conversation-rohan-mehta",
    kind: "direct",
    participantIds: [CURRENT_USER_ID, "rohan-mehta"],
    messages: [
      message(
        "msg-1",
        "conversation-rohan-mehta",
        "rohan-mehta",
        "Rohan Mehta",
        "Hey! Are you still up for the Sinhagad hike this Saturday?",
        180,
        [CURRENT_USER_ID, "rohan-mehta"],
      ),
      message(
        "msg-2",
        "conversation-rohan-mehta",
        CURRENT_USER_ID,
        "Neha Kapoor",
        "Yes, definitely! What time should we meet at the base?",
        170,
        [CURRENT_USER_ID, "rohan-mehta"],
      ),
      message(
        "msg-3",
        "conversation-rohan-mehta",
        "rohan-mehta",
        "Rohan Mehta",
        "6 AM sharp — parking fills up fast on weekends.",
        45,
        ["rohan-mehta"],
      ),
    ],
  },
  {
    id: "conversation-isha-verma",
    kind: "direct",
    participantIds: [CURRENT_USER_ID, "isha-verma"],
    messages: [
      message(
        "msg-4",
        "conversation-isha-verma",
        "isha-verma",
        "Isha Verma",
        "Saving your trail notes for my next trip! What time did you start climbing?",
        1500,
        [CURRENT_USER_ID, "isha-verma"],
      ),
      message(
        "msg-5",
        "conversation-isha-verma",
        CURRENT_USER_ID,
        "Neha Kapoor",
        "We started at 4 AM to catch the ridge at sunrise — worth the early wake-up!",
        1400,
        [CURRENT_USER_ID, "isha-verma"],
      ),
    ],
  },
  {
    id: "conversation-group-trail-runners",
    kind: "group",
    groupId: "group-bengaluru-trail-runners",
    participantIds: [CURRENT_USER_ID, "rohan-mehta", "isha-verma"],
    messages: [
      message(
        "msg-6",
        "conversation-group-trail-runners",
        "rohan-mehta",
        "Rohan Mehta",
        "Reminder: this Sunday's run starts at Cubbon Park gate 2, 6 AM.",
        900,
        [CURRENT_USER_ID, "rohan-mehta", "isha-verma"],
      ),
      message(
        "msg-7",
        "conversation-group-trail-runners",
        "isha-verma",
        "Isha Verma",
        "I'll bring extra water bottles for anyone who needs one.",
        60,
        ["isha-verma"],
      ),
    ],
  },
  {
    id: "conversation-group-weekend-wanderers",
    kind: "group",
    groupId: "group-weekend-wanderers",
    participantIds: [CURRENT_USER_ID, "rohan-mehta", "arjun-das", "priya-nair"],
    messages: [],
  },
];

export function getConversationByIdFromSeed(id: string): Conversation | undefined {
  return MOCK_CONVERSATIONS.find((conversation) => conversation.id === id);
}
