import { cn } from "@/lib/utils";

type BadgeVariant = "solid" | "outline" | "muted";

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

const variantClasses: Record<BadgeVariant, string> = {
  solid: "gradient-brand text-white",
  outline: "border border-[var(--outly-border)] text-[var(--outly-purple-dark)] bg-white",
  muted: "bg-[var(--outly-lavender)] text-[var(--outly-purple-dark)]",
};

/** Small pill used for interests, skill level, and category tags. */
export function Badge({ children, variant = "muted", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
