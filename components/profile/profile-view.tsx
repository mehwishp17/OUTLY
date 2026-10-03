"use client";

import { useEffect } from "react";
import { useFollowStore } from "@/context/follow-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ProfileTabs } from "@/components/profile/profile-tabs";

/**
 * Client entry point for `/profile`. Reads the signed-in user's profile from
 * `social-store-context` (loaded from the backend) and composes the presentational profile
 * components. Split out from `app/profile/page.tsx` so that file can stay
 * a server component and export route metadata.
 */
export function ProfileView({ initialTab }: { initialTab?: string }) {
  const { currentUser, removeSavedPlace } = useSocialStore();
  const { getFollowerIds, getFollowingIds, loadFollowLists } = useFollowStore();
  const meId = currentUser.id;

  useEffect(() => {
    if (meId) void loadFollowLists(meId);
  }, [meId, loadFollowLists]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <ProfileHeader
        name={currentUser.name}
        username={currentUser.username}
        avatarUrl={currentUser.avatarUrl}
        location={currentUser.location}
        skillLevel={currentUser.skillLevel}
      />
      <ProfileStats
        stats={[
          { label: "Followers", value: getFollowerIds(currentUser.id).length, href: `/people/${currentUser.id}/followers` },
          { label: "Following", value: getFollowingIds(currentUser.id).length, href: `/people/${currentUser.id}/following` },
          { label: "Joined communities", value: currentUser.joinedCommunities.length, href: "/groups" },
          { label: "Saved experiences", value: currentUser.savedPlaces.length, href: "/profile?tab=saved#profile-sections" },
          { label: "Completed activities", value: currentUser.completedActivities.length, href: "/profile?tab=activity#profile-sections" },
        ]}
      />
      <section id="profile-sections" className="scroll-mt-20 rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-8">
        <ProfileTabs
          bio={currentUser.bio}
          activities={currentUser.completedActivities}
          savedPlaces={currentUser.savedPlaces}
          showActivityHistory={currentUser.privacy.showActivityHistory}
          showSavedPlaces={currentUser.privacy.showSavedPlaces}
          onRemoveSavedPlace={removeSavedPlace}
          initialTab={initialTab}
        />
      </section>
    </div>
  );
}
