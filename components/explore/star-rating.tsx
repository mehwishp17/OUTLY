import { Icon } from "@/components/ui/icon";

type StarRatingProps = {
  rating: number;
  reviewCount: number;
  className?: string;
};

/** Rounded-to-nearest-star rating display. Read-only — the Reviews &
 * Ratings module (submitting a review) is a separate, later phase. */
export function StarRating({ rating, reviewCount, className }: StarRatingProps) {
  const roundedRating = Math.round(rating);

  return (
    <div className={className}>
      <span className="sr-only">
        {rating.toFixed(1)} out of 5 stars, from {reviewCount} reviews
      </span>
      <div aria-hidden="true" className="flex items-center gap-2">
        <div className="flex text-[var(--outly-violet)]">
          {Array.from({ length: 5 }, (_, index) => (
            <Icon
              key={index}
              name={index < roundedRating ? "star-filled" : "star"}
              className="h-4 w-4"
            />
          ))}
        </div>
        <span className="text-sm font-semibold text-[var(--outly-ink)]">{rating.toFixed(1)}</span>
        <span className="text-sm text-[var(--outly-muted)]">({reviewCount})</span>
      </div>
    </div>
  );
}
