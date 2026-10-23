"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AvatarRing } from "@/components/feed/post-parts";
import { useSocialStore } from "@/context/social-store-context";
import { POST_CONTENT_MAX_LENGTH, validatePostComposer } from "@/lib/validation/post-schema";
import type { PostComposerErrors } from "@/types/post";

const MAX_IMAGES = 4;

type PostComposerSubmitValues = {
  content: string;
  location?: string;
  /** Photos left on the post: existing URLs plus the local previews of new ones. */
  images?: string[];
  /** The new photos (local preview URL + the file to upload). */
  files?: { url: string; file: File }[];
};

type PostComposerProps = {
  title: string;
  description?: string;
  initialContent?: string;
  initialLocation?: string;
  initialImages?: string[];
  submitLabel: string;
  /** May return a promise resolving to an error message; the form then stays
   * open and shows it instead of navigating away. */
  onSubmit: (values: PostComposerSubmitValues) => void | Promise<string | undefined>;
  onCancel: () => void;
};

/**
 * Shared create/edit post form. Chosen photos are previewed through local
 * object URLs and handed to `onSubmit` as files, which the social store
 * uploads to the backend before saving the post.
 */
export function PostComposer({
  title,
  description,
  initialContent = "",
  initialLocation = "",
  initialImages = [],
  submitLabel,
  onSubmit,
  onCancel,
}: PostComposerProps) {
  const { currentUser } = useSocialStore();
  const [content, setContent] = useState(initialContent);
  const [location, setLocation] = useState(initialLocation);
  const [images, setImages] = useState<string[]>(initialImages);
  // New photos by their local preview URL, so we upload exactly the ones that remain.
  const pendingFiles = useRef(new Map<string, File>());
  const [errors, setErrors] = useState<PostComposerErrors>({});
  const [imageError, setImageError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputId = useId();

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const nonImageFile = files.find((file) => !file.type.startsWith("image/"));
    if (nonImageFile) {
      setImageError("Please choose image files only (PNG, JPG, or similar).");
      return;
    }

    setImages((current) => {
      const remainingSlots = MAX_IMAGES - current.length;
      if (remainingSlots <= 0) {
        setImageError(`You can attach up to ${MAX_IMAGES} images.`);
        return current;
      }
      setImageError(undefined);
      const accepted = files.slice(0, remainingSlots).map((file) => {
        const url = URL.createObjectURL(file);
        pendingFiles.current.set(url, file);
        return url;
      });
      return [...current, ...accepted];
    });
  }

  function handleRemoveImage(url: string) {
    pendingFiles.current.delete(url);
    setImages((current) => current.filter((image) => image !== url));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const validationErrors = validatePostComposer(content);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(undefined);
    const error = await onSubmit({
      content: content.trim(),
      location: location.trim() || undefined,
      images,
      files: images
        .filter((url) => pendingFiles.current.has(url))
        .map((url) => ({ url, file: pendingFiles.current.get(url)! })),
    });
    if (error) {
      setSubmitError(error);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[#17121f] p-6 shadow-[var(--shadow-elevated)] sm:p-8">
      <div className="flex items-start gap-3.5">
        <AvatarRing name={currentUser.name} avatarUrl={currentUser.avatarUrl} />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-[var(--outly-muted)]">{description}</p>
          ) : null}
        </div>
      </div>

      <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-5">
        <Textarea
          id="post-content"
          label="What's happening?"
          required
          rows={5}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          error={errors.content}
          hint={`${content.trim().length}/${POST_CONTENT_MAX_LENGTH} characters`}
          placeholder="Share a trail update, plan a meetup, or post about your latest adventure…"
        />

        <Input
          id="post-location"
          label="Location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="e.g. Kedarkantha, Uttarakhand"
          hint="Optional — helps others find posts about a place they know."
        />

        <div className="space-y-2">
          <span className="flex items-baseline justify-between text-sm font-semibold text-white">
            Photos
            <span className="text-xs font-medium text-[var(--outly-muted)]">
              {images.length}/{MAX_IMAGES}
            </span>
          </span>

          {images.length > 0 ? (
            <div className="grid grid-cols-4 gap-2.5">
              {images.map((image) => (
                <div key={image} className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] ring-1 ring-white/15">
                  {/* eslint-disable-next-line @next/next/no-img-element -- blob preview or backend-served photo. */}
                  <img src={image} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(image)}
                    aria-label="Remove this photo"
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur transition-colors hover:bg-black/85"
                  >
                    <Icon name="close" className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= MAX_IMAGES}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-white/25 bg-white/[0.03] px-4 py-5 text-sm font-semibold text-white transition-colors hover:border-[var(--outly-pink)]/60 hover:bg-white/[0.06] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none"
          >
            <Icon name="image" className="h-5 w-5 text-[var(--outly-pink)]" />
            {images.length > 0 ? "Add more photos" : "Add photos"}
          </button>
          <input
            ref={fileInputRef}
            id={imageInputId}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            aria-label="Add photos to your post"
            onChange={handleFilesSelected}
          />
          <p className="text-xs text-[var(--outly-muted)]">
            Up to {MAX_IMAGES} photos (JPG, PNG or WebP, 5 MB each).
          </p>
          {imageError ? <FormError id="post-images-error">{imageError}</FormError> : null}
        </div>

        {submitError ? <FormError id="post-submit-error">{submitError}</FormError> : null}

        <div className="flex flex-col gap-3 border-t border-[var(--outly-border)] pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
