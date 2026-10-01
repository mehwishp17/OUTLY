import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { GroupListView } from "@/components/groups/group-list-view";

export const metadata: Metadata = {
  title: "Groups & Communities — OUTLY",
  description: "Local trekking clubs, cycling communities, and weekend camping groups.",
};

export default function GroupsPage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <GroupListView />
    </div>
  );
}
