"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OutlyLogo } from "@/components/brand/outly-logo";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/components/ui/icon";
import { useNotificationStore } from "@/context/notification-store-context";
import { useSocialStore } from "@/context/social-store-context";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: IconName };

const NAV_ITEMS: NavItem[] = [
  { href: "/feed", label: "Feed", icon: "compass" },
  { href: "/explore", label: "Explore", icon: "map" },
  { href: "/activities", label: "Activities", icon: "calendar" },
  { href: "/events", label: "Events", icon: "tent" },
  { href: "/groups", label: "Groups", icon: "users" },
  { href: "/partner", label: "Partners", icon: "bike" },
  { href: "/people", label: "People", icon: "search" },
  { href: "/chat", label: "Chats", icon: "message-circle" },
  { href: "/badges", label: "Badges", icon: "trophy" },
];

// Shown only to moderators and administrators (the backend enforces access too).
const ADMIN_ITEM: NavItem = { href: "/admin", label: "Admin", icon: "shield-check" };
const MODERATOR_ITEM: NavItem = { href: "/admin/reports", label: "Admin", icon: "shield-check" };
const STAFF_ROLES = ["CONTENT_MODERATOR", "ADMINISTRATOR"];

const linkBase =
  "relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors motion-reduce:transition-none";

/**
 * Top navigation for the signed-in product (kept separate from `SiteHeader`,
 * the marketing header). Shows the active section, the notification bell with
 * an unread badge, and the signed-in user's avatar. Labels appear from `xl`
 * up; below that the links are icon-only and the row scrolls sideways.
 */
export function AppHeader() {
  const pathname = usePathname();
  const { unreadCount } = useNotificationStore();
  const { currentUser } = useSocialStore();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--outly-border)] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-6">
        <OutlyLogo width={44} height={44} priority variant="transparent" quality={100} className="shrink-0" />

        <nav
          aria-label="Primary"
          className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {(STAFF_ROLES.includes(currentUser.role ?? "")
            ? [...NAV_ITEMS, currentUser.role === "ADMINISTRATOR" ? ADMIN_ITEM : MODERATOR_ITEM]
            : NAV_ITEMS
          ).map((item) => {
            const active = item.label === "Admin" ? pathname.startsWith("/admin") : isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                title={item.label}
                className={cn(
                  linkBase,
                  active
                    ? "bg-[var(--outly-lavender)] text-[var(--outly-violet)]"
                    : "text-[var(--outly-ink)] hover:bg-[var(--outly-lavender)]/70 hover:text-[var(--outly-violet)]",
                )}
              >
                <Icon name={item.icon} className="h-[18px] w-[18px]" />
                <span className="hidden xl:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/notifications"
            aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
            aria-current={isActive("/notifications") ? "page" : undefined}
            className={cn(
              linkBase,
              "px-2.5",
              isActive("/notifications")
                ? "bg-[var(--outly-lavender)] text-[var(--outly-violet)]"
                : "text-[var(--outly-ink)] hover:bg-[var(--outly-lavender)]/70 hover:text-[var(--outly-violet)]",
            )}
          >
            <Icon name="bell" className="h-[18px] w-[18px]" />
            {unreadCount > 0 ? (
              <span
                aria-hidden="true"
                className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white gradient-brand"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Link>
          <Link
            href="/profile"
            aria-label="Your profile"
            aria-current={isActive("/profile") ? "page" : undefined}
            className={cn(
              "rounded-full p-0.5 ring-2 transition-shadow motion-reduce:transition-none",
              isActive("/profile")
                ? "ring-[var(--outly-violet)]"
                : "ring-transparent hover:ring-[var(--outly-violet)]/40",
            )}
          >
            <Avatar name={currentUser.name} avatarUrl={currentUser.avatarUrl} size="sm" />
          </Link>
        </div>
      </div>
    </header>
  );
}
