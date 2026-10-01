import type { Post } from "@/types/post";
import { CURRENT_USER_ID } from "@/lib/mock/mock-user";

/** Returns an ISO timestamp a given number of hours before now, so seed
 * posts always render as "recent" (e.g. "2h ago") no matter when the app
 * is loaded. Recomputed on every reload — these are not persisted dates. */
function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

/**
 * Seed posts for the OUTLY social feed (Phase 3). All state — likes,
 * saves, comments, edits, deletes — is held only in
 * `context/social-store-context.tsx` for the current browser session;
 * this file just provides the starting snapshot and is never written
 * back to.
 */
export const MOCK_POSTS: Post[] = [
  {
    id: "post-1",
    authorId: CURRENT_USER_ID,
    authorName: "Neha Kapoor",
    content:
      "Just back from Kedarkantha — the ridge line at sunrise was unreal. If anyone wants trail notes before attempting it in winter, ask away!",
    location: "Kedarkantha, Uttarakhand",
    gradient: "linear-gradient(135deg, #351080, #7c3aed)",
    createdAt: hoursAgo(2),
    likeCount: 18,
    likedByCurrentUser: false,
    savedByCurrentUser: false,
    comments: [
      {
        id: "comment-1",
        postId: "post-1",
        authorId: "rohan-mehta",
        authorName: "Rohan Mehta",
        content: "Saving this for my next trip! What time did you start climbing?",
        createdAt: hoursAgo(1.5),
      },
      {
        id: "comment-2",
        postId: "post-1",
        authorId: "isha-verma",
        authorName: "Isha Verma",
        content: "That view never gets old. Great shot!",
        createdAt: hoursAgo(1),
      },
    ],
  },
  {
    id: "post-2",
    authorId: "rohan-mehta",
    authorName: "Rohan Mehta",
    content:
      "Organizing a Saturday morning group hike near Pune — easy pace, roughly 6km, perfect for anyone new to trekking. Drop a comment if you're in.",
    location: "Sinhagad, Pune",
    gradient: "linear-gradient(135deg, #7c3aed, #ec4899)",
    createdAt: hoursAgo(6),
    likeCount: 24,
    likedByCurrentUser: true,
    savedByCurrentUser: false,
    comments: [
      {
        id: "comment-3",
        postId: "post-2",
        authorId: CURRENT_USER_ID,
        authorName: "Neha Kapoor",
        content: "Count me in! Is parking available at the base?",
        createdAt: hoursAgo(5),
      },
    ],
  },
  {
    id: "post-3",
    authorId: "isha-verma",
    authorName: "Isha Verma",
    content:
      "Trail condition update for Munnar's Whispering Pines: still shaded and easy-grade, but the last stretch is muddy after yesterday's rain. Good shoes recommended.",
    location: "Munnar, Kerala",
    gradient: "linear-gradient(135deg, #5b21b6, #f6339a)",
    createdAt: hoursAgo(10),
    likeCount: 12,
    likedByCurrentUser: false,
    savedByCurrentUser: true,
    comments: [],
  },
  {
    id: "post-4",
    authorId: "arjun-das",
    authorName: "Arjun Das",
    content:
      "Gear tip: a compact camp stove made a bigger difference to our Pawna Lake trip than I expected — hot chai at 2am while stargazing is unbeatable.",
    location: "Pawna Lake, Maharashtra",
    gradient: "linear-gradient(135deg, #351080, #ec4899)",
    createdAt: hoursAgo(20),
    likeCount: 31,
    likedByCurrentUser: false,
    savedByCurrentUser: false,
    comments: [
      {
        id: "comment-4",
        postId: "post-4",
        authorId: "isha-verma",
        authorName: "Isha Verma",
        content: "Which model do you use? Been looking for something lightweight.",
        createdAt: hoursAgo(18),
      },
      {
        id: "comment-5",
        postId: "post-4",
        authorId: CURRENT_USER_ID,
        authorName: "Neha Kapoor",
        content: "Yes please share — car camping season is coming up for us too.",
        createdAt: hoursAgo(17),
      },
    ],
  },
  {
    id: "post-5",
    authorId: "priya-nair",
    authorName: "Priya Nair",
    content:
      "First solo cycling weekend done! Rode from Dehradun towards the foothills and the community WhatsApp group's route notes were spot on. Thank you all.",
    location: "Dehradun, Uttarakhand",
    gradient: "linear-gradient(135deg, #7c3aed, #351080)",
    createdAt: hoursAgo(30),
    likeCount: 45,
    likedByCurrentUser: true,
    savedByCurrentUser: false,
    comments: [
      {
        id: "comment-6",
        postId: "post-5",
        authorId: "rohan-mehta",
        authorName: "Rohan Mehta",
        content: "This made my day. Congrats on the first solo ride!",
        createdAt: hoursAgo(28),
      },
    ],
  },
];
