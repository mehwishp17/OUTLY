"use client";

import { useId, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { FormError } from "@/components/ui/form-error";

type AvatarUploadProps = {
  name: string;
  avatarUrl?: string;
  /** `file` is the newly chosen image (to be uploaded when the profile is saved). */
  onChange: (avatarUrl: string | undefined, file?: File) => void;
};

/**
 * Avatar picker. Selecting a file shows an immediate local preview and hands
 * the file to the parent, which uploads it when the profile is saved.
 * "Remove photo" reverts to the initials fallback. Rejects non-image files
 * with an accessible inline error.
 */
export function AvatarUpload({ name, avatarUrl, onChange }: AvatarUploadProps) {
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();

  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPG, or similar).");
      return;
    }

    setError(undefined);
    const previewUrl = URL.createObjectURL(file);
    onChange(previewUrl, file);
  }

  function handleRemove() {
    setError(undefined);
    onChange(undefined);
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} avatarUrl={avatarUrl} size="xl" />
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--outly-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--outly-ink)] shadow-[var(--shadow-soft)] transition-colors hover:border-[var(--outly-violet)]/60"
          >
            <Icon name="camera" className="h-4 w-4" />
            Change photo
          </button>
          {avatarUrl ? (
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[var(--outly-muted)] transition-colors hover:bg-[var(--outly-lavender)]"
            >
              Remove photo
            </button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-describedby={error ? errorId : undefined}
          aria-label="Upload a profile photo"
          onChange={handleFileSelected}
        />
        <p className="text-xs text-[var(--outly-muted)]">
          JPG, PNG or WebP, up to 5 MB.
        </p>
        {error ? <FormError id={errorId}>{error}</FormError> : null}
      </div>
    </div>
  );
}
