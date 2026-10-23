import type { Metadata } from "next";
import { FeedPageShell } from "@/components/feed/feed-page-shell";
import { FeedView } from "@/components/feed/feed-view";

export const metadata: Metadata = {
  title: "Your feed — OUTLY",
  description: "See posts from the OUTLY community — trail updates, meetups, and shared adventures.",
};

export default function FeedPage() {
  return (
    <FeedPageShell>
      <FeedView />
    </FeedPageShell>
  );
}
