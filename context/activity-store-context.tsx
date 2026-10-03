"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useSocialStore } from "@/context/social-store-context";
import {
  createActivityRequest,
  deleteActivityRequest,
  editActivityRequest,
  fetchActivities,
  fetchActivity,
  joinActivityRequest,
} from "@/lib/api/activities";
import type { Activity, CreateActivityInput, EditActivityInput } from "@/types/activity";

type LoadStatus = "idle" | "loading" | "ready" | "error";
type LoadError = { message: string; status: number };

type ActivityStoreValue = {
  activities: Activity[];
  status: LoadStatus;
  error: LoadError | null;
  /** (Re)loads the activity list from the backend. */
  refresh: () => Promise<void>;
  /** Loads one activity with its participants (for detail/edit screens). */
  loadActivity: (activityId: string) => Promise<LoadError | null>;
  getActivityById: (activityId: string) => Activity | undefined;
  /** Every mutation resolves with an error message on failure. */
  createActivity: (input: CreateActivityInput) => Promise<{ activity?: Activity; error?: string }>;
  editActivity: (activityId: string, input: EditActivityInput) => Promise<string | undefined>;
  deleteActivity: (activityId: string) => Promise<string | undefined>;
  toggleParticipation: (activityId: string) => Promise<string | undefined>;
};

const ActivityStoreContext = createContext<ActivityStoreValue | null>(null);

/**
 * Activities module state (Activity List, Create Activity, Activity Detail,
 * Activity History), backed by the OUTLY backend (`lib/api/activities.ts`).
 * The list is loaded when a screen asks for it; completed activities also
 * feed the profile's history, so the social store is refreshed after changes.
 */
export function ActivityStoreProvider({ children }: { children: ReactNode }) {
  const { currentUser, refreshProfileExtras } = useSocialStore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const activitiesRef = useRef<Activity[]>([]);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<LoadError | null>(null);
  const inflight = useRef<Promise<void> | null>(null);

  const setList = useCallback((updater: (current: Activity[]) => Activity[]) => {
    const next = updater(activitiesRef.current);
    activitiesRef.current = next;
    setActivities(next);
  }, []);

  const refresh = useCallback((): Promise<void> => {
    if (inflight.current) return inflight.current;
    inflight.current = (async () => {
      setStatus((current) => (current === "ready" ? current : "loading"));
      const result = await fetchActivities();
      if (result.ok) {
        setError(null);
        setList((current) => {
          const fresh = new Set(result.data.map((activity) => activity.id));
          // Keep the participant lists already loaded for activities we are showing.
          const known = new Map(current.map((activity) => [activity.id, activity]));
          const merged = result.data.map((activity) => {
            const before = known.get(activity.id);
            return before && before.participants.length > 0 ? { ...activity, participants: before.participants } : activity;
          });
          return [...merged, ...current.filter((activity) => !fresh.has(activity.id))];
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

  const loadActivity = useCallback(
    async (activityId: string): Promise<LoadError | null> => {
      const result = await fetchActivity(activityId);
      if (!result.ok) return { message: result.message, status: result.status };
      setList((current) =>
        current.some((activity) => activity.id === activityId)
          ? current.map((activity) => (activity.id === activityId ? result.data : activity))
          : [result.data, ...current],
      );
      return null;
    },
    [setList],
  );

  const getActivityById = useCallback(
    (activityId: string) => activities.find((activity) => activity.id === activityId),
    [activities],
  );

  const createActivity = useCallback(
    async (input: CreateActivityInput) => {
      const result = await createActivityRequest(input);
      if (!result.ok) return { error: result.message };
      const created = await fetchActivity(result.data.id);
      const activity = created.ok ? created.data : result.data;
      setList((current) => [activity, ...current.filter((candidate) => candidate.id !== activity.id)]);
      if (activity.status === "completed") void refreshProfileExtras();
      return { activity };
    },
    [setList, refreshProfileExtras],
  );

  const editActivity = useCallback(
    async (activityId: string, input: EditActivityInput) => {
      const result = await editActivityRequest(activityId, input);
      if (!result.ok) return result.message;
      await loadActivity(activityId);
      void refreshProfileExtras();
      return undefined;
    },
    [loadActivity, refreshProfileExtras],
  );

  const deleteActivity = useCallback(
    async (activityId: string) => {
      const result = await deleteActivityRequest(activityId);
      if (!result.ok) return result.message;
      setList((current) => current.filter((activity) => activity.id !== activityId));
      void refreshProfileExtras();
      return undefined;
    },
    [setList, refreshProfileExtras],
  );

  const toggleParticipation = useCallback(
    async (activityId: string) => {
      const activity = activitiesRef.current.find((candidate) => candidate.id === activityId);
      const joined = Boolean(activity?.participants.some((person) => person.id === currentUser.id));
      const result = await joinActivityRequest(activityId, !joined);
      if (!result.ok) return result.message;
      await loadActivity(activityId);
      return undefined;
    },
    [currentUser.id, loadActivity],
  );

  const value = useMemo<ActivityStoreValue>(
    () => ({
      activities,
      status,
      error,
      refresh,
      loadActivity,
      getActivityById,
      createActivity,
      editActivity,
      deleteActivity,
      toggleParticipation,
    }),
    [activities, status, error, refresh, loadActivity, getActivityById, createActivity, editActivity, deleteActivity, toggleParticipation],
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
