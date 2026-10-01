import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { ChatDetailView } from "@/components/chat/chat-detail-view";

export const metadata: Metadata = {
  title: "Chat — OUTLY",
  description: "Send and receive messages in this conversation.",
};

type ChatDetailPageProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function ChatDetailPage({ params }: ChatDetailPageProps) {
  const { conversationId } = await params;

  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <ChatDetailView conversationId={conversationId} />
    </div>
  );
}
