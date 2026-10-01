import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { AchievementsView } from "@/components/gamification/achievements-view";

export const metadata: Metadata = {
  title: "Achievements — OUTLY",
  description: "A timeline of the badges you've earned so far.",
};

export default function AchievementsPage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <AchievementsView />
    </div>
  );
}
