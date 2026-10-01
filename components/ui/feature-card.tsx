import type { ExploreCard } from "@/lib/constants";
import { Icon } from "@/components/ui/icon";

/**
 * Card used in the Explore section. Icon renders as an inline SVG (no
 * emoji/icon-library dependency) inside a soft gradient badge, with a
 * small category chip above the title for quick scanning.
 */
export function FeatureCard({ category, title, description, icon }: ExploreCard) {
  return (
    <article className="group flex h-full flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-6 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <span
        className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] text-white gradient-brand transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        aria-hidden="true"
      >
        <Icon name={icon} />
      </span>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--outly-violet)]">
        {category}
      </p>
      <h3 className="text-lg font-semibold text-[var(--outly-ink)]">{title}</h3>
      <p className="text-sm leading-relaxed text-[var(--outly-muted)]">{description}</p>
    </article>
  );
}
