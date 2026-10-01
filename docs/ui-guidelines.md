# OUTLY — UI Guidelines

This document is the design-system reference for the OUTLY landing page. It
exists so future contributors (and future milestones) stay visually and
behaviorally consistent with this build.

## Color palette

Defined as CSS variables in `app/globals.css`; always reference the
variable, never hard-code a hex value in a component.

| Token | Hex | Use |
|---|---|---|
| `--outly-purple-dark` | `#351080` | Gradient start, deep accents |
| `--outly-purple` | `#5B21B6` | Secondary brand accent |
| `--outly-violet` | `#7C3AED` | Gradient midpoint, focus ring, links |
| `--outly-pink` | `#EC4899` | Gradient end, emphasis |
| `--outly-pink-bright` | `#F6339A` | CTA gradient accent |
| `--outly-lavender` | `#F5F3FF` | Light section backgrounds |
| `--outly-ink` | `#17121F` | Primary text on light backgrounds |
| `--outly-night` | `#120820` | Dark section backgrounds |
| `--outly-muted` | `#6B6475` | Secondary/body text on light backgrounds |
| `--outly-border` | `#E9DDFB` | Card/section borders on light backgrounds |
| `--outly-white` | `#FFFFFF` | Text/icons on dark or gradient backgrounds |

**Gradients**

- `--gradient-brand`: `linear-gradient(135deg, #351080 0%, #7C3AED 48%, #EC4899 100%)` — primary brand gradient (hero visual, CTA buttons, icon badges).
- `--gradient-brand-alt`: `linear-gradient(135deg, #5B21B6 0%, #F6339A 100%)` — secondary/alternate emphasis gradient.
- `--gradient-night`: `linear-gradient(180deg, #120820 0%, #351080 100%)` — dark section backgrounds (featured testimonial, final CTA).

**Usage rules**

- Do not make every section fully purple — alternate light (white/lavender)
  and dark (`--outly-night`) sections for rhythm and readability.
- Reserve gradients for emphasis moments: hero visual, CTA buttons/sections,
  icon badges, one featured card — not entire page backgrounds.
- Body text on light sections uses `--outly-ink` (headings) or
  `--outly-muted` (supporting copy); body text on dark/gradient backgrounds
  uses `--outly-white` or a translucent white for secondary copy, never
  `--outly-muted` (insufficient contrast on dark).

## Typography

- Font stack: system font stack via Next.js defaults (no custom webfont
  added this milestone, to keep the page fast).
- Hierarchy: `h1` (hero headline) largest and boldest → `h2` (section
  headings) → `h3` (card/component titles) → body copy. Never skip a
  heading level.
- Section eyebrows (e.g. "Discover", "Community") are small, uppercase,
  letter-spaced labels in `--outly-violet` or `--outly-pink-bright` —
  never the primary heading color, so they read as a label, not a title.
- Line length is capped (`max-w-*` on paragraph containers) for readability
  on wide viewports.

## Spacing

- Sections use consistent vertical rhythm via uniform `py-20 sm:py-28`-style
  padding (adjust per section but keep the same scale) so the page has a
  predictable, editorial cadence rather than uneven gaps.
- Container horizontal padding: `px-4 sm:px-6 lg:px-8`, capped width via
  `max-w-7xl` (page-wide sections) or narrower (`max-w-3xl`/`max-w-5xl`) for
  text-heavy content like headings and testimonials.
- Card internal padding is consistent within a section (e.g. all
  `FeatureCard`/`ExperienceCard` instances share the same padding scale) so
  the grid feels aligned.

## Button styles

`components/ui/button.tsx` provides three variants:

