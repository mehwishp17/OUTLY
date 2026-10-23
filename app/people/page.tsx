import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { UserSearchView } from "@/components/social-graph/user-search-view";

export const metadata: Metadata = {
  title: "Find people — OUTLY",
  description: "Search the OUTLY community by name or username.",
};

export default function PeoplePage() {
  return (
    <FeedPageShell>
      <UserSearchView />
    </FeedPageShell>
  );
}
