import type { Activity, ActivityFilter } from "@/types";
import { supabase } from "./supabase";

class ActivityService {
  private activities: Activity[] = [];

  constructor() {
    this._loadActivitiesFromStorage();
  }

  private _loadActivitiesFromStorage() {
    if (typeof window === "undefined") {
      this.activities = [];
      return;
    }

    const stored = localStorage.getItem("estagio_activities");
    if (stored) {
      this.activities = JSON.parse(stored);
    } else {
      this.activities = [];
      this._saveActivitiesToStorage();
    }
  }

  private _saveActivitiesToStorage() {
    if (typeof window === "undefined") return;
    localStorage.setItem("estagio_activities", JSON.stringify(this.activities));
  }

  async create(
    activity: Omit<Activity, "id" | "createdAt" | "updatedAt">,
  ): Promise<Activity> {
    if (supabase) {
      const { data, error } = await supabase
        .from("activities")
        .insert({
          user_id: activity.userId,
          project_id: activity.projectId,
          project_name: activity.projectName,
          title: activity.title,
          description: activity.description,
          date: activity.date,
          start_time: activity.startTime,
          end_time: activity.endTime,
          status: activity.status,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return {
        id: data.id,
        userId: data.user_id,
        projectId: data.project_id,
        projectName: data.project_name,
        title: data.title,
        description: data.description,
        date: data.date,
        startTime: data.start_time,
        endTime: data.end_time,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } else {
      // Demo mode
      const newActivity: Activity = {
        id: "a" + Date.now(),
        ...activity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.activities.push(newActivity);
      this._saveActivitiesToStorage();
      return newActivity;
    }
  }

  async update(id: string, updates: Partial<Activity>): Promise<Activity> {
    if (supabase) {
      const { data, error } = await supabase
        .from("activities")
        .update({
          title: updates.title,
          description: updates.description,
          project_id: updates.projectId,
          project_name: updates.projectName,
          date: updates.date,
          start_time: updates.startTime,
          end_time: updates.endTime,
          status: updates.status,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return {
        id: data.id,
        userId: data.user_id,
        projectId: data.project_id,
        projectName: data.project_name,
        title: data.title,
        description: data.description,
        date: data.date,
        startTime: data.start_time,
        endTime: data.end_time,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } else {
      // Demo mode
      const idx = this.activities.findIndex((a) => a.id === id);
      if (idx === -1) throw new Error("Activity not found");
      this.activities[idx] = {
        ...this.activities[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this._saveActivitiesToStorage();
      return this.activities[idx];
    }
  }

  async delete(id: string): Promise<void> {
    if (supabase) {
      const { error } = await supabase.from("activities").delete().eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      // Demo mode
      this.activities = this.activities.filter((a) => a.id !== id);
      this._saveActivitiesToStorage();
    }
  }

  async getById(id: string): Promise<Activity | undefined> {
    if (supabase) {
      const { data, error } = await supabase
        .from("activities")
        .select()
        .eq("id", id)
        .single();

      if (error) throw new Error(error.message);
      return {
        id: data.id,
        userId: data.user_id,
        projectId: data.project_id,
        projectName: data.project_name,
        title: data.title,
        description: data.description,
        date: data.date,
        startTime: data.start_time,
        endTime: data.end_time,
        status: data.status,
      };
    } else {
      // Demo mode
      return this.activities.find((a) => a.id === id);
    }
  }

  async getAll(filter?: ActivityFilter): Promise<Activity[]> {
    let filtered = [...this.activities];

    if (filter?.userId) {
      filtered = filtered.filter((a) => a.userId === filter.userId);
    }
    if (filter?.projectId) {
      filtered = filtered.filter(
        (a) =>
          a.projectId === filter.projectId ||
          a.projectName === filter.projectId,
      );
    }
    if (filter?.date) {
      filtered = filtered.filter((a) => a.date === filter.date);
    }
    if (filter?.status) {
      filtered = filtered.filter((a) => a.status === filter.status);
    }
    if (filter?.search) {
      const search = filter.search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(search) ||
          a.description?.toLowerCase().includes(search),
      );
    }

    return filtered.sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime),
    );
  }

  async getByUserId(
    userId: string,
    filter?: Omit<ActivityFilter, "userId">,
  ): Promise<Activity[]> {
    return this.getAll({ ...filter, userId });
  }

  async getByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<Activity[]> {
    const filtered = this.activities.filter(
      (a) => a.date >= startDate && a.date <= endDate,
    );
    return filtered.sort((a, b) => a.date.localeCompare(b.date));
  }
}

export const activityService = new ActivityService();
