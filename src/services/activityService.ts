import type { Activity, ActivityFilter } from "@/types";
import { supabase } from "./supabase";

const DEMO_ACTIVITIES: Activity[] = [
  {
    id: "a1",
    userId: "u2",
    title: "Desenvolvimento da Aplicação X",
    description:
      "Implementação do módulo de autenticação e sessões de utilizador.",
    date: "2024-04-15",
    startTime: "09:00",
    endTime: "13:00",
    status: "concluido",
  },
  {
    id: "a2",
    userId: "u2",
    title: "Base de Dados Y",
    description: "Criação do schema e migração de dados para PostgreSQL.",
    date: "2024-04-15",
    startTime: "14:30",
    endTime: "18:30",
    status: "concluido",
  },
  {
    id: "a3",
    userId: "u2",
    title: "Reunião de Equipa",
    description: "Discussão do andamento do projeto e próximas tarefas.",
    date: "2024-04-17",
    startTime: "09:00",
    endTime: "10:00",
    status: "concluido",
  },
  {
    id: "a4",
    userId: "u2",
    title: "Desenvolvimento da Aplicação X",
    description: "Desenvolvimento da interface do painel de controlo.",
    date: "2024-04-17",
    startTime: "14:30",
    endTime: "18:30",
    status: "em-curso",
  },
  {
    id: "a5",
    userId: "u3",
    title: "Testes e Validações",
    description: "Testes de unidade para os módulos de autenticação.",
    date: "2024-04-16",
    startTime: "11:00",
    endTime: "13:00",
    status: "concluido",
  },
  {
    id: "a6",
    userId: "u3",
    title: "Ajustes na Interface",
    description: "Correção de bugs de responsividade no frontend.",
    date: "2024-04-17",
    startTime: "13:00",
    endTime: "17:00",
    status: "concluido",
  },
  {
    id: "a7",
    userId: "u2",
    title: "Desenvolvimento da Aplicação X",
    description: "Integração com API externa de pagamentos.",
    date: "2024-04-18",
    startTime: "09:00",
    endTime: "13:00",
    status: "pendente",
  },
  {
    id: "a8",
    userId: "u3",
    title: "Documentação técnica",
    description: "Redação da documentação da API REST.",
    date: "2024-04-18",
    startTime: "09:00",
    endTime: "12:00",
    status: "em-curso",
  },
];

class ActivityService {
  private activities: Activity[] = [];

  constructor() {
    this._loadActivitiesFromStorage();
  }

  private _loadActivitiesFromStorage() {
    if (typeof window === "undefined") {
      this.activities = DEMO_ACTIVITIES;
      return;
    }

    const stored = localStorage.getItem("estagio_activities");
    if (stored) {
      this.activities = JSON.parse(stored);
    } else {
      this.activities = DEMO_ACTIVITIES;
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
