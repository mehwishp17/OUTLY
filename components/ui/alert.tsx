import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type AlertVariant = "success" | "error" | "info";

type AlertProps = {
  variant: AlertVariant;
  title: string;
  children?: React.ReactNode;
  className?: string;
};

const variantStyles: Record<AlertVariant, { container: string; icon: "check-circle" | "alert-circle" }> = {
  success: {
    container: "border-[#1E7A4D]/30 bg-[#1E7A4D]/10 text-[#155C39]",
    icon: "check-circle",
  },
  error: {
    container: "border-[#B3164C]/30 bg-[#B3164C]/10 text-[#8A0F3A]",
    icon: "alert-circle",
  },
  info: {
    container: "border-[var(--outly-border)] bg-[var(--outly-lavender)] text-[var(--outly-purple-dark)]",
    icon: "alert-circle",
  },
};

/**
 * Generic status banner. Uses `role="status"` for success/info (polite,
 * non-interrupting) and `role="alert"` for errors (assertive), and pairs
 * color with an icon so state is never communicated by color alone.
 */
export function Alert({ variant, title, children, className }: AlertProps) {
  const styles = variantStyles[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius-md)] border p-4",
        styles.container,
        className,
      )}
    >
      <Icon name={styles.icon} className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="text-sm leading-relaxed">
        <p className="font-semibold">{title}</p>
        {children ? <div className="mt-1">{children}</div> : null}
      </div>
    </div>
  );
}
