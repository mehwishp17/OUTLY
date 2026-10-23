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

// Sidebar rows: icon rail from `md`, icon + label from `xl` (the same breakpoint the top bar used for labels).
const sidebarLinkBase =
  "relative flex items-center justify-center gap-4 rounded-[var(--radius-md)] px-3 py-3 text-[0.95rem] font-semibold transition-colors motion-reduce:transition-none xl:justify-start";

/**
 * Navigation for the signed-in product (kept separate from `SiteHeader`, the
 * marketing header). The same links, active states, notification bell with
 * unread badge and profile avatar are rendered two ways: a fixed left sidebar
 * from `md` up (an icon rail, with labels from `xl`), and the original top bar
 * below `md`, where the links are icon-only and the row scrolls sideways.
 */
export function AppHeader() {
  const pathname = usePathname();
  const { unreadCount } = useNotificationStore();
  const { currentUser } = useSocialStore();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const navItems = STAFF_ROLES.includes(currentUser.role ?? "")
    ? [...NAV_ITEMS, currentUser.role === "ADMINISTRATOR" ? ADMIN_ITEM : MODERATOR_ITEM]
    : NAV_ITEMS;
  const isItemActive = (item: NavItem) => (item.label === "Admin" ? pathname.startsWith("/admin") : isActive(item.href));

  const notificationsLabel = unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications";
  const unreadText = unreadCount > 9 ? "9+" : unreadCount;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--outly-border)] bg-white/90 backdrop-blur-md md:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-6">
          <OutlyLogo width={44} height={44} priority variant="transparent" quality={100} className="shrink-0" />

          <nav
            aria-label="Primary"
            className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {navItems.map((item) => {
              const active = isItemActive(item);
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
              aria-label={notificationsLabel}
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
                  {unreadText}
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

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[4.5rem] flex-col overflow-y-auto border-r border-[var(--outly-border)] bg-[var(--outly-night)]/95 px-2 py-4 backdrop-blur-md [scrollbar-width:none] md:flex xl:w-64 xl:px-3 [&::-webkit-scrollbar]:hidden">
        <div className="flex shrink-0 justify-center px-1 pb-4 xl:justify-start xl:px-3">
          <OutlyLogo width={44} height={44} priority variant="transparent" quality={100} className="shrink-0" />
        </div>

        <nav aria-label="Primary" className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = isItemActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                title={item.label}
                className={cn(
                  sidebarLinkBase,
                  active
                    ? "bg-[var(--outly-lavender)] text-[var(--outly-violet)]"
                    : "text-[var(--outly-ink)] hover:bg-[var(--outly-lavender)]/70 hover:text-[var(--outly-violet)]",
                )}
              >
                <Icon name={item.icon} className="h-[22px] w-[22px] shrink-0" />
                <span className="hidden xl:inline">{item.label}</span>
              </Link>
            );
          })}

          <Link
            href="/notifications"
            aria-label={notificationsLabel}
            aria-current={isActive("/notifications") ? "page" : undefined}
            title="Notifications"
            className={cn(
              sidebarLinkBase,
              isActive("/notifications")
                ? "bg-[var(--outly-lavender)] text-[var(--outly-violet)]"
                : "text-[var(--outly-ink)] hover:bg-[var(--outly-lavender)]/70 hover:text-[var(--outly-violet)]",
            )}
          >
            <span className="relative flex shrink-0">
              <Icon name="bell" className="h-[22px] w-[22px]" />
              {unreadCount > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white gradient-brand"
                >
                  {unreadText}
                </span>
              ) : null}
            </span>
            <span className="hidden xl:inline">Notifications</span>
          </Link>

          <Link
            href="/profile"
            aria-label="Your profile"
            aria-current={isActive("/profile") ? "page" : undefined}
            title="Profile"
            className={cn(
              sidebarLinkBase,
              isActive("/profile")
                ? "bg-[var(--outly-lavender)] text-[var(--outly-violet)]"
                : "text-[var(--outly-ink)] hover:bg-[var(--outly-lavender)]/70 hover:text-[var(--outly-violet)]",
            )}
          >
            <span
              className={cn(
                "shrink-0 rounded-full p-0.5 ring-2",
                isActive("/profile") ? "ring-[var(--outly-violet)]" : "ring-transparent",
              )}
            >
              <Avatar name={currentUser.name} avatarUrl={currentUser.avatarUrl} size="sm" />
            </span>
            <span className="hidden xl:inline">Profile</span>
          </Link>
        </nav>
      </aside>
    </>
  );
}
