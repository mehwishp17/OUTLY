type ProfileBioProps = {
  bio?: string;
};

/** "About" panel content — the user's short biography, or an inviting
 * empty state when none has been added yet. */
export function ProfileBio({ bio }: ProfileBioProps) {
  if (!bio) {
    return (
      <p className="text-sm leading-relaxed text-[var(--outly-muted)]">
        No bio yet.{" "}
        <a href="/profile/edit" className="font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]">
          Add a short introduction
        </a>{" "}
        so other explorers know what you&apos;re about.
      </p>
    );
  }

  return <p className="text-sm leading-relaxed text-[var(--outly-ink)]">{bio}</p>;
}
