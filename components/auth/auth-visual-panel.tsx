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

const CARD =
  "group absolute overflow-hidden bg-[var(--outly-purple)] shadow-[0_24px_60px_rgba(0,0,0,0.55)] ring-1 ring-white/20";

/**
 * Left column shared by Login, Sign-up, Forgot password and Reset password: the OUTLY logo, the
 * "Explore • Connect • Belong" line, and a collage of three adventure photographs on the dark
 * OUTLY surface. The photos are 2000px-wide portraits (see docs/image-credits.md), so the cards can
 * be shown at a generous size and still be sharp on high-density screens.
 */
export function AuthVisualPanel({ image, position, sideImages }: AuthVisualPanelProps) {
  return (
    <div className="relative hidden flex-col overflow-hidden bg-[var(--outly-night)] px-10 py-10 lg:flex xl:px-14">
      <div
        aria-hidden="true"
        className="animate-drift-a pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-[var(--outly-purple)] opacity-40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="animate-drift-b pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-[var(--outly-pink-bright)] opacity-20 blur-3xl"
      />

      {/* The shared logo component sizes itself from the file's natural size
          (`h-auto w-auto`), so pin the rendered size here. The transparent logo is shown as is. */}
      <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 [&_img]:h-[4.5rem] [&_img]:w-[4.5rem]">
        <OutlyLogo href="" width={72} height={72} variant="transparent" quality={100} priority />
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-10 pb-6">
        <p className="bg-gradient-to-r from-[var(--outly-pink)] to-[var(--outly-violet)] bg-clip-text text-xs font-semibold uppercase tracking-[0.3em] text-transparent">
          Explore • Connect • Belong
        </p>

        <div aria-hidden="true" className="relative h-[22rem] w-[22rem] xl:h-[30rem] xl:w-[32rem]">
          <div
            className={`${CARD} left-0 top-12 h-48 w-36 -rotate-6 rounded-[var(--radius-md)] xl:top-16 xl:h-64 xl:w-48`}
          >
            <CoverImage src={sideImages[0]} sizes="(min-width: 1280px) 192px, 144px" />
          </div>
          <div
            className={`${CARD} right-0 top-8 h-48 w-36 rotate-6 rounded-[var(--radius-md)] xl:top-10 xl:h-64 xl:w-48`}
          >
            <CoverImage src={sideImages[1]} sizes="(min-width: 1280px) 192px, 144px" />
          </div>
          <div
            className={`${CARD} left-1/2 top-0 z-10 h-[22rem] w-60 -translate-x-1/2 rounded-[var(--radius-lg)] xl:h-[30rem] xl:w-80`}
          >
            <CoverImage src={image} sizes="(min-width: 1280px) 320px, 240px" position={position} />
          </div>
        </div>
      </div>
    </div>
  );
}
