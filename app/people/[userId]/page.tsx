import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { PublicProfileView } from "@/components/social-graph/public-profile-view";

export const metadata: Metadata = {
  title: "Profile — OUTLY",
  description: "View this OUTLY member's public profile.",
};

type PublicProfilePageProps = {
  params: Promise<{ userId: string }>;
};

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { userId } = await params;

  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <PublicProfileView key={userId} userId={userId} />
    </div>
  );
}
