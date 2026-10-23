/** Placeholder cards shown while the feed loads (instead of a bare spinner). */
export function FeedSkeleton({ message = "Loading the feed…" }: { message?: string }) {
  return (
    <div role="status" className="flex flex-col gap-5">
      <span className="sr-only">{message}</span>
      {[0, 1].map((key) => (
        <div
          key={key}
          aria-hidden="true"
          className="animate-pulse overflow-hidden rounded-[var(--radius-lg)] border border-white/10 bg-[#17121f] motion-reduce:animate-none"
        >
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="h-11 w-11 rounded-full bg-white/10" />
            <div className="space-y-2">
              <div className="h-3 w-32 rounded-full bg-white/10" />
              <div className="h-2.5 w-20 rounded-full bg-white/[0.07]" />
            </div>
          </div>
          <div className="aspect-[4/3] bg-white/[0.06]" />
          <div className="space-y-3 px-5 py-4">
            <div className="h-3 w-24 rounded-full bg-white/10" />
            <div className="h-3 w-11/12 rounded-full bg-white/[0.07]" />
            <div className="h-3 w-2/3 rounded-full bg-white/[0.07]" />
          </div>
        </div>
      ))}
    </div>
  );
}
