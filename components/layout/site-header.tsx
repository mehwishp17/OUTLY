"use client";

import { useEffect, useState } from "react";
import { OutlyLogo } from "@/components/brand/outly-logo";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/constants";
/**
 * Sticky site header, scoped entirely to the Hero section: a solid near-black
 * bar (the transparent logo is shown directly on it, unchanged), which gains
 * a soft shadow after a small scroll within the Hero,
 * and hides
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

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-white/10 bg-[var(--outly-night)] text-white transition-[box-shadow,transform] duration-300 ease-out motion-reduce:transition-none",
        isScrolled ? "shadow-[0_10px_30px_rgba(0,0,0,0.4)]" : "shadow-none",
        hidden ? "-translate-y-full" : "translate-y-0",
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 md:h-16 lg:px-8">
        <OutlyLogo width={40} height={40} priority variant="transparent" quality={100} className="h-10! w-10!" />

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="relative text-sm font-medium text-white/80 transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-[var(--outly-pink)] after:transition-all after:duration-200 hover:text-white hover:after:w-full motion-reduce:after:transition-none"
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
            className="rounded-[var(--radius-sm)] px-2 py-1 text-sm font-semibold text-white/90 transition-colors hover:text-white"
          >
            Log in
          </a>
          <Button href="/signup" size="md">
            Create Account
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10 md:hidden"
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
        // An overlay under the bar (not in the page flow), so opening or closing it never moves the page
        // while a link is scrolling to its section. Hidden entirely when closed, so its links can't be
        // tabbed to or tapped.
        className={`absolute inset-x-0 top-full grid overflow-hidden border-t border-white/10 bg-[var(--outly-night)] transition-[grid-template-rows,opacity,visibility] duration-300 ease-out motion-reduce:transition-none md:hidden ${
          isMenuOpen
            ? "visible grid-rows-[1fr] opacity-100 shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
            : "invisible grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
        <div className="px-4 py-4">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
            <a
              href="/login"
              className="rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 hover:text-white"
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
      </div>
    </header>
  );
}
