"use client";

import { useRouter } from "next/navigation";
import { PartnerRequestComposer } from "@/components/partner/partner-request-composer";
import { usePartnerStore } from "@/context/partner-store-context";

export function CreatePartnerRequestView() {
  const router = useRouter();
  const { createRequest } = usePartnerStore();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:py-12">
      <PartnerRequestComposer
        title="Post a partner request"
        description="Publish a request and let compatible explorers find you."
        submitLabel="Post request"
        onCancel={() => router.push("/partner")}
        onSubmit={(values) => {
          const request = createRequest(values);
          router.push(`/partner/${request.id}`);
        }}
      />
    </div>
  );
}
