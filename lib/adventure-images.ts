/**
 * Local adventure photos in `public/images/adventure/`, mapped per content
 * item so the same photo is never reused across sibling cards. Items with
 * no entry (new user-created content, or seed items with no suitable
 * photo) keep their brand gradient instead of a mismatched image.
 *
 * The source photos are small (~410-640px wide), so they are used only in
 * card-sized areas and the (widest) profile cover — not in group banners or
 * place-detail heroes, which stay on their gradients.
 */
const dir = "/images/adventure";

export const ADVENTURE_IMAGES = {
  loginHero: `${dir}/login-hero.jpg`,
  signupHero: `${dir}/groups-community.jpg`,
  exploreTrail: `${dir}/explore-trail.jpg`,
  eventsCamping: `${dir}/events-camping.jpg`,
  activitiesCycling: `${dir}/activities-cycling.jpg`,
  profileCover: `${dir}/profile-cover.jpg`,
} as const;

export const POST_PHOTOS: Partial<Record<string, string>> = {
  "post-1": `${dir}/badges-achievement.jpg`, // Kedarkantha ridge at sunrise
  "post-2": `${dir}/groups-community.jpg`, // Saturday group hike
  "post-3": `${dir}/explore-trail.jpg`, // shaded pine trail
  "post-4": `${dir}/events-camping.jpg`, // camp stove / Pawna Lake
  "post-5": `${dir}/activities-cycling.jpg`, // first cycling weekend
};

export const PLACE_PHOTOS: Partial<Record<string, string>> = {
  "trail-kedarkantha": `${dir}/badges-achievement.jpg`,
  "viewpoint-nandi-hills": `${dir}/login-hero.jpg`,
  "trail-whispering-pines": `${dir}/explore-trail.jpg`,
  "campsite-pawna-lake": `${dir}/events-camping.jpg`,
  "cycling-dehradun-foothills": `${dir}/activities-cycling.jpg`,
  "viewpoint-sinhagad": `${dir}/people-social.jpg`,
};

export const EVENT_PHOTOS: Partial<Record<string, string>> = {
  "event-sinhagad-group-hike": `${dir}/groups-community.jpg`,
  "event-kedarkantha-winter-batch": `${dir}/badges-achievement.jpg`,
  "event-pawna-lake-campfire": `${dir}/events-camping.jpg`,
};

export const GROUP_PHOTOS: Partial<Record<string, string>> = {
  "group-weekend-wanderers": `${dir}/groups-community.jpg`,
  "group-campfire-collective": `${dir}/events-camping.jpg`,
  "group-dehradun-cyclists": `${dir}/activities-cycling.jpg`,
};
