import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "md" | "lg";

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  "aria-label"?: string;
};

type ButtonAsLink = CommonProps & {
  href: string;
};

type ButtonAsButton = CommonProps & {
  href?: undefined;
};

type ButtonProps = ButtonAsLink | ButtonAsButton;

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2";

const sizeClasses: Record<ButtonSize, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "gradient-brand text-white shadow-[var(--shadow-elevated)] hover:brightness-110 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 disabled:pointer-events-none disabled:opacity-60 disabled:hover:translate-y-0",
  secondary:
    "bg-white text-[var(--outly-purple-dark)] border border-[var(--outly-border)] shadow-[var(--shadow-soft)] hover:border-[var(--outly-violet)]/60 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 disabled:pointer-events-none disabled:opacity-60 disabled:hover:translate-y-0",
  ghost:
    "bg-transparent text-[var(--outly-ink)] hover:bg-[var(--outly-lavender)] disabled:pointer-events-none disabled:opacity-60",
};

/**
 * Shared call-to-action button. Renders an anchor when `href` is provided
 * (used for in-page section links and navigation), otherwise a plain
 * button element (`type="submit"` for form submission, `type="button"`
 * by default).
 */
export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  onClick,
  disabled,
  type = "button",
  "aria-label": ariaLabel,
}: ButtonProps) {
  const classes = cn(baseClasses, sizeClasses[size], variantClasses[variant], className);

  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
