import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { GroupListView } from "@/components/groups/group-list-view";

export const metadata: Metadata = {
  title: "Groups & Communities — OUTLY",
  description: "Local trekking clubs, cycling communities, and weekend camping groups.",
};

export default function GroupsPage() {
  return (
    <FeedPageShell>
      <GroupListView />
    </FeedPageShell>
  );
}
