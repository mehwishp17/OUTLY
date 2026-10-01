"use client";

import Link from "next/link";
import { OutlyLogo } from "@/components/brand/outly-logo";
import { Icon } from "@/components/ui/icon";
import { useNotificationStore } from "@/context/notification-store-context";

/**
 * Minimal top navigation shared by the Phase 3 profile and social pages
 * (feed, post detail/create/edit, profile, profile edit/settings). Kept
 * separate from `SiteHeader` (Phase 1's marketing header) since these
 * screens represent the signed-in product experience rather than the
 * public landing page.
 */
export function AppHeader() {
  const { unreadCount } = useNotificationStore();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--outly-border)] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <OutlyLogo width={36} height={36} priority />
        <nav
          aria-label="Primary"
          className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <Link
            href="/feed"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[var(--outly-ink)] transition-colors hover:bg-[var(--outly-lavender)] hover:text-[var(--outly-violet)]"
          >
            <Icon name="compass" className="h-4 w-4" />
            <span className="hidden sm:inline">Feed</span>
          </Link>
          <Link
            href="/explore"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[var(--outly-ink)] transition-colors hover:bg-[var(--outly-lavender)] hover:text-[var(--outly-violet)]"
          >
            <Icon name="map" className="h-4 w-4" />
            <span className="hidden sm:inline">Explore</span>
          </Link>
          <Link
            href="/activities"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[var(--outly-ink)] transition-colors hover:bg-[var(--outly-lavender)] hover:text-[var(--outly-violet)]"
          >
            <Icon name="calendar" className="h-4 w-4" />
            <span className="hidden sm:inline">Activities</span>
          </Link>
          <Link
            href="/events"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[var(--outly-ink)] transition-colors hover:bg-[var(--outly-lavender)] hover:text-[var(--outly-violet)]"
          >
            <Icon name="tent" className="h-4 w-4" />
            <span className="hidden sm:inline">Events</span>
          </Link>
          <Link
            href="/groups"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[var(--outly-ink)] transition-colors hover:bg-[var(--outly-lavender)] hover:text-[var(--outly-violet)]"
          >
            <Icon name="message-circle" className="h-4 w-4" />
            <span className="hidden sm:inline">Groups</span>
          </Link>
          <Link
            href="/partner"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[var(--outly-ink)] transition-colors hover:bg-[var(--outly-lavender)] hover:text-[var(--outly-violet)]"
          >
            <Icon name="bike" className="h-4 w-4" />
            <span className="hidden sm:inline">Partners</span>
          </Link>
          <Link
            href="/people"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[var(--outly-ink)] transition-colors hover:bg-[var(--outly-lavender)] hover:text-[var(--outly-violet)]"
          >
            <Icon name="search" className="h-4 w-4" />
            <span className="hidden sm:inline">People</span>
          </Link>
          <Link
            href="/chat"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[var(--outly-ink)] transition-colors hover:bg-[var(--outly-lavender)] hover:text-[var(--outly-violet)]"
          >
            <Icon name="message-circle" className="h-4 w-4" />
            <span className="hidden sm:inline">Chats</span>
          </Link>
          <Link
            href="/badges"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[var(--outly-ink)] transition-colors hover:bg-[var(--outly-lavender)] hover:text-[var(--outly-violet)]"
          >
            <Icon name="trophy" className="h-4 w-4" />
            <span className="hidden sm:inline">Badges</span>
          </Link>
          <Link
            href="/notifications"
            aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
            className="relative flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[var(--outly-ink)] transition-colors hover:bg-[var(--outly-lavender)] hover:text-[var(--outly-violet)]"
          >
            <Icon name="bell" className="h-4 w-4" />
            {unreadCount > 0 ? (
              <span
                aria-hidden="true"
                className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white gradient-brand"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[var(--outly-ink)] transition-colors hover:bg-[var(--outly-lavender)] hover:text-[var(--outly-violet)]"
          >
            <Icon name="pin" className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </Link>
          {/* The Admin link is intentionally not shown to anyone yet: the backend's
              `role` (GET /users/me/) is an undocumented free string (only "USER" is
              observed), so there is no reliable admin/staff signal to gate it on.
              Add the link back here once the admin role value is known. */}
        </nav>
      </div>
    </header>
  );
}
