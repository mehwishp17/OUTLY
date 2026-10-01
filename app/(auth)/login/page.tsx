import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { AuthVisualPanel } from "@/components/auth/auth-visual-panel";
import { ADVENTURE_IMAGES } from "@/lib/adventure-images";

export const metadata: Metadata = {
  title: "Log in — OUTLY",
  description: "Log in to continue discovering trails, communities, and experiences on OUTLY.",
};

/** Only same-site paths are honored, so `?next=` can't become an open redirect. */
function safeNext(next: string | undefined): string | undefined {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") ? next : undefined;
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthShell formSurface="plain" brandPanel={(
        <AuthVisualPanel
          image={ADVENTURE_IMAGES.loginHero}
          position="30% center"
          sideImages={[ADVENTURE_IMAGES.exploreTrail, ADVENTURE_IMAGES.activitiesCycling]}
        />
      )}>
      <LoginForm redirectTo={safeNext(next)} />
    </AuthShell>
  );
}
