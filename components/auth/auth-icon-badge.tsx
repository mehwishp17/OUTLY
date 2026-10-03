import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/components/ui/icon";

/** Round brand-gradient icon shown above the heading of the recovery screens. */
export function AuthIconBadge({ name }: { name: IconName }) {
  return (
    <div
      aria-hidden="true"
      className="mb-5 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-[var(--shadow-soft)] gradient-brand"
    >
      <Icon name={name} className="h-6 w-6" />
    </div>
  );
}
