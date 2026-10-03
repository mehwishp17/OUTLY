"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { FormError } from "@/components/ui/form-error";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { Textarea } from "@/components/ui/textarea";
import { deleteReview, fetchReviews, submitReview, updateReview } from "@/lib/api/reviews";
import type { Review, ReviewTarget } from "@/lib/api/reviews";
import { cn, formatRelativeTime } from "@/lib/utils";

type ReviewSectionProps = {
  target: ReviewTarget;
  targetId: string;
  /** False when the viewer can't review (e.g. an event they didn't attend). */
  canWrite?: boolean;
  /** Why the viewer can't write a review, shown instead of the form. */
  writeHint?: string;
  /** Called after a review is added, changed or removed (so the page can refresh the average rating). */
  onChanged?: () => void;
};

function StarPicker({ value, onChange }: { value: number; onChange: (rating: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Your rating" className="flex gap-1 text-[var(--outly-violet)]">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          role="radio"
          aria-checked={value === rating}
          aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
          onClick={() => onChange(rating)}
          className="rounded-full p-0.5 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none"
        >
          <Icon name={rating <= value ? "star-filled" : "star"} className="h-6 w-6" />
        </button>
      ))}
    </div>
  );
}

/**
 * Reviews for a place, trail or event: everyone's reviews, plus a form to
 * write, edit or remove your own. The backend allows one review each and
 * keeps the average rating exact.
 */
export function ReviewSection({ target, targetId, canWrite = true, writeHint, onChanged }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string>();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetchReviews(target, targetId).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setReviews(result.data);
        setStatus("ready");
      } else {
        setError(result.message);
        setStatus("error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [target, targetId, reloadKey]);

  const load = () => setReloadKey((key) => key + 1);

  const mine = reviews.find((review) => review.isMine);
  const showForm = canWrite && (!mine || editing);

  function startEditing(review: Review) {
    setRating(review.rating);
    setText(review.text);
    setFormError(undefined);
    setEditing(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rating < 1) {
      setFormError("Choose a star rating.");
      return;
    }
    setSaving(true);
    setFormError(undefined);
    const result = mine && editing
      ? await updateReview(mine.id, rating, text.trim())
      : await submitReview(target, targetId, rating, text.trim());
    setSaving(false);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    setEditing(false);
    setRating(0);
    setText("");
    load();
    onChanged?.();
  }

  async function handleDelete() {
    if (!mine) return;
    setConfirmingDelete(false);
    const result = await deleteReview(mine.id);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    load();
    onChanged?.();
  }

  return (
    <section aria-labelledby="reviews-heading" className="space-y-4">
      <h2 id="reviews-heading" className="text-sm font-semibold uppercase tracking-wide text-[var(--outly-muted)]">
        Reviews{status === "ready" ? ` (${reviews.length})` : ""}
      </h2>

      {showForm ? (
        <form noValidate onSubmit={handleSubmit} className="space-y-3 rounded-[var(--radius-md)] border border-[var(--outly-border)] bg-[var(--outly-lavender)] p-4">
          <p className="text-sm font-semibold text-[var(--outly-ink)]">{mine ? "Edit your review" : "Write a review"}</p>
          <StarPicker value={rating} onChange={setRating} />
          <Textarea
            id={`review-text-${target}-${targetId}`}
            label="Your review (optional)"
            rows={3}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="What was it like? Conditions, crowds, tips for others…"
          />
          {formError ? <FormError id="review-error">{formError}</FormError> : null}
          <div className="flex gap-2">
            <Button type="submit" size="md" disabled={saving}>
              {mine ? "Save review" : "Post review"}
            </Button>
            {editing ? (
              <Button type="button" size="md" variant="secondary" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      ) : !canWrite && writeHint ? (
        <p className="text-sm text-[var(--outly-muted)]">{writeHint}</p>
      ) : null}

      {status === "loading" ? (
        <LoadingState message="Loading reviews…" className="py-6" />
      ) : status === "error" ? (
        <ErrorState title="We couldn't load reviews" description={error} />
      ) : reviews.length === 0 ? (
        <p className="text-sm text-[var(--outly-muted)]">No reviews yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-[var(--radius-md)] border border-[var(--outly-border)] bg-white p-4">
              <div className="flex items-center gap-3">
                <Avatar name={review.authorName} avatarUrl={review.authorAvatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--outly-ink)]">
                    {review.authorName}
                    {review.isMine ? <span className="ml-1.5 text-xs font-normal text-[var(--outly-muted)]">(You)</span> : null}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="flex text-[var(--outly-violet)]" role="img" aria-label={`${review.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Icon key={n} name={n <= review.rating ? "star-filled" : "star"} className={cn("h-3.5 w-3.5")} />
                      ))}
                    </span>
                    <span className="text-xs text-[var(--outly-muted)]">{formatRelativeTime(review.createdAt)}</span>
                  </div>
                </div>
                {review.isMine && !editing ? (
                  <div className="flex shrink-0 gap-1">
                    <Button size="md" variant="ghost" onClick={() => startEditing(review)}>
                      Edit
                    </Button>
                    <Button size="md" variant="ghost" onClick={() => setConfirmingDelete(true)}>
                      Delete
                    </Button>
                  </div>
                ) : null}
              </div>
              {review.text ? <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--outly-ink)]">{review.text}</p> : null}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete your review?"
        description="This can't be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </section>
  );
}
