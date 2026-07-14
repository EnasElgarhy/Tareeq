/**
 * Marketing landing page image registry. Self-hosted under public/landing —
 * the source tareeq-website repo hotlinked these to the AI-builder platform's
 * temporary asset CDN and Unsplash, which isn't safe to depend on once this
 * is the app's real entry point.
 */
export const KAI_AVATAR = "/landing/kai-avatar.png";

export const ILLUSTRATIONS = {
  hero: "/landing/hero.png",
  discover: "/landing/discover.png",
  compass: "/landing/compass.png",
  grow: "/landing/grow.png",
  journey: "/landing/journey.png",
  learning: "/landing/learning.png",
} as const;

export const PORTRAITS = {
  student1: "/landing/student1.jpg",
  student2: "/landing/student2.jpg",
  student3: "/landing/student3.jpg",
  adult: "/landing/adult.jpg",
} as const;
