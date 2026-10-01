import { Tabs } from "@/components/ui/tabs";
import { ProfileActivityHistory } from "@/components/profile/profile-activity-history";
import { ProfileSavedPlaces } from "@/components/profile/profile-saved-places";
import { ProfileBio } from "@/components/profile/profile-bio";
import type { CompletedActivity, SavedPlace } from "@/types/profile";

type ProfileTabsProps = {
  bio?: string;
  activities: CompletedActivity[];
  savedPlaces: SavedPlace[];
  showActivityHistory: boolean;
  showSavedPlaces: boolean;
  onRemoveSavedPlace: (placeId: string) => void;
};

/** Groups the profile's Activity history / Saved places / About sections
 * into one tabbed panel. When a section is hidden via privacy settings,
 * its tab still exists but explains that it's currently private, rather
 * than disappearing without explanation. */
export function ProfileTabs({
  bio,
  activities,
  savedPlaces,
  showActivityHistory,
  showSavedPlaces,
  onRemoveSavedPlace,
}: ProfileTabsProps) {
  return (
    <Tabs
      ariaLabel="Profile sections"
      items={[
        {
          id: "activity",
          label: "Activity history",
          content: showActivityHistory ? (
            <ProfileActivityHistory activities={activities} />
          ) : (
            <p className="text-sm text-[var(--outly-muted)]">
              Activity history is hidden. Update this in{" "}
              <a href="/profile/settings" className="font-semibold text-[var(--outly-violet)]">
                privacy settings
              </a>
              .
            </p>
          ),
        },
        {
          id: "saved",
          label: "Saved places",
          content: showSavedPlaces ? (
            <ProfileSavedPlaces places={savedPlaces} onRemove={onRemoveSavedPlace} />
          ) : (
            <p className="text-sm text-[var(--outly-muted)]">
              Saved places are hidden. Update this in{" "}
              <a href="/profile/settings" className="font-semibold text-[var(--outly-violet)]">
                privacy settings
              </a>
              .
            </p>
          ),
        },
        {
          id: "about",
          label: "About",
          content: <ProfileBio bio={bio} />,
        },
      ]}
    />
  );
}
