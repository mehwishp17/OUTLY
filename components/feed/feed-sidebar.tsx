"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/components/ui/icon";
import { AvatarRing } from "@/components/feed/post-parts";
import { useSocialStore } from "@/context/social-store-context";

const DISCOVER: { href: string; label: string; detail: string; icon: IconName }[] = [
  { href: "/explore", label: "Explore", detail: "Trails, viewpoints and campsites", icon: "map" },
  { href: "/events", label: "Events", detail: "Group hikes and meetups", icon: "tent" },
  { href: "/groups", label: "Groups", detail: "Find your community", icon: "users" },
  { href: "/people", label: "People", detail: "Find explorers to follow", icon: "search" },
];

/**
 * Desktop side column for the Home Feed: the signed-in user's own profile summary (real data from the
 * profile store) and shortcuts to other areas of OUTLY. It shows no suggestions, counts or other people.
 */
export function FeedSidebar() {
  const { currentUser } = useSocialStore();
  const loaded = Boolean(currentUser.name);

  return (
    <aside aria-label="Your profile and shortcuts" className="hidden lg:block">
      <div className="sticky top-24 space-y-5">
        <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[#17121f] p-5 shadow-[var(--shadow-soft)]">
          {loaded ? (
            <>
              <div className="flex items-center gap-3">
                <Link href="/profile" aria-label="Your profile" className="rounded-full">
                  <AvatarRing name={currentUser.name} avatarUrl={currentUser.avatarUrl} size="lg" />
                </Link>
                <div className="min-w-0">
                  <Link
                    href="/profile"
                    className="block truncate text-sm font-semibold text-white hover:text-[var(--outly-pink)]"
                  >
                    {currentUser.name}
                  </Link>
                  {currentUser.username ? (
                    <p className="truncate text-xs text-[var(--outly-muted)]">@{currentUser.username}</p>
                  ) : null}
                  {currentUser.location ? (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-[var(--outly-muted)]">
                      <Icon name="pin" className="h-3 w-3 shrink-0 text-[var(--outly-pink)]" />
                      <span className="truncate">{currentUser.location}</span>
                    </p>
                  ) : null}
                </div>
              </div>
              {currentUser.bio ? (
                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-white/80">{currentUser.bio}</p>
              ) : null}
              <Link
                href="/feed/new"
                className="mt-5 flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white transition-all gradient-brand hover:brightness-110 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
              >
                <Icon name="plus" className="h-4 w-4" />
                Create a post
              </Link>
            </>
          ) : (
            <div aria-hidden="true" className="animate-pulse space-y-4 motion-reduce:animate-none">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-white/10" />
                <div className="space-y-2">
                  <div className="h-3 w-28 rounded-full bg-white/10" />
                  <div className="h-2.5 w-20 rounded-full bg-white/[0.07]" />
                </div>
              </div>
              <div className="h-10 rounded-full bg-white/[0.07]" />
            </div>
          )}
        </div>

        <nav aria-label="Discover" className="rounded-[var(--radius-lg)] border border-white/10 bg-[#17121f] p-2 shadow-[var(--shadow-soft)]">
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--outly-muted)]">
            Discover
          </p>
          <ul>
            {DISCOVER.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 transition-colors hover:bg-white/[0.06]"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[var(--outly-pink)] transition-colors group-hover:bg-white/10"
                  >
                    <Icon name={item.icon} className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 text-sm">
                    <span className="block font-semibold text-white">{item.label}</span>
                    <span className="block truncate text-xs text-[var(--outly-muted)]">{item.detail}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
