import { OutlyLogo } from "@/components/brand/outly-logo";
import { CoverImage } from "@/components/ui/cover-image";

type AuthVisualPanelProps = {
  /** Large central photo. */
  image: string;
  /** CSS object-position that keeps the central photo's subject in frame. */
  position?: string;
  /** Two smaller complementary photos: [left, right]. */
  sideImages: [string, string];
};

const CARD = "group absolute overflow-hidden bg-[var(--outly-violet)] shadow-[var(--shadow-elevated)] ring-4 ring-white";

/**
 * Left column shared by Login and Sign-up: a compact OUTLY logo, the
 * "Explore • Connect • Belong" line, and a small collage of three adventure
 * photographs. Cards are kept close to the local photos' native size (~410px
 * wide) so nothing is stretched past what the source can support.
 */
export function AuthVisualPanel({ image, position, sideImages }: AuthVisualPanelProps) {
  return (
    <div className="relative hidden flex-col overflow-hidden bg-[var(--outly-lavender)] px-10 py-10 lg:flex xl:px-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[var(--outly-violet)] opacity-10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[var(--outly-pink)] opacity-10 blur-3xl"
      />

      {/* The shared logo component sizes itself from the file's natural size
          (`h-auto w-auto`), so pin the rendered size here. */}
      <div className="relative h-14 w-14 shrink-0 [&_img]:h-14 [&_img]:w-14">
        <OutlyLogo href="" width={56} height={56} variant="transparent" quality={100} priority />
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-12 pb-8">
        <p className="gradient-brand-text text-xs font-semibold uppercase tracking-[0.3em]">
          Explore • Connect • Belong
        </p>

        <div aria-hidden="true" className="relative h-72 w-80 xl:h-80 xl:w-[26rem]">
          <div className={`${CARD} left-0 top-10 h-44 w-32 -rotate-6 rounded-[var(--radius-md)] xl:h-52 xl:w-36`}>
            <CoverImage src={sideImages[0]} sizes="144px" />
          </div>
          <div className={`${CARD} right-0 top-6 h-44 w-32 rotate-6 rounded-[var(--radius-md)] xl:h-52 xl:w-36`}>
            <CoverImage src={sideImages[1]} sizes="144px" />
          </div>
          <div
            className={`${CARD} left-1/2 top-0 z-10 h-72 w-52 -translate-x-1/2 rounded-[var(--radius-lg)] xl:h-80 xl:w-60`}
          >
            <CoverImage src={image} sizes="(min-width: 1280px) 240px, 208px" position={position} />
          </div>
        </div>
      </div>
    </div>
  );
}
