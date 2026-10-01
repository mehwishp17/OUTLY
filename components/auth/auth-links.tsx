import Link from "next/link";

type AuthLinksProps = {
  prompt: string;
  linkLabel: string;
  href: string;
};

/**
 * Small "New to OUTLY? Create an account" style prompt used under every
 * auth form to move between login/sign-up/forgot-password.
 */
export function AuthLinks({ prompt, linkLabel, href }: AuthLinksProps) {
  return (
    <p className="mt-6 text-center text-sm text-[var(--outly-muted)]">
      {prompt}{" "}
      <Link href={href} className="font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]">
        {linkLabel}
      </Link>
    </p>
  );
}
