import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { ConversationListView } from "@/components/chat/conversation-list-view";

export const metadata: Metadata = {
  title: "Chats — OUTLY",
  description: "Direct messages and group chats with your OUTLY community.",
};

export default function ChatPage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <ConversationListView />
    </div>
  );
}
