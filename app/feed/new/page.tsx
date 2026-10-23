import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { CreatePostView } from "@/components/feed/create-post-view";

export const metadata: Metadata = {
  title: "Create a post — OUTLY",
  description: "Share an update, trail note, or meetup with the OUTLY community.",
};

type NewPostPageProps = {
  searchParams: Promise<{ groupId?: string }>;
};

export default async function NewPostPage({ searchParams }: NewPostPageProps) {
  const { groupId } = await searchParams;

  return (
    <FeedPageShell>
      <CreatePostView groupId={groupId} />
    </FeedPageShell>
  );
}
