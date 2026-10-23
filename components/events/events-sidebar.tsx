"use client";

import Link from "next/link";
import { AvatarRing } from "@/components/feed/post-parts";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/components/ui/icon";
import { useSocialStore } from "@/context/social-store-context";
import type { OutlyEvent } from "@/types/event";

const SHORTCUTS: { href: string; label: string; detail: string; icon: IconName }[] = [
  { href: "/explore", label: "Explore", detail: "Trails, viewpoints and campsites", icon: "map" },
  { href: "/groups", label: "Groups", detail: "Find your community", icon: "users" },
  { href: "/activities", label: "Activities", detail: "Plan and join activities", icon: "compass" },
  { href: "/people", label: "People", detail: "Find explorers to follow", icon: "search" },
];

const SOON_LIMIT = 3;

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/**
 * Right column of the Events page (desktop): the signed-in user's own profile summary, the next upcoming
 * events, and shortcuts to other areas. Everything shown is real: the profile comes from the profile store
 * and the events are the ones the page already loaded (no extra request, nothing invented).
 */
export function EventsSidebar({ upcoming }: { upcoming: OutlyEvent[] }) {
  const { currentUser } = useSocialStore();
  const loaded = Boolean(currentUser.name);
  const soon = upcoming.slice(0, SOON_LIMIT);

  return (
    <aside aria-label="Your profile and upcoming events" className="hidden lg:block">
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
                    className="block truncate text-sm font-semibold text-white transition-colors hover:text-[var(--outly-pink)]"
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
            </>
          ) : (
            <div aria-hidden="true" className="flex animate-pulse items-center gap-3 motion-reduce:animate-none">
              <div className="h-14 w-14 rounded-full bg-white/10" />
              <div className="space-y-2">
                <div className="h-3 w-28 rounded-full bg-white/10" />
                <div className="h-2.5 w-20 rounded-full bg-white/[0.07]" />
              </div>
            </div>
          )}
        </div>

        <section
          aria-labelledby="events-soon-heading"
          className="rounded-[var(--radius-lg)] border border-white/10 bg-[#17121f] p-2 shadow-[var(--shadow-soft)]"
        >
          <h2
            id="events-soon-heading"
            className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--outly-muted)]"
          >
            Coming up
          </h2>
          {soon.length === 0 ? (
            <p className="px-3 pb-3 pt-1 text-sm text-[var(--outly-muted)]">No upcoming events yet.</p>
          ) : (
            <ul>
              {soon.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/events/${event.id}`}
                    className="group flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 transition-colors hover:bg-white/[0.06]"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-[var(--radius-sm)] bg-white/[0.06] text-[var(--outly-pink)]"
                    >
                      <span className="text-[9px] font-semibold uppercase leading-none">
                        {new Date(event.startAt).toLocaleDateString(undefined, { month: "short" })}
                      </span>
                      <span className="text-sm font-bold leading-tight text-white">{new Date(event.startAt).getDate()}</span>
                    </span>
                    <span className="min-w-0 text-sm">
                      <span className="block truncate font-semibold text-white group-hover:text-[var(--outly-pink)]">
                        {event.title}
                      </span>
                      <span className="block truncate text-xs text-[var(--outly-muted)]">
                        {shortDate(event.startAt)} · {event.location}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <nav aria-label="Discover" className="rounded-[var(--radius-lg)] border border-white/10 bg-[#17121f] p-2 shadow-[var(--shadow-soft)]">
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--outly-muted)]">
            Discover
          </p>
          <ul>
            {SHORTCUTS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 transition-colors hover:bg-white/[0.06]"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[var(--outly-pink)]"
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

        <p className="px-2 text-xs text-white/40">OUTLY — Explore, Connect, Belong</p>
      </div>
    </aside>
  );
}
