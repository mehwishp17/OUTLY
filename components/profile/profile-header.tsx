import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { Icon } from "@/components/ui/icon";
import { ADVENTURE_IMAGES } from "@/lib/adventure-images";
import type { SkillLevel } from "@/types/profile";

const SKILL_LABELS: Record<SkillLevel, string> = {
  beginner: "Beginner explorer",
  intermediate: "Intermediate explorer",
  advanced: "Advanced explorer",
};

type ProfileHeaderProps = {
  name: string;
  username: string;
  avatarUrl?: string;
  location?: string;
  skillLevel: SkillLevel;
};

/**
 * Cover + avatar + identity block at the top of /profile. The cover is a
 * local adventure photo over the shared brand gradient.
 */
export function ProfileHeader({ name, username, avatarUrl, location, skillLevel }: ProfileHeaderProps) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white shadow-[var(--shadow-soft)]">
      <div className="group relative h-28 w-full overflow-hidden gradient-brand sm:h-36" aria-hidden="true">
        <CoverImage src={ADVENTURE_IMAGES.profileCover} sizes="(min-width: 1024px) 900px, 100vw" position="center 58%" />
      </div>
      <div className="relative flex flex-col gap-4 px-5 pb-6 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:gap-5">
          <Avatar
            name={name}
            avatarUrl={avatarUrl}
            size="xl"
            className="-mt-10 shrink-0 border-4 border-white shadow-[var(--shadow-elevated)]"
          />
          <div className="sm:pt-3">
            <h1 className="text-xl font-bold text-[var(--outly-ink)] sm:text-2xl">{name}</h1>
            <p className="text-sm font-medium text-[var(--outly-muted)]">@{username}</p>
            {location ? (
              <p className="mt-1 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-[var(--outly-violet)]">
                <Icon name="pin" className="h-3.5 w-3.5" />
                {location}
              </p>
            ) : null}
            <Badge variant="solid" className="mt-2">
              {SKILL_LABELS[skillLevel]}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2.5 pt-2 sm:pt-0">
          <Button href="/profile/edit" variant="secondary" size="md">
            Edit profile
          </Button>
          <Button href="/profile/settings" variant="ghost" size="md" aria-label="Profile settings">
            <Icon name="settings" className="h-4.5 w-4.5" />
            Settings
          </Button>
        </div>
      </div>
    </section>
  );
}
