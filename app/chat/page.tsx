import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { ConversationListView } from "@/components/chat/conversation-list-view";

export const metadata: Metadata = {
  title: "Chats — OUTLY",
  description: "Direct messages and group chats with your OUTLY community.",
};

export default function ChatPage() {
  return (
    <FeedPageShell>
      <ConversationListView />
    </FeedPageShell>
  );
}
