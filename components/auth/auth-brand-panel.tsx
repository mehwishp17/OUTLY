import { OutlyLogo } from "@/components/brand/outly-logo";
import { Icon } from "@/components/ui/icon";

const BRAND_HIGHLIGHTS = [
  { icon: "trail" as const, label: "Discover", detail: "Trails and destinations worth the trip" },
  { icon: "compass" as const, label: "Connect", detail: "Explorers who share your pace" },
  { icon: "map" as const, label: "Belong", detail: "Communities built around real adventures" },
];

/**
 * Visual side panel used by `AuthShell` on desktop (hidden on mobile,
 * where `AuthShell` instead renders a compact logo + tagline). Built
 * entirely from CSS gradients and inline SVG — no external imagery.
 */
export function AuthBrandPanel() {
  return (
    <div className="relative hidden h-full flex-col justify-between overflow-hidden gradient-night px-10 py-12 lg:flex lg:px-14">
      {/* Decorative abstract terrain/trail shapes — purely visual */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 w-full opacity-40"
        viewBox="0 0 600 240"
        fill="none"
        preserveAspectRatio="none"
      >
        <path d="M0 200 120 90l70 60 90-110 90 90 90-60 140 90V240H0Z" fill="url(#auth-terrain)" />
        <path
          d="M20 190 130 100l70 55 85-100 95 85 85-55 115 80"
          stroke="#F6339A"
          strokeOpacity="0.5"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <defs>
          <linearGradient id="auth-terrain" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7C3AED" stopOpacity="0.35" />
            <stop offset="1" stopColor="#351080" stopOpacity="0.05" />
          </linearGradient>
        </defs>
      </svg>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--outly-pink)] opacity-20 blur-3xl"
      />

      <div className="relative">
        <OutlyLogo href="" width={36} height={36} variant="transparent" quality={100} />
        <p className="mt-10 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--outly-pink-bright)]">
          Explore · Connect · Belong
        </p>
        <h2 className="mt-3 max-w-sm text-3xl font-bold leading-tight text-white">
          Find your people. Discover your places. Make every adventure count.
        </h2>
      </div>

      <ul className="relative flex flex-col gap-5">
        {BRAND_HIGHLIGHTS.map((item) => (
          <li key={item.label} className="flex items-center gap-3 text-white/85">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-white/10"
            >
              <Icon name={item.icon} className="h-5 w-5 text-white" />
            </span>
            <span className="text-sm leading-snug">
              <span className="block font-semibold text-white">{item.label}</span>
              {item.detail}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
