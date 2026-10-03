/**
 * Local adventure photos, mapped per content item so a photo is not repeated
 * across sibling cards. Items with no entry (new user-created content, or
 * seed items with no suitable photo) keep their brand gradient. Sources and
 * licenses are listed in docs/image-credits.md.
 */
const dir = "/images/adventure";

export const ADVENTURE_IMAGES = {
  loginHero: `${dir}/login-hero.jpg`,
  signupHero: `${dir}/groups-community.jpg`,
  exploreTrail: `${dir}/explore-trail.jpg`,
  eventsCamping: `${dir}/events-camping.jpg`,
  activitiesCycling: `${dir}/activities-cycling.jpg`,
  profileCover: "/images/profile/cover.jpg",
} as const;

export const POST_PHOTOS: Partial<Record<string, string>> = {
  "post-1": `${dir}/badges-achievement.jpg`, // Kedarkantha ridge at sunrise
  "post-2": `${dir}/groups-community.jpg`, // Saturday group hike
  "post-3": `${dir}/explore-trail.jpg`, // shaded pine trail
  "post-4": `${dir}/events-camping.jpg`, // camp stove / Pawna Lake
  "post-5": `${dir}/activities-cycling.jpg`, // first cycling weekend
};

const places = "/images/places";
const events = "/images/events";
const groups = "/images/groups";
const activities = "/images/activities";
const landing = "/images/landing";

export const PLACE_PHOTOS: Partial<Record<string, string>> = {
  "trail-kedarkantha": `${places}/kedarkantha-trail.jpg`,
  "viewpoint-nandi-hills": `${landing}/golden-hour-nandi.jpg`,
  "trail-whispering-pines": `${landing}/whispering-pines.jpg`,
  "campsite-pawna-lake": `${places}/pawna-lake-campsite.jpg`,
  "cycling-dehradun-foothills": `${places}/dehradun-cycling.jpg`,
  "wildlife-bandipur": `${places}/bandipur-wildlife.jpg`,
  "viewpoint-sinhagad": `${places}/sinhagad-viewpoint.jpg`,
  "trail-munnar-tea-gardens": `${places}/munnar-tea-gardens.jpg`,
};

export const EVENT_PHOTOS: Partial<Record<string, string>> = {
  "event-sinhagad-group-hike": `${events}/sinhagad-group-hike.jpg`,
  "event-kedarkantha-winter-batch": `${events}/kedarkantha-winter-trek.jpg`,
  "event-pawna-lake-campfire": `${landing}/lakeside-meetup.jpg`,
  "event-munnar-cleanup": `${events}/trail-cleanup.jpg`,
};

export const GROUP_PHOTOS: Partial<Record<string, string>> = {
  "group-bengaluru-trail-runners": `${groups}/trail-runners.jpg`,
  "group-weekend-wanderers": `${groups}/weekend-wanderers.jpg`,
  "group-campfire-collective": `${groups}/campfire-collective.jpg`,
  "group-dehradun-cyclists": `${groups}/foothill-cyclists.jpg`,
};

export const ACTIVITY_PHOTOS: Partial<Record<string, string>> = {
  "activity-kedarkantha-trek": `${activities}/sunrise-ridge-trek.jpg`,
  "activity-pawna-campfire": `${landing}/lakeside-meetup.jpg`,
  "activity-sinhagad-weekend-hike": `${activities}/sinhagad-weekend-hike.jpg`,
  "activity-dehradun-cycling": `${activities}/foothills-cycling.jpg`,
  "activity-munnar-photo-walk": `${activities}/tea-gardens-walk.jpg`,
};

/** CSS object-position per photo, so the subject stays in frame when cropped. */
export const PHOTO_POSITIONS: Partial<Record<string, string>> = {
  [`${places}/kedarkantha-trail.jpg`]: "center 45%",
  [`${places}/pawna-lake-campsite.jpg`]: "center 70%",
  [`${places}/dehradun-cycling.jpg`]: "center 60%",
  [`${places}/bandipur-wildlife.jpg`]: "center 55%",
  [`${places}/sinhagad-viewpoint.jpg`]: "center 55%",
  [`${places}/munnar-tea-gardens.jpg`]: "center 45%",
  [`${events}/sinhagad-group-hike.jpg`]: "center 55%",
  [`${events}/kedarkantha-winter-trek.jpg`]: "center 45%",
  [`${events}/trail-cleanup.jpg`]: "center 50%",
  [`${groups}/trail-runners.jpg`]: "center 40%",
  [`${groups}/foothill-cyclists.jpg`]: "center 55%",
  [`${activities}/sinhagad-weekend-hike.jpg`]: "center 40%",
  [`${activities}/sunrise-ridge-trek.jpg`]: "center 55%",
  [`${landing}/golden-hour-nandi.jpg`]: "50% 35%",
  [`${landing}/lakeside-meetup.jpg`]: "30% 60%",
  [`${landing}/whispering-pines.jpg`]: "center 60%",
};
