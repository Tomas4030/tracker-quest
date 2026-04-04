import type { Activity, ActivityFilter } from "@/types";
import { supabase } from "./supabase";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class ActivityService {
  private _isUuid(value?: string): boolean {
    if (!value) return false;
    return UUID_REGEX.test(value);
  }

  private async _resolveUserId(userId: string): Promise<string> {
    if (this._isUuid(userId)) return userId;
    if (!supabase) return userId;

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw new Error(error.message);
    if (!user?.id || !this._isUuid(user.id)) {
      throw new Error("Sessão inválida. Volta a iniciar sessão.");
    }
    return user.id;
  }

  private async _resolveProjectId(
    projectId?: string,
    projectName?: string,
  ): Promise<string | null> {
    if (!projectId) return null;
    if (this._isUuid(projectId)) return projectId;
    if (!supabase || !projectName) return null;

    const { data, error } = await supabase
      .from("projects")
      .select("id")
      .eq("name", projectName)
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data?.id || !this._isUuid(data.id)) return null;
    return data.id;
  }

  constructor() {
    this._loadActivitiesFromStorage();
  }

  private _loadActivitiesFromStorage() {
    return;
  }

  private _mapDbActivity(data: {
    id: string;
    user_id: string;
    project_id?: string | null;
    project_name?: string | null;
    title: string;
    description?: string | null;
    date: string;
    start_time: string;
    end_time: string;
    status: Activity["status"];
    created_at?: string;
    updated_at?: string;
  }): Activity {
    return {
      id: data.id,
      userId: data.user_id,
      projectId: data.project_id || undefined,
      projectName: data.project_name || undefined,
      title: data.title,
      description: data.description || undefined,
      date: data.date,
      startTime: data.start_time,
      endTime: data.end_time,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async create(
    activity: Omit<Activity, "id" | "createdAt" | "updatedAt">,
  ): Promise<Activity> {
    if (!supabase) {
      throw new Error("Supabase não configurado.");
    }

    const safeUserId = await this._resolveUserId(activity.userId);
    const safeProjectId = await this._resolveProjectId(
      activity.projectId,
      activity.projectName,
    );

    const { data, error } = await supabase
      .from("activities")
      .insert({
        user_id: safeUserId,
        project_id: safeProjectId,
        project_name: activity.projectName,
        title: activity.title,
        description: activity.description,
        date: activity.date,
        start_time: formatTime(activity.startTime),
        end_time: formatTime(activity.endTime),
        status: activity.status,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return this._mapDbActivity(data);
  }

  async update(id: string, updates: Partial<Activity>): Promise<Activity> {
    if (!supabase) {
      throw new Error("Supabase não configurado.");
    }

    const safeProjectId = updates.projectId
      ? await this._resolveProjectId(updates.projectId, updates.projectName)
      : undefined;

    const { data, error } = await supabase
      .from("activities")
      .update({
        title: updates.title,
        description: updates.description,
        project_id: safeProjectId,
        project_name: updates.projectName,
        date: updates.date,
        start_time: updates.startTime,
        end_time: updates.endTime,
        status: updates.status,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return this._mapDbActivity(data);
  }

  async delete(id: string): Promise<void> {
    if (!supabase) {
      throw new Error("Supabase não configurado.");
    }
    const { error } = await supabase.from("activities").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  async getById(id: string): Promise<Activity | undefined> {
    if (!supabase) {
      throw new Error("Supabase não configurado.");
    }

    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return undefined;
    return this._mapDbActivity(data);
  }

  async getAll(filter?: ActivityFilter): Promise<Activity[]> {
    if (!supabase) {
      throw new Error("Supabase não configurado.");
    }

    let query = supabase
      .from("activities")
      .select("*")
      .order("date", { ascending: false })
      .order("start_time", { ascending: false });

    if (filter?.userId) {
      query = query.eq("user_id", filter.userId);
    }
    if (filter?.projectId) {
      query = query.eq("project_id", filter.projectId);
    }
    if (filter?.date) {
      query = query.eq("date", filter.date);
    }
    if (filter?.status) {
      query = query.eq("status", filter.status);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let mapped = (data || []).map((item) => this._mapDbActivity(item));

    if (filter?.search) {
      const search = filter.search.toLowerCase();
      mapped = mapped.filter(
        (a) =>
          a.title.toLowerCase().includes(search) ||
          a.description?.toLowerCase().includes(search),
      );
    }

    return mapped;
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
    if (!supabase) {
      throw new Error("Supabase não configurado.");
    }

    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []).map((item) => this._mapDbActivity(item));
  }
}

export const activityService = new ActivityService();
