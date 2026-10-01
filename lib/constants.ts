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
};

export const EXPLORE_CARDS: ExploreCard[] = [
  {
    category: "Trails",
    title: "Trails and hikes",
    description:
      "Curated routes ranked by difficulty, elevation, and season so you always know before you go.",
    icon: "trail",
  },
  {
    category: "Destinations",
    title: "Hidden destinations",
    description:
      "Lesser-known viewpoints, lakes, and campsites shared by locals and seasoned explorers.",
    icon: "map",
  },
  {
    category: "Events",
    title: "Local events",
    description:
      "Group hikes, cleanups, and meetups happening near you, updated every week.",
    icon: "calendar",
  },
  {
    category: "Experiences",
    title: "Outdoor experiences",
    description:
      "Guided adventures and community-led experiences for every skill level.",
    icon: "compass",
  },
];

export type CommunityStat = {
  label: string;
  value: string;
};

export const COMMUNITY_STATS: CommunityStat[] = [
  { label: "Active explorers", value: "42K+" },
  { label: "Communities", value: "1,200+" },
  { label: "Events this month", value: "380" },
];

export type CommunityMember = {
  name: string;
  initials: string;
  gradientFrom: string;
  gradientTo: string;
};

export const COMMUNITY_MEMBERS: CommunityMember[] = [
  { name: "Ariana Fox", initials: "AF", gradientFrom: "#351080", gradientTo: "#7c3aed" },
  { name: "Devon Ray", initials: "DR", gradientFrom: "#7c3aed", gradientTo: "#ec4899" },
  { name: "Maya Chen", initials: "MC", gradientFrom: "#ec4899", gradientTo: "#f6339a" },
  { name: "Sam Rivera", initials: "SR", gradientFrom: "#351080", gradientTo: "#ec4899" },
  { name: "Priya Nair", initials: "PN", gradientFrom: "#5b21b6", gradientTo: "#f6339a" },
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
    description: "Browse trails, destinations, and events tailored to what you love.",
  },
  {
    number: "02",
    title: "Connect",
    description: "Meet explorers with similar interests and join communities that fit you.",
  },
  {
    number: "03",
    title: "Belong",
    description: "Show up, share the journey, and become part of a lasting outdoor community.",
  },
];

export type Story = {
  quote: string;
  name: string;
  role: string;
};

export const STORIES: Story[] = [
  {
    quote:
      "I joined for the trails and stayed for the people. My weekends look completely different now.",
    name: "Neha Kapoor",
    role: "Member since 2024, Bengaluru",
  },
  {
    quote:
      "OUTLY made it easy to find a hiking group that actually shows up. Real community, not just an app.",
    name: "Rohan Mehta",
    role: "Trail leader, Pune",
  },
  {
    quote:
      "I moved to a new city and found my closest friends through an OUTLY weekend trek.",
    name: "Isha Verma",
    role: "Member since 2025, Delhi",
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
