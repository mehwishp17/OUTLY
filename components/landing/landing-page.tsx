import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HeroSection } from "@/components/landing/hero-section";
import { ExploreSection } from "@/components/landing/explore-section";
import { CommunitySection } from "@/components/landing/community-section";
import { ShareSection } from "@/components/landing/share-section";
import { ExperiencesSection } from "@/components/landing/experiences-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { StoriesSection } from "@/components/landing/stories-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";

/**
 * Composes the full OUTLY public landing page. Individual sections are
 * kept in their own files (components/landing/*) so each can evolve
 * independently in future milestones.
 */
export function LandingPage() {
  return (
    <>
      <noscript>
        <style>{".reveal{opacity:1;transform:none;transition:none}"}</style>
      </noscript>
      <SiteHeader />
      <main>
        <HeroSection />
        <ExploreSection />
        <CommunitySection />
        <ShareSection />
        <ExperiencesSection />
        <HowItWorksSection />
        <StoriesSection />
        <FinalCtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
