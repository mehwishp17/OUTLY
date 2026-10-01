import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { LeaderboardView } from "@/components/gamification/leaderboard-view";

export const metadata: Metadata = {
  title: "Leaderboard — OUTLY",
  description: "Ranked by total distance covered across completed activities.",
};

export default function LeaderboardPage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <LeaderboardView />
    </div>
  );
}
