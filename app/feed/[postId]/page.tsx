import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { PostDetailView } from "@/components/feed/post-detail-view";

export const metadata: Metadata = {
  title: "Post — OUTLY",
  description: "View this post and join the conversation.",
};

type PostDetailPageProps = {
  params: Promise<{ postId: string }>;
};

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId } = await params;

  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <PostDetailView postId={postId} />
    </div>
  );
}
