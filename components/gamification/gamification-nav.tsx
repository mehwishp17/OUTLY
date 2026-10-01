import Link from "next/link";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/badges", label: "Badges" },
  { href: "/achievements", label: "Achievements" },
  { href: "/leaderboard", label: "Leaderboard" },
] as const;

type GamificationNavProps = {
  active: "badges" | "achievements" | "leaderboard";
};

/** Shared sub-navigation across the three Gamification screens, so each
 * stays a distinct route (per the Screen Inventory) without needing a
 * fourth entry in the already-busy `AppHeader`. */
export function GamificationNav({ active }: GamificationNavProps) {
  return (
    <nav aria-label="Gamification sections" className="flex flex-wrap gap-2">
      {LINKS.map((link) => {
        const isActive = link.href === `/${active}`;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              isActive
                ? "text-white gradient-brand"
                : "border border-[var(--outly-border)] bg-white text-[var(--outly-ink)] hover:border-[var(--outly-violet)]/60",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
