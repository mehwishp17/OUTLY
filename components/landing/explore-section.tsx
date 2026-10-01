import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { FeatureCard } from "@/components/ui/feature-card";
import { EXPLORE_CARDS } from "@/lib/constants";

export function ExploreSection() {
  return (
    <section id="explore" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
        <SectionHeading
          eyebrow="Discover"
          title="Explore beyond the ordinary"
          description="Find trails, hidden destinations, local events, and outdoor experiences curated by explorers who've already been there."
        />
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {EXPLORE_CARDS.map((card, index) => (
            <Reveal key={card.title} delay={index * 70} className="h-full">
              <FeatureCard {...card} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
