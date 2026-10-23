export type NavLink = {
  label: string;
  href: string;
};

/**
 * Shared placeholder target for routes that don't exist yet (About,
 * Careers, Contact, Legal pages, social profiles). Used instead of
 * fabricated URLs so unfinished routes stay clearly intentional — UI that
 * renders these should visibly label them (e.g. a "Soon" badge) rather
 * than presenting them as live links.
 */
export const PLACEHOLDER_HREF = "#";

export const NAV_LINKS: NavLink[] = [
  { label: "Explore", href: "#explore" },
  { label: "Communities", href: "#community" },
  { label: "Events", href: "#experiences" },
  { label: "Stories", href: "#stories" },
];

export type ExploreCard = {
  category: string;
  title: string;
  description: string;
  icon: "trail" | "map" | "calendar" | "compass";
  /** Where the card goes. These areas need an account: signed-out visitors are sent to log in first. */
  href: string;
};

export const EXPLORE_CARDS: ExploreCard[] = [
  {
    category: "Trails",
    title: "Trails and hikes",
    description:
      "Browse trails with difficulty, distance, ratings, and reviews, and find ones near you.",
    icon: "trail",
    href: "/explore",
  },
  {
    category: "Places",
    title: "Viewpoints and campsites",
    description:
      "Viewpoints, campsites, and wildlife spots, each with its own page, reviews, and place on the map.",
    icon: "map",
    href: "/explore/map",
  },
  {
    category: "Events",
    title: "Group events",
    description:
      "Join group hikes, cleanups, and meetups, with limited spots and organizer approval where needed.",
    icon: "calendar",
    href: "/events",
  },
  {
    category: "Activities",
    title: "Outdoor activities",
    description:
      "Plan and join outdoor activities with other people, and keep a history of the ones you've done.",
    icon: "compass",
    href: "/activities",
  },
];

export type Experience = {
  title: string;
  category: string;
  location: string;
  description: string;
  gradient: string;
  /** Local photo in `public/images/landing/`; the gradient stays as fallback. */
  image: string;
  /** CSS object-position that keeps the photo's subject in frame. */
  imagePosition?: string;
};

export const EXPERIENCES: Experience[] = [
  {
    title: "Sunrise Ridge Trek",
    category: "Weekend hikes",
    location: "Kedarkantha, Uttarakhand",
    description:
      "A crisp early-morning climb ending at a ridgeline with 360° views over the valley.",
    gradient: "linear-gradient(135deg, #351080, #7c3aed)",
    image: "/images/landing/sunrise-ridge-trek.jpg",
    imagePosition: "center 55%",
  },
  {
    title: "Golden Hour at Nandi Point",
    category: "Sunset viewpoints",
    location: "Nandi Hills, Karnataka",
    description:
      "Watch the sky turn amber and pink from one of the region's most loved viewpoints.",
    gradient: "linear-gradient(135deg, #7c3aed, #ec4899)",
    image: "/images/landing/golden-hour-nandi.jpg",
    imagePosition: "50% 35%",
  },
  {
    title: "Whispering Pines Trail",
    category: "Forest trails",
    location: "Munnar, Kerala",
    description:
      "A shaded, easy-grade trail through pine forest, ideal for first-time hikers.",
    gradient: "linear-gradient(135deg, #5b21b6, #f6339a)",
    image: "/images/landing/whispering-pines.jpg",
    imagePosition: "center 60%",
  },
  {
    title: "Lakeside Meetup & Campfire",
    category: "Local outdoor meetups",
    location: "Pawna Lake, Maharashtra",
    description:
      "Join fellow explorers for an evening of camping, stories, and stargazing by the water.",
    gradient: "linear-gradient(135deg, #351080, #ec4899)",
    image: "/images/landing/lakeside-meetup.jpg",
    imagePosition: "30% 60%",
  },
];

export type Step = {
  number: string;
  title: string;
  description: string;
};

export const HOW_IT_WORKS_STEPS: Step[] = [
  {
    number: "01",
    title: "Discover",
    description: "Browse trails, places, and events, and search for what's near you.",
  },
  {
    number: "02",
    title: "Connect",
    description: "Follow explorers, join groups, and find partners for your next trip.",
  },
  {
    number: "03",
    title: "Belong",
    description: "Show up, share the journey, and become part of a lasting outdoor community.",
  },
];

export type FooterGroup = {
  title: string;
  links: NavLink[];
};

export const FOOTER_GROUPS: FooterGroup[] = [
  {
    title: "Platform",
    links: [
      { label: "Explore", href: "#explore" },
      { label: "Experiences", href: "#experiences" },
      { label: "How it works", href: "#how-it-works" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Communities", href: "#community" },
      { label: "Stories", href: "#stories" },
      { label: "Events", href: "#experiences" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: PLACEHOLDER_HREF },
      { label: "Careers", href: PLACEHOLDER_HREF },
      { label: "Contact", href: PLACEHOLDER_HREF },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: PLACEHOLDER_HREF },
      { label: "Terms of service", href: PLACEHOLDER_HREF },
    ],
  },
];

export const SOCIAL_LINKS: NavLink[] = [
  { label: "Instagram", href: PLACEHOLDER_HREF },
  { label: "X", href: PLACEHOLDER_HREF },
  { label: "YouTube", href: PLACEHOLDER_HREF },
];

/* ---------------------------------------------------------------------- */
/* Phase 2 — Onboarding content                                            */
/* ---------------------------------------------------------------------- */

export type OnboardingInterest = {
  id: string;
  label: string;
};

export const ONBOARDING_INTERESTS: OnboardingInterest[] = [
  { id: "hiking", label: "Hiking" },
  { id: "camping", label: "Camping" },
  { id: "nature-walks", label: "Nature walks" },
  { id: "trail-running", label: "Trail running" },
  { id: "photography", label: "Photography" },
  { id: "kayaking", label: "Kayaking" },
  { id: "cycling", label: "Cycling" },
  { id: "wildlife", label: "Wildlife" },
  { id: "stargazing", label: "Stargazing" },
  { id: "road-trips", label: "Weekend road trips" },
];

export type OnboardingActivityLevel = {
  id: "beginner" | "intermediate" | "advanced";
  label: string;
  description: string;
};

export const ONBOARDING_ACTIVITY_LEVELS: OnboardingActivityLevel[] = [
  {
    id: "beginner",
    label: "Beginner",
    description: "New to the outdoors or prefer short, easy-going routes.",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    description: "Comfortable with half-day hikes and moderate elevation.",
  },
  {
    id: "advanced",
    label: "Advanced",
    description: "Ready for long treks, technical trails, and early starts.",
  },
];

export const ONBOARDING_LOCATION_SUGGESTIONS: string[] = [
  "Bengaluru",
  "Pune",
  "Delhi",
  "Mumbai",
  "Hyderabad",
  "Dehradun",
  "Kerala",
  "Uttarakhand",
];
