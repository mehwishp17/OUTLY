import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { EditPostView } from "@/components/feed/edit-post-view";

export const metadata: Metadata = {
  title: "Edit post — OUTLY",
  description: "Edit your OUTLY post.",
};

type EditPostPageProps = {
  params: Promise<{ postId: string }>;
};

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { postId } = await params;

  return (
    <FeedPageShell>
      <EditPostView postId={postId} />
    </FeedPageShell>
  );
}
