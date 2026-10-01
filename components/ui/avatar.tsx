import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-24 w-24 text-2xl",
};

type AvatarProps = {
  name: string;
  avatarUrl?: string;
  size?: AvatarSize;
  className?: string;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Profile picture with an initials fallback on the brand gradient. Uses a
 * plain `<img>` (not `next/image`) because avatars in this phase are
 * either absent or a locally-generated `blob:`/`data:` preview URL from
 * `avatar-upload.tsx` — never a remote, optimizable image source.
 */
export function Avatar({ name, avatarUrl, size = "md", className }: AvatarProps) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- local blob/data preview URL only, not a remote image.
      <img
        src={avatarUrl}
        alt={`${name}'s profile photo`}
        className={cn("rounded-full object-cover", sizeClasses[size], className)}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={`${name}'s profile photo`}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white gradient-brand",
        sizeClasses[size],
        className,
      )}
    >
      <span aria-hidden="true">{getInitials(name)}</span>
    </span>
  );
}
