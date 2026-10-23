import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { LeaderboardView } from "@/components/gamification/leaderboard-view";

export const metadata: Metadata = {
  title: "Leaderboard — OUTLY",
  description: "Ranked by total distance covered across completed activities.",
};

export default function LeaderboardPage() {
  return (
    <FeedPageShell>
      <LeaderboardView />
    </FeedPageShell>
  );
}
