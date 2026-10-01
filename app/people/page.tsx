import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { UserSearchView } from "@/components/social-graph/user-search-view";

export const metadata: Metadata = {
  title: "Find people — OUTLY",
  description: "Search the OUTLY community by name or username.",
};

export default function PeoplePage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <UserSearchView />
    </div>
  );
}
