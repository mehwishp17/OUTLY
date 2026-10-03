"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PartnerRequestComposer } from "@/components/partner/partner-request-composer";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { usePartnerStore } from "@/context/partner-store-context";
import { useSocialStore } from "@/context/social-store-context";

type EditPartnerRequestViewProps = {
  requestId: string;
};

export function EditPartnerRequestView({ requestId }: EditPartnerRequestViewProps) {
  const router = useRouter();
  const { currentUser } = useSocialStore();
  const { getRequestById, editRequest, loadRequest } = usePartnerStore();
  const request = getRequestById(requestId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void loadRequest(requestId).then(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [requestId, loadRequest]);

  if (!request && loading) return <LoadingState message="Loading request…" />;

  if (!request || request.authorId !== currentUser.id) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-bold text-[var(--outly-ink)]">
          {request ? "You can't edit this request" : "Request not found"}
        </h1>
        <p className="text-sm text-[var(--outly-muted)]">
          {request
            ? "Only the person who posted this request can edit it."
            : "This request may have been removed, or the link is incorrect."}
        </p>
        <Link
          href="/partner"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          Back to partner requests
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:py-12">
      <PartnerRequestComposer
        title="Edit partner request"
        submitLabel="Save changes"
        initialValues={request}
        onCancel={() => router.push(`/partner/${request.id}`)}
        onSubmit={async (values) => {
          const error = await editRequest(request.id, values);
          if (error) return error;
          router.push(`/partner/${request.id}`);
          return undefined;
        }}
      />
    </div>
  );
}
