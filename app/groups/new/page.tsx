import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { CreateGroupView } from "@/components/groups/create-group-view";

export const metadata: Metadata = {
  title: "Create a group — OUTLY",
  description: "Start a community around a shared outdoor interest.",
};

export default function NewGroupPage() {
  return (
    <FeedPageShell>
      <CreateGroupView />
    </FeedPageShell>
  );
}
