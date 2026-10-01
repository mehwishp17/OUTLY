"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useSocialStore } from "@/context/social-store-context";
import { logoutRequest } from "@/lib/api/auth";

/** Ends the session (revokes the refresh token, clears the cookies) and
 * returns to the login page. */
export function LogoutButton() {
  const router = useRouter();
  const { resetSession } = useSocialStore();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleLogout() {
    if (pending) return;
    setPending(true);
    setFailed(false);
    if (await logoutRequest()) {
      resetSession();
      router.push("/login");
      router.refresh();
    } else {
      setPending(false);
      setFailed(true);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {failed ? (
        <p role="alert" className="text-xs text-[#B3164C]">
          Couldn&apos;t log out. Try again.
        </p>
      ) : null}
      <Button variant="secondary" onClick={handleLogout} disabled={pending}>
        {pending ? (
          <>
            <LoadingSpinner /> Logging out…
          </>
        ) : (
          "Log out"
        )}
      </Button>
    </div>
  );
}
