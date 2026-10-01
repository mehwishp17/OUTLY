import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { FollowingView } from "@/components/social-graph/following-view";

export const metadata: Metadata = {
  title: "Following — OUTLY",
  description: "See who this OUTLY member follows.",
};

type FollowingPageProps = {
  params: Promise<{ userId: string }>;
};

export default async function FollowingPage({ params }: FollowingPageProps) {
  const { userId } = await params;

  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <FollowingView userId={userId} />
    </div>
  );
}
