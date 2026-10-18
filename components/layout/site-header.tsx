"use client";

import { useEffect, useState } from "react";
import { OutlyLogo } from "@/components/brand/outly-logo";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/constants";
/**
 * Sticky site header, scoped entirely to the Hero section: fully
 * transparent at the top, transitions into a blurred glass
 * (glassmorphism) bar after a small scroll within the Hero, and hides
 * completely (via `translateY`, not layout positioning) as soon as the
 * Hero is scrolled out of view — it never reappears over Explore,
 * Community, How It Works, or any other section, no matter which
 * direction the user scrolls. It only comes back once the Hero is back
 * in view. Hero visibility is tracked with an `IntersectionObserver`
 * against the page's first `<section>` (the Hero) rather than a fixed
 * pixel offset, so this keeps working regardless of hero height across
 * breakpoints. Mobile menu toggling requires client state; the rest of
 * the landing page stays server-rendered. The mobile panel animates
 * open/closed via a max-height + opacity transition so it feels
 * intentional rather than an abrupt show/hide (respects
 * prefers-reduced-motion globally via app/globals.css).
 */
const GLASS_THRESHOLD_PX = 48;

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHeroVisible, setIsHeroVisible] = useState(true);

  useEffect(() => {
    function onScroll() {
      setIsScrolled(window.scrollY > GLASS_THRESHOLD_PX);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const heroEl = document.querySelector<HTMLElement>("main section:first-of-type");
    if (!heroEl) return;

    const observer = new IntersectionObserver(([entry]) => setIsHeroVisible(entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(heroEl);
    return () => observer.disconnect();
  }, []);

  // Keep the navbar visible whenever the mobile menu is open, even though
  // that can only happen while the Hero (and therefore the header) is
  // already in view.
  const hidden = !isHeroVisible && !isMenuOpen;
  // Over the hero photo the bar is unfilled, so text switches to white.
  const onDark = !isScrolled;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,backdrop-filter,box-shadow,border-color,transform] duration-300 ease-out motion-reduce:transition-none",
        isScrolled
          ? "glass-panel border-x-0 border-t-0 shadow-[var(--shadow-soft)]"
          : "border-b border-transparent bg-transparent",
        hidden ? "-translate-y-full" : "translate-y-0",
      )}
    >
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-4 py-2 sm:px-6 md:min-h-24 lg:px-8">
        <OutlyLogo
          width={80}
          height={80}
          priority
          variant="transparent"
          quality={100}
          className="h-16! w-16! md:h-20! md:w-20!"
        />

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={cn(
                    "relative text-sm font-medium transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:transition-all after:duration-200 hover:after:w-full motion-reduce:after:transition-none",
                    onDark
                      ? "text-white after:bg-white hover:text-white"
                      : "text-[var(--outly-ink)] after:bg-[var(--outly-violet)] hover:text-[var(--outly-violet)]",
                  )}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href="/login"
            className={cn(
              "rounded-[var(--radius-sm)] px-2 py-1 text-sm font-semibold transition-colors",
              onDark
                ? "text-white hover:text-white/80"
                : "text-[var(--outly-ink)] hover:text-[var(--outly-violet)]",
            )}
          >
            Log in
          </a>
          <Button href="/signup" size="md">
            Create Account
          </Button>
        </div>

        <button
          type="button"
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-full border md:hidden",
            onDark
              ? "border-white/40 bg-white/10 text-white"
              : "border-[var(--outly-border)] text-[var(--outly-ink)]",
          )}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <Icon name={isMenuOpen ? "close" : "menu"} className="h-5 w-5" />
        </button>
      </div>

      <div
        id="mobile-nav"
        className={`grid overflow-hidden border-t border-[var(--outly-border)] bg-white transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none md:hidden ${
          isMenuOpen ? "grid-rows-[1fr] opacity-100" : "max-h-0 grid-rows-[0fr] border-t-0 opacity-0"
        }`}
      >
        <div className="min-h-0 px-4 py-4">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-[var(--outly-ink)] hover:bg-[var(--outly-lavender)]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2 border-t border-[var(--outly-border)] pt-4">
            <a
              href="/login"
              className="rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold text-[var(--outly-ink)] hover:bg-[var(--outly-lavender)]"
              onClick={() => setIsMenuOpen(false)}
            >
              Log in
            </a>
            <Button href="/signup" className="w-full" onClick={() => setIsMenuOpen(false)}>
              Create Account
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
