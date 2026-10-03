"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useSocialStore } from "@/context/social-store-context";
import {
  createGroupRequest,
  deleteGroupRequest,
  editGroupRequest,
  fetchGroup,
  fetchGroups,
  joinGroupRequest,
  leaveGroupRequest,
  removeMemberRequest,
  reviewJoinRequest,
  setMemberRoleRequest,
} from "@/lib/api/groups";
import type { Group, GroupFormValues, GroupRole } from "@/types/group";

export type LeaveGroupResult = "left" | "owner-must-transfer-first";
export type JoinGroupResult = "joined" | "requested";

type LoadStatus = "idle" | "loading" | "ready" | "error";
type LoadError = { message: string; status: number };

type GroupStoreValue = {
  groups: Group[];
  status: LoadStatus;
  error: LoadError | null;
  /** (Re)loads the group list from the backend. */
  refresh: () => Promise<void>;
  /** Loads one group with its members (and pending requests for moderators). */
  loadGroup: (groupId: string) => Promise<LoadError | null>;
  getGroupById: (groupId: string) => Group | undefined;
  /** Every mutation resolves with an error message (or `error`) on failure. */
  createGroup: (input: GroupFormValues) => Promise<{ group?: Group; error?: string }>;
  editGroup: (groupId: string, input: GroupFormValues) => Promise<string | undefined>;
  deleteGroup: (groupId: string) => Promise<string | undefined>;
  joinGroup: (groupId: string) => Promise<{ result?: JoinGroupResult; error?: string }>;
  leaveGroup: (groupId: string) => Promise<{ result?: LeaveGroupResult; error?: string }>;
  setMemberRole: (groupId: string, userId: string, role: GroupRole) => Promise<string | undefined>;
  removeMember: (groupId: string, userId: string) => Promise<string | undefined>;
  /** Moderators accept or decline someone's request to join a private group. */
  reviewRequest: (groupId: string, requestId: string, accept: boolean) => Promise<string | undefined>;
};

const GroupStoreContext = createContext<GroupStoreValue | null>(null);

/**
 * Groups & Communities state, backed by the OUTLY backend
 * (`lib/api/groups.ts`). A group's own feed is handled by the social store
 * (group posts are posts with a `groupId`). Membership changes also refresh
 * the profile's "Joined communities".
 */
export function GroupStoreProvider({ children }: { children: ReactNode }) {
  const { refreshProfileExtras } = useSocialStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const groupsRef = useRef<Group[]>([]);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<LoadError | null>(null);
  const inflight = useRef<Promise<void> | null>(null);

  const setList = useCallback((updater: (current: Group[]) => Group[]) => {
    const next = updater(groupsRef.current);
    groupsRef.current = next;
    setGroups(next);
  }, []);

  const refresh = useCallback((): Promise<void> => {
    if (inflight.current) return inflight.current;
    inflight.current = (async () => {
      setStatus((current) => (current === "ready" ? current : "loading"));
      const result = await fetchGroups();
      if (result.ok) {
        setError(null);
        setList((current) => {
          const known = new Map(current.map((group) => [group.id, group]));
          // Keep member lists already loaded for groups we are showing.
          return result.data.map((group) => {
            const before = known.get(group.id);
            return before && before.members.length > 0
              ? { ...group, members: before.members, joinRequests: before.joinRequests }
              : group;
          });
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

  const loadGroup = useCallback(
    async (groupId: string): Promise<LoadError | null> => {
      const result = await fetchGroup(groupId);
      if (!result.ok) return { message: result.message, status: result.status };
      setList((current) =>
        current.some((group) => group.id === groupId)
          ? current.map((group) => (group.id === groupId ? result.data : group))
          : [result.data, ...current],
      );
      return null;
    },
    [setList],
  );

  const getGroupById = useCallback((groupId: string) => groups.find((group) => group.id === groupId), [groups]);

  const createGroup = useCallback(
    async (input: GroupFormValues) => {
      const result = await createGroupRequest(input);
      if (!result.ok) return { error: result.message };
      setList((current) => [result.data, ...current.filter((group) => group.id !== result.data.id)]);
      void refreshProfileExtras();
      return { group: result.data };
    },
    [setList, refreshProfileExtras],
  );

  const editGroup = useCallback(
    async (groupId: string, input: GroupFormValues) => {
      const result = await editGroupRequest(groupId, input);
      if (!result.ok) return result.message;
      await loadGroup(groupId);
      return undefined;
    },
    [loadGroup],
  );

  const deleteGroup = useCallback(
    async (groupId: string) => {
      const result = await deleteGroupRequest(groupId);
      if (!result.ok) return result.message;
      setList((current) => current.filter((group) => group.id !== groupId));
      void refreshProfileExtras();
      return undefined;
    },
    [setList, refreshProfileExtras],
  );

  const joinGroup = useCallback(
    async (groupId: string) => {
      const result = await joinGroupRequest(groupId);
      if (!result.ok) return { error: result.message };
      await loadGroup(groupId);
      void refreshProfileExtras();
      return { result: (result.data.status === "JOINED" ? "joined" : "requested") as JoinGroupResult };
    },
    [loadGroup, refreshProfileExtras],
  );

  const leaveGroup = useCallback(
    async (groupId: string) => {
      const group = groupsRef.current.find((candidate) => candidate.id === groupId);
      if (group?.myRole === "owner") return { result: "owner-must-transfer-first" as LeaveGroupResult };
      const result = await leaveGroupRequest(groupId);
      if (!result.ok) return { error: result.message };
      await loadGroup(groupId);
      void refreshProfileExtras();
      return { result: "left" as LeaveGroupResult };
    },
    [loadGroup, refreshProfileExtras],
  );

  const setMemberRole = useCallback(
    async (groupId: string, userId: string, role: GroupRole) => {
      const result = await setMemberRoleRequest(groupId, userId, role);
      if (!result.ok) return result.message;
      await loadGroup(groupId);
      return undefined;
    },
    [loadGroup],
  );

  const removeMember = useCallback(
    async (groupId: string, userId: string) => {
      const result = await removeMemberRequest(groupId, userId);
      if (!result.ok) return result.message;
      await loadGroup(groupId);
      return undefined;
    },
    [loadGroup],
  );

  const reviewRequest = useCallback(
    async (groupId: string, requestId: string, accept: boolean) => {
      const result = await reviewJoinRequest(groupId, requestId, accept);
      if (!result.ok) return result.message;
      await loadGroup(groupId);
      return undefined;
    },
    [loadGroup],
  );

  const value = useMemo<GroupStoreValue>(
    () => ({
      groups,
      status,
      error,
      refresh,
      loadGroup,
      getGroupById,
      createGroup,
      editGroup,
      deleteGroup,
      joinGroup,
      leaveGroup,
      setMemberRole,
      removeMember,
      reviewRequest,
    }),
    [groups, status, error, refresh, loadGroup, getGroupById, createGroup, editGroup, deleteGroup, joinGroup, leaveGroup, setMemberRole, removeMember, reviewRequest],
  );

  return <GroupStoreContext.Provider value={value}>{children}</GroupStoreContext.Provider>;
}

export function useGroupStore(): GroupStoreValue {
  const context = useContext(GroupStoreContext);
  if (!context) {
    throw new Error("useGroupStore must be used within a GroupStoreProvider");
  }
  return context;
}
