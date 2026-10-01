"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { PostCard } from "@/components/feed/post-card";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useSocialStore } from "@/context/social-store-context";

/** Home Feed: a "start a post" prompt followed by every post, newest
 * first. Posts and comments are loaded from the OUTLY backend (re-fetched
 * each time the feed is opened); likes and saves are local-only. */
export function FeedView() {
  const router = useRouter();
  const { currentUser, posts, feedStatus, feedError, refreshFeed } = useSocialStore();

  useEffect(() => {
    void refreshFeed();
  }, [refreshFeed]);

  useEffect(() => {
    // The session ended (e.g. the refresh token expired): go back to login.
    if (feedError?.status === 401) router.replace("/login?next=/feed");
  }, [feedError, router]);

  const sortedPosts = posts
    .filter((post) => post.persisted && !post.groupId && !post.hidden)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white px-4 py-3.5 shadow-[var(--shadow-soft)] transition-shadow focus-within:shadow-[var(--shadow-elevated)] hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none">
        <Avatar name={currentUser.name} avatarUrl={currentUser.avatarUrl} size="md" />
        <Link
          href="/feed/new"
          className="min-w-0 flex-1 truncate rounded-full border border-[var(--outly-border)] bg-[var(--outly-lavender)]/60 px-4 py-2.5 text-sm text-[var(--outly-muted)] transition-colors hover:border-[var(--outly-violet)]/50 hover:text-[var(--outly-violet)]"
        >
          What are you exploring? Share a trail update or plan a meetup…
        </Link>
        <Link
          href="/feed/new"
          className="shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all gradient-brand hover:brightness-110 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          Post
        </Link>
      </div>

      {feedStatus === "loading" && sortedPosts.length === 0 ? (
        <LoadingState message="Loading the feed…" />
      ) : feedStatus === "error" && sortedPosts.length === 0 ? (
        <ErrorState
          title="We couldn't load the feed"
          description={feedError?.message}
          action={
            <Button variant="secondary" onClick={() => void refreshFeed()}>
              Try again
            </Button>
          }
        />
      ) : sortedPosts.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white px-5 py-8 text-center text-sm text-[var(--outly-muted)] shadow-[var(--shadow-soft)]">
          No posts yet — be the first to share an adventure.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {sortedPosts.map((post, index) => (
            <Reveal key={post.id} delay={Math.min(index, 5) * 60} distance={12} duration={450}>
              <PostCard post={post} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
