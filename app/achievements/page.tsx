import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { AchievementsView } from "@/components/gamification/achievements-view";

export const metadata: Metadata = {
  title: "Achievements — OUTLY",
  description: "A timeline of the badges you've earned so far.",
};

export default function AchievementsPage() {
  return (
    <FeedPageShell>
      <AchievementsView />
    </FeedPageShell>
  );
}
