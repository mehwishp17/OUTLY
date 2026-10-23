import { AppHeader } from "@/components/layout/app-header";

/**
 * Page frame for the Feed routes: the opt-in dark theme (`.app-dark`, see `app/globals.css`), the night
 * background with a restrained violet/pink glow, and the signed-in header. Other modules keep their own
 * light page wrapper, so nothing outside the Feed changes.
 */
export function FeedPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-dark relative min-h-svh overflow-x-clip bg-[var(--outly-night)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[34rem]"
        style={{
          backgroundImage:
            "radial-gradient(60% 70% at 18% 0%, rgba(124,58,237,0.24), transparent), radial-gradient(45% 55% at 86% 8%, rgba(236,72,153,0.14), transparent)",
        }}
      />
      <div className="relative md:pl-[4.5rem] xl:pl-64">
        <AppHeader />
        {children}
      </div>
    </div>
  );
}
