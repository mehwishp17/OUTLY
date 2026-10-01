"use client";

import { PartnerRequestCard } from "@/components/partner/partner-request-card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Tabs } from "@/components/ui/tabs";
import { usePartnerStore } from "@/context/partner-store-context";
import type { PartnerRequest } from "@/types/partner";

function sortByPreferredAtAsc(requests: PartnerRequest[]): PartnerRequest[] {
  return [...requests].sort(
    (a, b) => new Date(a.preferredAt).getTime() - new Date(b.preferredAt).getTime(),
  );
}

function RequestGroup({ requests }: { requests: PartnerRequest[] }) {
  if (requests.length === 0) {
    return (
      <p className="rounded-[var(--radius-lg)] border border-[var(--outly-border)] bg-white px-5 py-10 text-center text-sm text-[var(--outly-muted)] shadow-[var(--shadow-soft)]">
        Nothing here yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {requests.map((request) => (
        <PartnerRequestCard key={request.id} request={request} />
      ))}
    </div>
  );
}

/** Partner Requests list: "Open" / "Closed" / "All" tabs over every
 * adventure partner request. */
export function PartnerListView() {
  const { requests } = usePartnerStore();
  const sorted = sortByPreferredAtAsc(requests);
  const open = sorted.filter((request) => request.status === "open");
  const closed = sorted.filter((request) => request.status === "closed");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--outly-ink)] sm:text-3xl">
            Adventure Partners
          </h1>
          <p className="mt-1 text-sm text-[var(--outly-muted)]">
            Find compatible partners for your next trek, ride, or trip.
          </p>
        </div>
        <Button href="/partner/new" className="w-fit">
          <Icon name="plus" className="h-4 w-4" />
          Post a request
        </Button>
      </div>

      <Tabs
        ariaLabel="Partner request filters"
        items={[
          { id: "open", label: `Open (${open.length})`, content: <RequestGroup requests={open} /> },
          { id: "closed", label: `Closed (${closed.length})`, content: <RequestGroup requests={closed} /> },
          { id: "all", label: "All", content: <RequestGroup requests={sorted} /> },
        ]}
      />
    </div>
  );
}
