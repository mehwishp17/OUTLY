"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FeedPostCard } from "@/components/feed/feed-post-card";
import { FeedSidebar } from "@/components/feed/feed-sidebar";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { AvatarRing } from "@/components/feed/post-parts";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Icon } from "@/components/ui/icon";
import { Reveal } from "@/components/ui/reveal";
import { useSocialStore } from "@/context/social-store-context";

/** Home Feed: a "start a post" prompt followed by every post, newest
 * first. Posts, comments, likes and saves all come from the OUTLY backend
 * (re-fetched each time the feed is opened). Redesigned presentation: a
 * single focused column with a profile/shortcuts column beside it on large screens. */
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
    .filter((post) => !post.groupId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,34rem)_17.5rem] lg:justify-center lg:py-10">
      <h1 className="sr-only">Your feed</h1>

      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-white/10 bg-[#17121f] p-3 shadow-[var(--shadow-soft)] transition-colors focus-within:border-white/20 hover:border-white/20 motion-reduce:transition-none">
          <AvatarRing name={currentUser.name} avatarUrl={currentUser.avatarUrl} />
          <Link
            href="/feed/new"
            className="flex min-w-0 flex-1 items-center gap-2 truncate rounded-full border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-[var(--outly-muted)] transition-colors hover:border-[var(--outly-pink)]/50 hover:text-white"
          >
            <span className="truncate">What are you exploring? Share a trail update or plan a meetup…</span>
          </Link>
          <Link
            href="/feed/new"
            aria-label="Add photos to a new post"
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[var(--outly-pink)] transition-colors hover:bg-white/10 sm:flex"
          >
            <Icon name="image" className="h-5 w-5" />
          </Link>
          <Link
            href="/feed/new"
            className="shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all gradient-brand hover:brightness-110 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            Post
          </Link>
        </div>

        {feedStatus === "loading" && sortedPosts.length === 0 ? (
          <FeedSkeleton message="Loading the feed…" />
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
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-white/10 bg-[#17121f] shadow-[var(--shadow-soft)]">
            <div className="relative aspect-[16/7]">
              <Image
                src="/images/landing/golden-hour-nandi.jpg"
                alt=""
                fill
                sizes="(min-width: 1024px) 34rem, 100vw"
                className="object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#17121f] via-[#17121f]/30 to-transparent"
              />
            </div>
            <div className="px-6 pb-7 pt-2 text-center">
              <p className="text-base font-semibold text-white">
                No posts yet — be the first to share an adventure.
              </p>
              <p className="mt-1 text-sm text-[var(--outly-muted)]">
                Photos, trail notes and meetups from the community appear here.
              </p>
              <Link
                href="/feed/new"
                className="mt-5 inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-all gradient-brand hover:brightness-110 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
              >
                Create a post
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {sortedPosts.map((post, index) => (
              <Reveal key={post.id} delay={Math.min(index, 5) * 60} distance={12} duration={450}>
                <FeedPostCard post={post} />
              </Reveal>
            ))}
          </div>
        )}
      </div>

      <FeedSidebar />
    </div>
  );
}
