import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { CreateGroupView } from "@/components/groups/create-group-view";

export const metadata: Metadata = {
  title: "Create a group — OUTLY",
  description: "Start a community around a shared outdoor interest.",
};

export default function NewGroupPage() {
  return (
    <div className="min-h-svh bg-[var(--outly-lavender)]">
      <AppHeader />
      <CreateGroupView />
    </div>
  );
}
