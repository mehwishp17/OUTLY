"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { MOCK_PARTNER_REQUESTS } from "@/lib/mock/mock-partner-requests";
import { useSocialStore } from "@/context/social-store-context";
import type { PartnerRequest, PartnerRequestFormValues } from "@/types/partner";

export type RequestToJoinResult = "requested" | "already-requested" | "full";

type PartnerStoreValue = {
  requests: PartnerRequest[];
  getRequestById: (requestId: string) => PartnerRequest | undefined;
  createRequest: (input: PartnerRequestFormValues) => PartnerRequest;
  editRequest: (requestId: string, input: PartnerRequestFormValues) => void;
  deleteRequest: (requestId: string) => void;
  closeRequest: (requestId: string) => void;
  requestToJoin: (requestId: string, message?: string) => RequestToJoinResult;
  withdrawJoinRequest: (requestId: string) => void;
  acceptJoinRequest: (requestId: string, userId: string) => void;
  declineJoinRequest: (requestId: string, userId: string) => void;
};

const PartnerStoreContext = createContext<PartnerStoreValue | null>(null);

let localRequestIdCounter = 0;

function nextRequestId(): string {
  localRequestIdCounter += 1;
  return `partner-local-${Date.now()}-${localRequestIdCounter}`;
}

function acceptedCount(request: PartnerRequest): number {
  return request.joinRequests.filter((join) => join.status === "accepted").length;
}

/**
 * Session-only mock "backend" for the Adventure Partner module (Partner
 * Requests, Request Detail, Create Request, Join Requests). Nothing here
 * persists beyond the current browser session.
 */
export function PartnerStoreProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useSocialStore();
  const [requests, setRequests] = useState<PartnerRequest[]>(MOCK_PARTNER_REQUESTS);

  const getRequestById = useCallback(
    (requestId: string) => requests.find((request) => request.id === requestId),
    [requests],
  );

  const createRequest = useCallback(
    (input: PartnerRequestFormValues) => {
      const newRequest: PartnerRequest = {
        id: nextRequestId(),
        authorId: currentUser.id,
        authorName: currentUser.name,
        activity: input.activity,
        destination: input.destination.trim(),
        preferredAt: input.preferredAt,
        experienceLevel: input.experienceLevel,
        spots: input.spots,
        description: input.description.trim(),
        status: "open",
        joinRequests: [],
      };
      setRequests((current) => [newRequest, ...current]);
      return newRequest;
    },
    [currentUser],
  );

  const editRequest = useCallback((requestId: string, input: PartnerRequestFormValues) => {
    setRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? {
              ...request,
              activity: input.activity,
              destination: input.destination.trim(),
              preferredAt: input.preferredAt,
              experienceLevel: input.experienceLevel,
              spots: input.spots,
              description: input.description.trim(),
            }
          : request,
      ),
    );
  }, []);

  const deleteRequest = useCallback((requestId: string) => {
    setRequests((current) => current.filter((request) => request.id !== requestId));
  }, []);

  const closeRequest = useCallback((requestId: string) => {
    setRequests((current) =>
      current.map((request) => (request.id === requestId ? { ...request, status: "closed" } : request)),
    );
  }, []);

  const requestToJoin = useCallback(
    (requestId: string, message?: string): RequestToJoinResult => {
      const request = requests.find((candidate) => candidate.id === requestId);
      if (!request) return "full";
      if (request.joinRequests.some((join) => join.id === currentUser.id)) return "already-requested";
      if (acceptedCount(request) >= request.spots) return "full";

      setRequests((current) =>
        current.map((candidate) =>
          candidate.id === requestId
            ? {
                ...candidate,
                joinRequests: [
                  ...candidate.joinRequests,
                  {
                    id: currentUser.id,
                    name: currentUser.name,
                    avatarUrl: currentUser.avatarUrl,
                    message: message?.trim() || undefined,
                    status: "pending",
                  },
                ],
              }
            : candidate,
        ),
      );
      return "requested";
    },
    [requests, currentUser],
  );

  const withdrawJoinRequest = useCallback(
    (requestId: string) => {
      setRequests((current) =>
        current.map((request) =>
          request.id === requestId
            ? { ...request, joinRequests: request.joinRequests.filter((join) => join.id !== currentUser.id) }
            : request,
        ),
      );
    },
    [currentUser],
  );

  const acceptJoinRequest = useCallback((requestId: string, userId: string) => {
    setRequests((current) =>
      current.map((request) => {
        if (request.id !== requestId) return request;
        const updated: PartnerRequest = {
          ...request,
          joinRequests: request.joinRequests.map((join) =>
            join.id === userId ? { ...join, status: "accepted" as const } : join,
          ),
        };
        return acceptedCount(updated) >= updated.spots ? { ...updated, status: "closed" } : updated;
      }),
    );
  }, []);

  const declineJoinRequest = useCallback((requestId: string, userId: string) => {
    setRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? {
              ...request,
              joinRequests: request.joinRequests.map((join) =>
                join.id === userId ? { ...join, status: "declined" as const } : join,
              ),
            }
          : request,
      ),
    );
  }, []);

  const value = useMemo<PartnerStoreValue>(
    () => ({
      requests,
      getRequestById,
      createRequest,
      editRequest,
      deleteRequest,
      closeRequest,
      requestToJoin,
      withdrawJoinRequest,
      acceptJoinRequest,
      declineJoinRequest,
    }),
    [
      requests,
      getRequestById,
      createRequest,
      editRequest,
      deleteRequest,
      closeRequest,
      requestToJoin,
      withdrawJoinRequest,
      acceptJoinRequest,
      declineJoinRequest,
    ],
  );

  return <PartnerStoreContext.Provider value={value}>{children}</PartnerStoreContext.Provider>;
}

export function usePartnerStore(): PartnerStoreValue {
  const context = useContext(PartnerStoreContext);
  if (!context) {
    throw new Error("usePartnerStore must be used within a PartnerStoreProvider");
  }
  return context;
}