- **Primary** — `--gradient-brand` background, white text; used for the
  single most important action per section (e.g. "Start exploring", "Join
  OUTLY").
- **Secondary** — white/transparent background, `--outly-border` outline;
  used for the complementary action (e.g. "Discover communities", "Explore
  places").
- **Ghost** — text-only, used for low-emphasis actions (e.g. "Log in").

All variants: rounded-full shape, visible `:focus-visible` ring, and a
`motion-reduce:` guard on hover/scale transitions. Buttons render as a
`<Link>` when given an `href`, or a native `<button>` when given `onClick`
only (e.g. the mobile menu's close-on-select behavior).

## Card styles

- Borders use `--outly-border` (light cards) — never a plain gray, to keep
  cards feeling on-brand even at rest.
- Hover states lift slightly (`hover:-translate-y-1`) and deepen the shadow;
  always paired with a `motion-reduce:` override that disables the
  transform for users who prefer reduced motion.
- Card heights are kept consistent within a grid row using flex/grid
  alignment, so a shorter description never produces a visibly shorter
  card next to its siblings.
- Iconography inside cards uses the shared `components/ui/icon.tsx` set —
  never an emoji, never a random one-off inline `<svg>`.

## Logo usage

- The only source of truth is `public/images/outly-logo.png`, rendered via
  `components/brand/outly-logo.tsx` using `next/image` so it is never
  stretched, cropped, or distorted.
- Never recolor or recreate the logo with CSS filters (the source asset has
  a non-transparent background, so `invert`/`brightness-0` filters produce
  a solid box, not a clean silhouette).
- When the logo needs to sit on a dark or gradient background (footer,
  final CTA), wrap it in a small white/rounded badge rather than attempting
  to recolor it.
- Always pair the logo with the alt text
  `"OUTLY — Explore, Connect, Belong"`.

## Accessibility rules

- Use semantic HTML first (`header`, `nav`, `main`, `section`, `footer`,
  `article`, `figure`) before reaching for a `div`.
- Every meaningful image has descriptive alt text; every purely decorative
  icon/shape uses `aria-hidden="true"` (or empty `alt=""` for images).
- Interactive controls are reachable and operable by keyboard alone; the
  mobile menu toggle exposes `aria-expanded` and `aria-controls`.
- Focus is always visible (`:focus-visible` layered white outline + violet
  ring) regardless of the background it appears over.
- State is never communicated by color alone (e.g. placeholder links show a
  text "Soon" badge and `aria-disabled`, not just a dimmed color).
- Respect `prefers-reduced-motion` globally, and additionally guard
  individual hover/scale transitions with Tailwind's `motion-reduce:`
  variant.

## Image and copyright rules

- No unlicensed stock photography or randomly sourced external images are
  used anywhere on this page.
- All visual treatments — the hero terrain composition, experience card
  imagery, decorative CTA shapes — are produced with CSS gradients and
  inline SVG, authored specifically for OUTLY.
- The only bitmap asset is the official, project-owned OUTLY logo supplied
  by the project owner; it must not be replaced with a different, unlicensed
  logo or mark.
- Sample/marketing numbers (community member counts, event counts) are
  explicitly labeled as illustrative and must not be presented as verified,
  audited business metrics.
- Testimonials use real, project-supplied names/quotes and must not be
  paired with stock "customer" photography implying a verified endorsement
  that hasn't been obtained.
- **Note:** All visual treatments and illustrations produced in this
  milestone are original work created for OUTLY (CSS + inline SVG) or the
  officially supplied logo asset. Any future third-party asset introduced
  into this project must be properly licensed and attributed before use.

## Motion guidelines

- Motion is restrained and purposeful: underline reveals on nav links,
  a smooth grid-rows/opacity expand for the mobile menu, subtle
  hover-lift on cards, and color/opacity transitions on buttons.
- No looping, autoplaying, or attention-grabbing animation is used anywhere
  on the page.
- All transitions are short (150–300ms) and eased, never abrupt or bouncy.
- `prefers-reduced-motion: reduce` removes/shortens transitions globally;
  hover-triggered transforms additionally disable via `motion-reduce:`.
