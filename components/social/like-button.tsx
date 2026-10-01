"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type LikeButtonProps = {
  liked: boolean;
  count: number;
  onToggle: () => void;
};

/** Like toggle with a live count. Reflects state via `aria-pressed`, and
 * the icon itself (filled vs. outline heart) rather than color alone. */
export function LikeButton({ liked, count, onToggle }: LikeButtonProps) {
  const [popping, setPopping] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={liked ? "Unlike this post" : "Like this post"}
      onClick={() => {
        if (!liked) setPopping(true);
        onToggle();
      }}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100",
        liked
          ? "text-[var(--outly-pink-bright)]"
          : "text-[var(--outly-muted)] hover:bg-[var(--outly-lavender)] hover:text-[var(--outly-violet)]",
      )}
    >
      <span
        aria-hidden="true"
        className={popping ? "animate-like-pop motion-reduce:animate-none" : undefined}
        onAnimationEnd={() => setPopping(false)}
      >
        <Icon name={liked ? "heart-filled" : "heart"} className="h-5 w-5" />
      </span>
      <span aria-hidden="true">{count}</span>
      <span className="sr-only">{count} likes</span>
    </button>
  );
}
