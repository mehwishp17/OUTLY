"use client";

import { Fragment, useState } from "react";
import type { ReactNode } from "react";
import { useSocialStore } from "@/context/social-store-context";

/**
 * Remounts everything inside it when a signed-in account goes away or is
 * replaced (sign out, switching accounts). Each module's store therefore
 * starts empty for every account, so one person's activities, groups,
 * messages or notifications can never show for the next person who signs in
 * on the same browser. The first load of the page (profile arriving after
 * the page rendered) does not remount anything.
 */
export function SessionScope({ children }: { children: ReactNode }) {
  const { currentUser } = useSocialStore();
  const accountId = currentUser.id;
  const [previousId, setPreviousId] = useState(accountId);
  const [generation, setGeneration] = useState(0);

  // Adjusting state while rendering (React's documented pattern for reacting to a prop change).
  if (accountId !== previousId) {
    setPreviousId(accountId);
    if (previousId !== "") setGeneration((count) => count + 1);
  }

  return <Fragment key={generation}>{children}</Fragment>;
}
