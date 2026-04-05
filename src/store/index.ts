import { create } from "zustand";
import type { User, Activity } from "@/types";
import { authService, activityService } from "@/services";

interface AppStore {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;

  activities: Activity[];
  setActivities: (activities: Activity[]) => void;
  createActivity: (activity: Omit<Activity, "id">) => Promise<void>;
  updateActivity: (id: string, updates: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  loadActivities: (userId?: string) => Promise<void>;
}

export const useAppStore = create<AppStore>((set) => ({
  user: authService.getCurrentUser() || null,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const user = await authService.login(email, password);
      set({ user, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, activities: [] });
  },

  setUser: (user) => set({ user }),

  activities: [],
  setActivities: (activities) => set({ activities }),

  createActivity: async (activity) => {
    const newActivity = await activityService.create(activity);
    set((state) => ({
      activities: [...state.activities, newActivity],
    }));
  },

  updateActivity: async (id, updates) => {
    const updated = await activityService.update(id, updates);
    set((state) => ({
      activities: state.activities.map((a) => (a.id === id ? updated : a)),
    }));
  },

  deleteActivity: async (id) => {
    await activityService.delete(id);
    set((state) => ({
      activities: state.activities.filter((a) => a.id !== id),
    }));
  },

  loadActivities: async (userId?: string) => {
    const activities = userId
      ? await activityService.getByUserId(userId)
      : await activityService.getAll();

    set({ activities });
  },
}));
