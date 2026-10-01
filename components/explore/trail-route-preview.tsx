import type { MapPosition } from "@/types/place";

type TrailRoutePreviewProps = {
  routePoints: MapPosition[];
};

/** Schematic route line for a trail's detail page — an illustrative
 * polyline through `routePoints` (percentage coordinates), not real
 * route geometry from a map provider. */
export function TrailRoutePreview({ routePoints }: TrailRoutePreviewProps) {
  const pathPoints = routePoints.map((point) => `${point.x},${point.y}`).join(" ");
  const start = routePoints[0];
  const end = routePoints[routePoints.length - 1];

  return (
    <div
      role="img"
      aria-label="Schematic route preview from start to end point"
      className="relative h-40 overflow-hidden rounded-[var(--radius-md)] border border-[var(--outly-border)] bg-[var(--outly-lavender)]"
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
        <polyline
          points={pathPoints}
          fill="none"
          stroke="var(--outly-violet)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        aria-hidden="true"
        style={{ left: `${start.x}%`, top: `${start.y}%` }}
        className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--outly-violet)] shadow-[var(--shadow-soft)]"
      />
      <span
        aria-hidden="true"
        style={{ left: `${end.x}%`, top: `${end.y}%` }}
        className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--outly-pink-bright)] shadow-[var(--shadow-soft)]"
      />
    </div>
  );
}
