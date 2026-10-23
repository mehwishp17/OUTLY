import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
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
    <FeedPageShell>
      <ChatDetailView key={conversationId} conversationId={conversationId} />
    </FeedPageShell>
  );
}
