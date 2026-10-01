"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { MOCK_GROUPS } from "@/lib/mock/mock-groups";
import { useSocialStore } from "@/context/social-store-context";
import type { Group, GroupFormValues, GroupRole } from "@/types/group";

export type LeaveGroupResult = "left" | "owner-must-transfer-first";

type GroupStoreValue = {
  groups: Group[];
  getGroupById: (groupId: string) => Group | undefined;
  createGroup: (input: GroupFormValues) => Group;
  editGroup: (groupId: string, input: GroupFormValues) => void;
  deleteGroup: (groupId: string) => void;
  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => LeaveGroupResult;
  setMemberRole: (groupId: string, userId: string, role: GroupRole) => void;
  removeMember: (groupId: string, userId: string) => void;
};

const GroupStoreContext = createContext<GroupStoreValue | null>(null);

let localGroupIdCounter = 0;

function nextGroupId(): string {
  localGroupIdCounter += 1;
  return `group-local-${Date.now()}-${localGroupIdCounter}`;
}

const SEED_GRADIENTS = [
  "linear-gradient(135deg, #351080, #7c3aed)",
  "linear-gradient(135deg, #7c3aed, #ec4899)",
  "linear-gradient(135deg, #5b21b6, #f6339a)",
  "linear-gradient(135deg, #351080, #ec4899)",
];

/**
 * Session-only mock "backend" for the Groups & Communities module
 * (Groups List, Group Detail, Group Feed, Members, Create/Edit Group).
 * Group Feed itself reuses `useSocialStore`'s posts (filtered by
 * `Post.groupId`) rather than a parallel post system. Nothing here
 * persists beyond the current browser session.
 */
export function GroupStoreProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useSocialStore();
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);

  const getGroupById = useCallback(
    (groupId: string) => groups.find((group) => group.id === groupId),
    [groups],
  );

  const createGroup = useCallback(
    (input: GroupFormValues) => {
      const newGroup: Group = {
        id: nextGroupId(),
        name: input.name.trim(),
        description: input.description.trim(),
        category: input.category.trim(),
        visibility: input.visibility,
        rules: input.rules?.trim() || undefined,
        gradient: SEED_GRADIENTS[groups.length % SEED_GRADIENTS.length],
        members: [{ id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl, role: "owner" }],
      };
      setGroups((current) => [newGroup, ...current]);
      return newGroup;
    },
    [currentUser, groups.length],
  );

  const editGroup = useCallback((groupId: string, input: GroupFormValues) => {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              name: input.name.trim(),
              description: input.description.trim(),
              category: input.category.trim(),
              visibility: input.visibility,
              rules: input.rules?.trim() || undefined,
            }
          : group,
      ),
    );
  }, []);

  const deleteGroup = useCallback((groupId: string) => {
    setGroups((current) => current.filter((group) => group.id !== groupId));
  }, []);

  const joinGroup = useCallback(
    (groupId: string) => {
      setGroups((current) =>
        current.map((group) => {
          if (group.id !== groupId) return group;
          if (group.members.some((member) => member.id === currentUser.id)) return group;
          return {
            ...group,
            members: [
              ...group.members,
              { id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl, role: "member" },
            ],
          };
        }),
      );
    },
    [currentUser],
  );

  const leaveGroup = useCallback(
    (groupId: string): LeaveGroupResult => {
      const group = groups.find((candidate) => candidate.id === groupId);
      const membership = group?.members.find((member) => member.id === currentUser.id);
      if (membership?.role === "owner") return "owner-must-transfer-first";

      setGroups((current) =>
        current.map((candidate) =>
          candidate.id === groupId
            ? { ...candidate, members: candidate.members.filter((member) => member.id !== currentUser.id) }
            : candidate,
        ),
      );
      return "left";
    },
    [groups, currentUser],
  );

  const setMemberRole = useCallback((groupId: string, userId: string, role: GroupRole) => {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              members: group.members.map((member) =>
                member.id === userId ? { ...member, role } : member,
              ),
            }
          : group,
      ),
    );
  }, []);

  const removeMember = useCallback((groupId: string, userId: string) => {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? { ...group, members: group.members.filter((member) => member.id !== userId) }
          : group,
      ),
    );
  }, []);

  const value = useMemo<GroupStoreValue>(
    () => ({
      groups,
      getGroupById,
      createGroup,
      editGroup,
      deleteGroup,
      joinGroup,
      leaveGroup,
      setMemberRole,
      removeMember,
    }),
    [groups, getGroupById, createGroup, editGroup, deleteGroup, joinGroup, leaveGroup, setMemberRole, removeMember],
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
