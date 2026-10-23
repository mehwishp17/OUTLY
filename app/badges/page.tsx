import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { BadgesView } from "@/components/gamification/badges-view";

export const metadata: Metadata = {
  title: "Badges — OUTLY",
  description: "Badges awarded for completed activities, distance, and consistency.",
};

export default function BadgesPage() {
  return (
    <FeedPageShell>
      <BadgesView />
    </FeedPageShell>
  );
}
