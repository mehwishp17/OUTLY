"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useSocialStore } from "@/context/social-store-context";
import {
  closeRequestRequest,
  createRequestRequest,
  deleteRequestRequest,
  editRequestRequest,
  fetchRequest,
  fetchRequests,
  joinRequestRequest,
  reviewJoinRequestRequest,
  withdrawJoinRequestRequest,
} from "@/lib/api/partner";
import type { PartnerRequest, PartnerRequestFormValues } from "@/types/partner";

export type RequestToJoinResult = "requested" | "already-requested" | "full";

type LoadStatus = "idle" | "loading" | "ready" | "error";
type LoadError = { message: string; status: number };

type PartnerStoreValue = {
  requests: PartnerRequest[];
  status: LoadStatus;
  error: LoadError | null;
  /** (Re)loads the partner requests from the backend. */
  refresh: () => Promise<void>;
  /** Loads one request (and its join requests, for the poster). */
  loadRequest: (requestId: string) => Promise<LoadError | null>;
  getRequestById: (requestId: string) => PartnerRequest | undefined;
  /** Every mutation resolves with an error message on failure. */
  createRequest: (input: PartnerRequestFormValues) => Promise<{ request?: PartnerRequest; error?: string }>;
  editRequest: (requestId: string, input: PartnerRequestFormValues) => Promise<string | undefined>;
  deleteRequest: (requestId: string) => Promise<string | undefined>;
  closeRequest: (requestId: string) => Promise<string | undefined>;
  requestToJoin: (requestId: string, message?: string) => Promise<{ result?: RequestToJoinResult; error?: string }>;
  withdrawJoinRequest: (requestId: string) => Promise<string | undefined>;
  /** `joinId` is the join request's own id (`JoinRequest.id`). */
  acceptJoinRequest: (requestId: string, joinId: string) => Promise<string | undefined>;
  declineJoinRequest: (requestId: string, joinId: string) => Promise<string | undefined>;
};

const PartnerStoreContext = createContext<PartnerStoreValue | null>(null);

/**
 * Adventure Partner state, backed by the OUTLY backend (`lib/api/partner.ts`).
 * The backend keeps spot counts exact (accepting is checked and recorded in
 * one transaction) and closes a request automatically once it is full.
 */
export function PartnerStoreProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useSocialStore();
  const meId = currentUser.id;
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const requestsRef = useRef<PartnerRequest[]>([]);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<LoadError | null>(null);
  const inflight = useRef<Promise<void> | null>(null);

  const setList = useCallback((updater: (current: PartnerRequest[]) => PartnerRequest[]) => {
    const next = updater(requestsRef.current);
    requestsRef.current = next;
    setRequests(next);
  }, []);

  const refresh = useCallback((): Promise<void> => {
    if (inflight.current) return inflight.current;
    inflight.current = (async () => {
      setStatus((current) => (current === "ready" ? current : "loading"));
      const result = await fetchRequests();
      if (result.ok) {
        setError(null);
        setList((current) => {
          const known = new Map(current.map((request) => [request.id, request]));
          const merged = result.data.map((request) => {
            const before = known.get(request.id);
            return before && before.joinRequests.length > 0 ? { ...request, joinRequests: before.joinRequests } : request;
          });
          const fresh = new Set(result.data.map((request) => request.id));
          return [...merged, ...current.filter((request) => !fresh.has(request.id))];
        });
        setStatus("ready");
      } else {
        setError({ message: result.message, status: result.status });
        setStatus("error");
      }
    })().finally(() => {
      inflight.current = null;
    });
    return inflight.current;
  }, [setList]);

  const loadRequest = useCallback(
    async (requestId: string): Promise<LoadError | null> => {
      const result = await fetchRequest(requestId, meId);
      if (!result.ok) return { message: result.message, status: result.status };
      setList((current) =>
        current.some((request) => request.id === requestId)
          ? current.map((request) => (request.id === requestId ? result.data : request))
          : [result.data, ...current],
      );
      return null;
    },
    [meId, setList],
  );

  const getRequestById = useCallback((requestId: string) => requests.find((request) => request.id === requestId), [requests]);

  const createRequest = useCallback(
    async (input: PartnerRequestFormValues) => {
      const result = await createRequestRequest(input);
      if (!result.ok) return { error: result.message };
      setList((current) => [result.data, ...current.filter((request) => request.id !== result.data.id)]);
      return { request: result.data };
    },
    [setList],
  );

  const editRequest = useCallback(
    async (requestId: string, input: PartnerRequestFormValues) => {
      const result = await editRequestRequest(requestId, input);
      if (!result.ok) return result.message;
      await loadRequest(requestId);
      return undefined;
    },
    [loadRequest],
  );

  const deleteRequest = useCallback(
    async (requestId: string) => {
      const result = await deleteRequestRequest(requestId);
      if (!result.ok) return result.message;
      setList((current) => current.filter((request) => request.id !== requestId));
      return undefined;
    },
    [setList],
  );

  const closeRequest = useCallback(
    async (requestId: string) => {
      const result = await closeRequestRequest(requestId);
      if (!result.ok) return result.message;
      await loadRequest(requestId);
      return undefined;
    },
    [loadRequest],
  );

  const requestToJoin = useCallback(
    async (requestId: string, message?: string) => {
      const result = await joinRequestRequest(requestId, message?.trim() ?? "");
      if (!result.ok) {
        if (result.status === 409) return { result: "full" as RequestToJoinResult };
        if (/already/i.test(result.message)) return { result: "already-requested" as RequestToJoinResult };
        return { error: result.message };
      }
      await loadRequest(requestId);
      return { result: "requested" as RequestToJoinResult };
    },
    [loadRequest],
  );

  const withdrawJoinRequest = useCallback(
    async (requestId: string) => {
      const result = await withdrawJoinRequestRequest(requestId);
      if (!result.ok) return result.message;
      await loadRequest(requestId);
      return undefined;
    },
    [loadRequest],
  );

  const review = useCallback(
    async (requestId: string, joinId: string, accept: boolean) => {
      const result = await reviewJoinRequestRequest(requestId, joinId, accept);
      if (!result.ok) return result.status === 409 ? "All spots are already filled." : result.message;
      await loadRequest(requestId);
      return undefined;
    },
    [loadRequest],
  );

  const acceptJoinRequest = useCallback((requestId: string, joinId: string) => review(requestId, joinId, true), [review]);
  const declineJoinRequest = useCallback((requestId: string, joinId: string) => review(requestId, joinId, false), [review]);

  const value = useMemo<PartnerStoreValue>(
    () => ({
      requests,
      status,
      error,
      refresh,
      loadRequest,
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
    [requests, status, error, refresh, loadRequest, getRequestById, createRequest, editRequest, deleteRequest, closeRequest, requestToJoin, withdrawJoinRequest, acceptJoinRequest, declineJoinRequest],
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
