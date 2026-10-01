"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { MOCK_ACTIVITIES } from "@/lib/mock/mock-activities";
import { useSocialStore } from "@/context/social-store-context";
import type { Activity, CreateActivityInput, EditActivityInput } from "@/types/activity";

type ActivityStoreValue = {
  activities: Activity[];
  getActivityById: (activityId: string) => Activity | undefined;
  createActivity: (input: CreateActivityInput) => Activity;
  editActivity: (activityId: string, input: EditActivityInput) => void;
  deleteActivity: (activityId: string) => void;
  toggleParticipation: (activityId: string) => void;
};

const ActivityStoreContext = createContext<ActivityStoreValue | null>(null);

let localActivityIdCounter = 0;

function nextActivityId(): string {
  localActivityIdCounter += 1;
  return `activity-local-${Date.now()}-${localActivityIdCounter}`;
}

/**
 * Session-only mock "backend" for the Activities module (Activity List,
 * Create Activity, Activity Detail, Activity History). Reads the current
 * user from `SocialStoreProvider` so activities and profile data always
 * agree on who "you" are, but keeps its own state so this module doesn't
 * grow the already-large social store further. Nothing here persists
 * beyond the current browser session.
 */
export function ActivityStoreProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useSocialStore();
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);

  const getActivityById = useCallback(
    (activityId: string) => activities.find((activity) => activity.id === activityId),
    [activities],
  );

  const createActivity = useCallback(
    (input: CreateActivityInput) => {
      const newActivity: Activity = {
        id: nextActivityId(),
        creatorId: currentUser.id,
        creatorName: currentUser.name,
        title: input.title.trim(),
        type: input.type,
        placeId: input.placeId,
        location: input.location.trim(),
        startAt: input.startAt,
        distanceKm: input.distanceKm,
        durationLabel: input.durationLabel?.trim() || undefined,
        difficulty: input.difficulty,
        notes: input.notes?.trim() || undefined,
        privacy: input.privacy,
        status: input.status,
        participants: [{ id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl }],
      };
      setActivities((current) => [newActivity, ...current]);
      return newActivity;
    },
    [currentUser],
  );

  const editActivity = useCallback((activityId: string, input: EditActivityInput) => {
    setActivities((current) =>
      current.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              title: input.title.trim(),
              type: input.type,
              placeId: input.placeId,
              location: input.location.trim(),
              startAt: input.startAt,
              distanceKm: input.distanceKm,
              durationLabel: input.durationLabel?.trim() || undefined,
              difficulty: input.difficulty,
              notes: input.notes?.trim() || undefined,
              privacy: input.privacy,
              status: input.status,
            }
          : activity,
      ),
    );
  }, []);

  const deleteActivity = useCallback((activityId: string) => {
    setActivities((current) => current.filter((activity) => activity.id !== activityId));
  }, []);

  const toggleParticipation = useCallback(
    (activityId: string) => {
      setActivities((current) =>
        current.map((activity) => {
          if (activity.id !== activityId) return activity;
          const isParticipant = activity.participants.some((p) => p.id === currentUser.id);
          return {
            ...activity,
            participants: isParticipant
              ? activity.participants.filter((p) => p.id !== currentUser.id)
              : [
                  ...activity.participants,
                  { id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl },
                ],
          };
        }),
      );
    },
    [currentUser],
  );

  const value = useMemo<ActivityStoreValue>(
    () => ({
      activities,
      getActivityById,
      createActivity,
      editActivity,
      deleteActivity,
      toggleParticipation,
    }),
    [activities, getActivityById, createActivity, editActivity, deleteActivity, toggleParticipation],
  );

  return <ActivityStoreContext.Provider value={value}>{children}</ActivityStoreContext.Provider>;
}

export function useActivityStore(): ActivityStoreValue {
  const context = useContext(ActivityStoreContext);
  if (!context) {
    throw new Error("useActivityStore must be used within an ActivityStoreProvider");
  }
  return context;
}
