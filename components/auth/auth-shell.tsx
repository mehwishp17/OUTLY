import Link from "next/link";
import { OutlyLogo } from "@/components/brand/outly-logo";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";

type AuthShellProps = {
  children: React.ReactNode;
  /** `"card"` (default) wraps children in the bordered, shadowed form
   * card used by sign-up, forgot-password, and verify-email. `"plain"`
   * renders children directly with no card chrome — used by the Login
   * page for a flatter, more open composition. */
  formSurface?: "card" | "plain";
  /** Overrides the default `AuthBrandPanel` (dark promotional panel)
   * with a different left-column panel — used by the Login page's
   * lighter `LoginVisualPanel`. Sign-up, forgot-password, and
   * verify-email don't pass this, so they keep `AuthBrandPanel`
   * unchanged. */
  brandPanel?: React.ReactNode;
};

/**
 * Reusable two-column authentication layout shared by login, sign-up,
 * forgot-password, and verify-email pages. Desktop shows the form next
 * to `AuthBrandPanel`; mobile stacks a compact logo + tagline above the
 * form card with no horizontal overflow.
 */
export function AuthShell({ children, formSurface = "card", brandPanel }: AuthShellProps) {
  return (
    <div className="grid min-h-svh bg-white lg:grid-cols-2">
      {brandPanel ?? <AuthBrandPanel />}

      <div className="flex flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <OutlyLogo width={44} height={44} priority variant="transparent" quality={100} />
          </div>

          <div
            className={
              formSurface === "plain"
                ? undefined
                : "rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8"
            }
          >
            {children}
          </div>

          <p className="mt-6 text-center text-sm text-[var(--outly-muted)]">
            <Link
              href="/"
              className="font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
            >
              ← Back to OUTLY
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
