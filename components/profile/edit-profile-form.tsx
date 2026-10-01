"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { LoadingState } from "@/components/ui/loading-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { ProfileInterests } from "@/components/profile/profile-interests";
import { useSocialStore } from "@/context/social-store-context";
import { validateEditProfileForm, BIO_MAX_LENGTH } from "@/lib/validation/profile-schema";
import { ONBOARDING_ACTIVITY_LEVELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { EditProfileErrors, EditProfileValues, SkillLevel } from "@/types/profile";

/**
 * Edit-profile form. Pre-filled from the shared mock profile in
 * `social-store-context`; "Save changes" simulates a short delay, then
 * writes the new values back into context (so /profile reflects them
 * immediately) and redirects there. Nothing is sent to a server.
 */
function EditProfileFormFields() {
  const router = useRouter();
  const { currentUser, updateProfile, updateAvatar } = useSocialStore();

  const [values, setValues] = useState<EditProfileValues>({
    name: currentUser.name,
    username: currentUser.username,
    location: currentUser.location ?? "",
    bio: currentUser.bio ?? "",
    interests: currentUser.interests,
    skillLevel: currentUser.skillLevel,
  });
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl);
  const [errors, setErrors] = useState<EditProfileErrors>({});
  const [status, setStatus] = useState<"idle" | "saving" | "success">("idle");
  const [saveError, setSaveError] = useState<string>();

  function updateField<K extends keyof EditProfileValues>(key: K, value: EditProfileValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function toggleInterest(id: string) {
    setValues((current) => ({
      ...current,
      interests: current.interests.includes(id)
        ? current.interests.filter((interestId) => interestId !== id)
        : [...current.interests, id],
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateEditProfileForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus("saving");
    setSaveError(undefined);
    const error = await updateProfile(values);
    if (error) {
      setSaveError(error);
      setStatus("idle");
      return;
    }
    updateAvatar(avatarUrl);
    setStatus("success");
    router.push("/profile");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <AvatarUpload name={values.name || currentUser.name} avatarUrl={avatarUrl} onChange={setAvatarUrl} />

      {status === "success" ? <Alert variant="success" title="Profile updated" /> : null}
      {saveError ? <Alert variant="error" title="Couldn't save your profile">{saveError}</Alert> : null}

      <Input
        id="profile-name"
        label="Name"
        required
        value={values.name}
        onChange={(event) => updateField("name", event.target.value)}
        error={errors.name}
        autoComplete="name"
      />
      <Input
        id="profile-username"
        label="Username"
        required
        value={values.username}
        onChange={(event) => updateField("username", event.target.value)}
        error={errors.username}
        hint="Letters, numbers, and underscores only."
      />
      <Input
        id="profile-location"
        label="Location"
        value={values.location}
        onChange={(event) => updateField("location", event.target.value)}
        placeholder="e.g. Bengaluru, Karnataka"
      />
      <Textarea
        id="profile-bio"
        label="Biography"
        rows={4}
        value={values.bio}
        onChange={(event) => updateField("bio", event.target.value.slice(0, BIO_MAX_LENGTH))}
        error={errors.bio}
        hint={`${values.bio.length}/${BIO_MAX_LENGTH} characters`}
      />

      <div>
        <p className="mb-2 block text-sm font-semibold text-[var(--outly-ink)]">Outdoor interests</p>
        <ProfileInterests selected={values.interests} onToggle={toggleInterest} />
      </div>

      <div>
        <p className="mb-2 block text-sm font-semibold text-[var(--outly-ink)]">Skill / experience level</p>
        <div role="radiogroup" aria-label="Skill / experience level" className="grid gap-2.5 sm:grid-cols-3">
          {ONBOARDING_ACTIVITY_LEVELS.map((level) => {
            const isSelected = values.skillLevel === level.id;
            return (
              <button
                key={level.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => updateField("skillLevel", level.id as SkillLevel)}
                className={cn(
                  "rounded-[var(--radius-md)] border p-3.5 text-left text-sm transition-colors motion-reduce:transition-none",
                  isSelected
                    ? "border-transparent gradient-brand text-white"
                    : "border-[var(--outly-border)] bg-white text-[var(--outly-ink)] hover:border-[var(--outly-violet)]/60",
                )}
              >
                <span className="block font-semibold">{level.label}</span>
                <span className={cn("mt-0.5 block text-xs", isSelected ? "text-white/80" : "text-[var(--outly-muted)]")}>
                  {level.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[var(--outly-border)] pt-6">
        <Button href="/profile" variant="ghost">
          Cancel
        </Button>
        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? (
            <>
              <LoadingSpinner /> Saving…
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </form>
  );
}

/** Waits for the signed-in profile to load so the form starts from real data. */
export function EditProfileForm() {
  const { currentUserStatus } = useSocialStore();
  if (currentUserStatus === "error") {
    return <Alert variant="error" title="We couldn't load your profile. Please refresh and try again." />;
  }
  if (currentUserStatus !== "ready") return <LoadingState message="Loading your profile…" />;
  return <EditProfileFormFields />;
}
