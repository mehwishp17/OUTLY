import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { CreateActivityView } from "@/components/activities/create-activity-view";

export const metadata: Metadata = {
  title: "Create an activity — OUTLY",
  description: "Plan a hike, ride, or camping trip and invite people to join.",
};

export default function NewActivityPage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <CreateActivityView />
    </div>
  );
}
