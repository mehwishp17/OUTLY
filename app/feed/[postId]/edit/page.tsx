import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
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
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <EditPostView postId={postId} />
    </div>
  );
}
