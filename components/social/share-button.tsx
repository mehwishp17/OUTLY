"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";

type ShareButtonProps = {
  postId: string;
};

/**
 * Share a post's link. Frontend-only: it uses the browser's native share
 * sheet when available and otherwise copies `/feed/<id>` to the clipboard.
 * Nothing is sent to the backend (it has no share endpoint).
 */
export function ShareButton({ postId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function handleShare() {
    const url = `${window.location.origin}/feed/${postId}`;
    try {
      if (navigator.share) {
        await navigator.share({ url, title: "OUTLY" });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // Share sheet dismissed or clipboard unavailable: nothing to do.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Share this post"
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-[var(--outly-muted)] transition-all hover:bg-[var(--outly-lavender)] hover:text-[var(--outly-violet)] active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
    >
      <Icon name="share" className="h-5 w-5" />
      <span aria-live="polite" className={copied ? "text-xs" : "sr-only"}>
        {copied ? "Link copied" : ""}
      </span>
    </button>
  );
}
