export type IconName =
  | "trail"
  | "map"
  | "calendar"
  | "compass"
  | "menu"
  | "close"
  | "pin"
  | "arrow-right"
  | "quote"
  | "instagram"
  | "x"
  | "youtube"
  | "eye"
  | "eye-off"
  | "check-circle"
  | "alert-circle"
  | "chevron-left"
  | "heart"
  | "heart-filled"
  | "bookmark"
  | "bookmark-filled"
  | "message-circle"
  | "camera"
  | "trash"
  | "edit"
  | "settings"
  | "plus"
  | "image"
  | "tent"
  | "bike"
  | "paw"
  | "star"
  | "star-filled"
  | "search"
  | "shield-check"
  | "bell"
  | "trophy"
  | "lock"
  | "share"
  | "send"
  | "users";

type IconProps = {
  name: IconName;
  className?: string;
};

/**
 * Single source of inline SVG icons used across the landing page. Keeping
 * every icon here (instead of scattering `<svg>` markup across sections)
 * makes the visual system consistent and avoids adding an icon-library
 * dependency for a small, fixed set of glyphs. All icons are decorative by
 * default (`aria-hidden="true"`) — callers provide their own accessible
 * name via surrounding text or an `aria-label` when an icon stands alone.
 */
export function Icon({ name, className = "h-5 w-5" }: IconProps) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none" as const,
    "aria-hidden": true as const,
    className,
  };

  switch (name) {
    case "trail":
      return (
        <svg {...common}>
          <path
            d="M4 20 9 6l3 7 2-4 6 11"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "map":
      return (
        <svg {...common}>
          <path
            d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M9 4v14M15 6v14" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M4 9.5h16M8 3v3M16 3v3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "compass":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="m15 9-4 2-2 4 4-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <path
            d="M4 7h16M4 12h16M4 17h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path
            d="M6 6l12 12M18 6 6 18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path
            d="M12 21s-6.5-5.7-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.3-6.5 11-6.5 11Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg {...common}>
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "quote":
      return (
        <svg {...common} fill="currentColor">
          <path d="M9.5 7C6.5 7 4 9.5 4 12.7c0 2.7 1.9 4.6 4.2 4.6.4 2.3-1.1 3.9-3 4.7l.6 1c3-1 5.2-3.3 5.2-6.9V13c0-3.3-1-6-1.5-6ZM19 7c-3 0-5.5 2.5-5.5 5.7 0 2.7 1.9 4.6 4.2 4.6.4 2.3-1.1 3.9-3 4.7l.6 1c3-1 5.2-3.3 5.2-6.9V13c0-3.3-1-6-1.5-6Z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="16.6" cy="7.4" r="0.9" fill="currentColor" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path
            d="M5 5l14 14M19 5 5 19"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <rect x="3.5" y="6" width="17" height="12" rx="3.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10.5 9.5v5l4.5-2.5-4.5-2.5Z" fill="currentColor" />
        </svg>
      );
    case "eye":
      return (
        <svg {...common}>
          <path
            d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "eye-off":
      return (
        <svg {...common}>
          <path
            d="M3 3l18 18M9.9 5.1A10.4 10.4 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a15 15 0 0 1-3.2 4M6.6 6.6C4 8.3 2.5 12 2.5 12S6 18.5 12 18.5c1.2 0 2.3-.2 3.3-.6M9.9 14.1a3 3 0 0 0 4.2-4.2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "check-circle":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="m8 12.5 2.5 2.5L16 9.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "alert-circle":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 8v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="16.2" r="1" fill="currentColor" />
        </svg>
      );
    case "chevron-left":
      return (
        <svg {...common}>
          <path
            d="M15 6l-6 6 6 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path
            d="M12 20s-7.5-4.6-9.7-9.1C.7 7.6 2 4.3 5.2 3.5c2-.5 4 .3 5.1 2 .3.4 1.3.4 1.6 0 1.1-1.7 3.1-2.5 5.1-2 3.2.8 4.5 4.1 2.9 7.4C19.5 15.4 12 20 12 20Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "heart-filled":
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 20s-7.5-4.6-9.7-9.1C.7 7.6 2 4.3 5.2 3.5c2-.5 4 .3 5.1 2 .3.4 1.3.4 1.6 0 1.1-1.7 3.1-2.5 5.1-2 3.2.8 4.5 4.1 2.9 7.4C19.5 15.4 12 20 12 20Z" />
        </svg>
      );
    case "bookmark":
      return (
        <svg {...common}>
          <path
            d="M6 4h12v16l-6-4-6 4V4Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "bookmark-filled":
      return (
        <svg {...common} fill="currentColor">
          <path d="M6 4h12v16l-6-4-6 4V4Z" />
        </svg>
      );
    case "message-circle":
      return (
        <svg {...common}>
          <path
            d="M4 12a8 8 0 1 1 3.3 6.5L4 20l1.2-3.6A7.9 7.9 0 0 1 4 12Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "share":
      return (
        <svg {...common}>
          <path
            d="M12 15V4m0 0L8 8m4-4 4 4M5 13v6h14v-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M3 19c.4-3 2.8-5 6-5s5.6 2 6 5M16 5.2a3 3 0 0 1 0 5.6M18 14.3c1.8.7 2.9 2.2 3.2 4.7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "send":
      return (
        <svg {...common}>
          <path
            d="M21 3 10 14M21 3l-7 18-4-7-7-4 18-7Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "camera":
      return (
        <svg {...common}>
          <path
            d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "trash":
      return (
        <svg {...common}>
          <path
            d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "edit":
      return (
        <svg {...common}>
          <path
            d="M4 20h4L18.5 9.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 15v5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18 18l-1.5-1.5M7.5 7.5 6 6M18 6l-1.5 1.5M7.5 16.5 6 18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "image":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="9" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="m6 17 4.5-4.5L14 16l2-2 2 2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case "tent":
      return (
        <svg {...common}>
          <path
            d="M12 4 3 20h18L12 4Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M12 4v16M8 20l4-9 4 9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case "bike":
      return (
        <svg {...common}>
          <circle cx="6" cy="17" r="3.2" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="18" cy="17" r="3.2" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M6 17 10 8h4l4 9M10 8 8.5 5h-2M10 8l3.5 5H18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "paw":
      return (
        <svg {...common} fill="currentColor">
          <circle cx="7" cy="8" r="1.6" />
          <circle cx="12" cy="6.5" r="1.6" />
          <circle cx="17" cy="8" r="1.6" />
          <circle cx="19" cy="12.5" r="1.6" />
          <path d="M12 12c-3.3 0-6 2-6 4.8 0 1.8 1.5 3.2 3.3 3.2.9 0 1.6-.4 2.7-.4s1.8.4 2.7.4c1.8 0 3.3-1.4 3.3-3.2 0-2.8-2.7-4.8-6-4.8Z" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path
            d="m12 3 2.6 5.9 6.4.6-4.8 4.2 1.4 6.3L12 16.9 6.4 20l1.4-6.3-4.8-4.2 6.4-.6L12 3Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "star-filled":
      return (
        <svg {...common} fill="currentColor">
          <path d="m12 3 2.6 5.9 6.4.6-4.8 4.2 1.4 6.3L12 16.9 6.4 20l1.4-6.3-4.8-4.2 6.4-.6L12 3Z" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="m20 20-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "shield-check":
      return (
        <svg {...common}>
          <path
            d="M12 3 5 5.5V11c0 5 3 8.5 7 10 4-1.5 7-5 7-10V5.5L12 3Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="m9 12 2 2 4-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "trophy":
      return (
        <svg {...common}>
          <path
            d="M7 4h10v5a5 5 0 0 1-10 0V4Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3M10 19h4M12 15v4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "lock":
      return (
        <svg {...common}>
          <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path
            d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M9.5 18a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
