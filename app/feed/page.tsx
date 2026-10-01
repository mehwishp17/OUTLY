import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { FeedView } from "@/components/feed/feed-view";

export const metadata: Metadata = {
  title: "Your feed — OUTLY",
  description: "See posts from the OUTLY community — trail updates, meetups, and shared adventures.",
};

export default function FeedPage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <FeedView />
    </div>
  );
}
