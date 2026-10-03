"use client";

import Link from "next/link";
import { useAdminStore } from "@/context/admin-store-context";
import { cn } from "@/lib/utils";

// Moderators only get the screens their role allows; the backend enforces it as well.
const MODERATOR_LINKS = new Set<string>(["/admin/content", "/admin/reports", "/admin/events"]);

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/places", label: "Places" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/analytics", label: "Analytics" },
] as const;

type AdminNavProps = {
  active: (typeof LINKS)[number]["href"];
};

/** Shared sub-navigation across every Admin screen, so each stays a
 * distinct route (per the Admin Module's screen list) without adding
 * eight more entries to the signed-in `AppHeader`. */
export function AdminNav({ active }: AdminNavProps) {
  const { isAdministrator } = useAdminStore();
  const links = isAdministrator ? LINKS : LINKS.filter((link) => MODERATOR_LINKS.has(link.href));

  return (
    <nav aria-label="Admin sections" className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={link.href === active ? "page" : undefined}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            link.href === active
              ? "text-white gradient-brand"
              : "border border-[var(--outly-border)] bg-white text-[var(--outly-ink)] hover:border-[var(--outly-violet)]/60",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
