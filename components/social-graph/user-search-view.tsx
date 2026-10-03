"use client";

import { useEffect, useState } from "react";
import { UserRow } from "@/components/social-graph/user-row";
import { Icon } from "@/components/ui/icon";
import { useSocialStore } from "@/context/social-store-context";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { searchPeople } from "@/lib/api/follows";
import { resolveUserSummary } from "@/lib/user-directory";

/** User Search: find OUTLY members by name or username (searched by the backend). */
export function UserSearchView() {
  const { currentUser } = useSocialStore();
  const [query, setQuery] = useState("");

  const [ids, setIds] = useState<string[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string>();

  // The backend does the searching (blocked users and yourself are left out); typing is debounced.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await searchPeople(query);
      if (cancelled) return;
      if (result.ok) {
        setIds(result.data);
        setError(undefined);
        setStatus("ready");
      } else {
        setError(result.message);
        setStatus("error");
      }
    }, query ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const results = ids
    .map((id) => resolveUserSummary(id, currentUser))
    .filter((user) => user !== undefined);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
          Find people
        </h1>
        <p className="mt-1 text-sm text-[var(--outly-muted)]">
          Search the OUTLY community by name or username.
        </p>
      </div>

      <div className="relative">
        <Icon
          name="search"
          className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--outly-muted)]"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or username…"
          aria-label="Search people"
          className="w-full rounded-full border border-[var(--outly-border)] bg-white py-3 pl-11 pr-4 text-sm text-[var(--outly-ink)] shadow-[var(--shadow-soft)] transition-colors placeholder:text-[var(--outly-muted)]/70 focus:border-[var(--outly-violet)] focus:outline-none"
        />
      </div>

      {status === "loading" && results.length === 0 ? (
        <LoadingState message="Searching…" />
      ) : status === "error" && results.length === 0 ? (
        <ErrorState title="We couldn't search right now" description={error} />
      ) : results.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white px-5 py-10 text-center text-sm text-[var(--outly-muted)] shadow-[var(--shadow-soft)]">
          No one matches that search.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {results.map((user) => (
            <UserRow key={user.id} user={user} showBio />
          ))}
        </ul>
      )}
    </div>
  );
}
