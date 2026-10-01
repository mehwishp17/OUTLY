import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

export function FinalCtaSection() {
  return (
    <section id="final-cta" className="relative overflow-hidden gradient-brand py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 right-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"
      />
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full opacity-20"
        viewBox="0 0 400 80"
        preserveAspectRatio="none"
      >
        <path
          d="M0 80 40 30 80 55 120 15 160 50 200 25 240 55 280 20 320 48 360 25 400 45 400 80Z"
          fill="white"
        />
      </svg>

      <Reveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Your next adventure starts here.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-white/85 sm:text-lg">
          Create a free account, find your people, and discover the places
          worth exploring — all in one community-driven platform.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button href="/signup" variant="secondary" size="lg">
            Create Account
          </Button>
          <Button href="#explore" variant="ghost" size="lg" className="text-white hover:bg-white/10">
            Explore places
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
