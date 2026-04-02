import type { Project } from "@/types";
import { supabase } from "./supabase";

class ProjectService {
  private projects: Project[] = [];

  private _mapDbProject(row: {
    id: string;
    name: string;
    code: string;
    description?: string | null;
    team_id?: string | null;
    color: string;
    active: boolean;
    created_at?: string;
    updated_at?: string;
  }): Project {
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description || undefined,
      teamId: row.team_id || undefined,
      color: row.color,
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async loadAll(): Promise<Project[]> {
    if (!supabase) {
      this.projects = [];
      return [];
    }

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    this.projects = (data || []).map((item) => this._mapDbProject(item));
    return this.projects;
  }

  private refresh(): Project[] {
    return this.projects;
  }

  getAll(): Project[] {
    return this.refresh();
  }

  getActive(): Project[] {
    return this.refresh().filter((project) => project.active);
  }

  getById(id: string): Project | undefined {
    return this.refresh().find((project) => project.id === id);
  }

  async create(
    project: Omit<Project, "id" | "createdAt" | "updatedAt">,
  ): Promise<Project> {
    if (!supabase) {
      throw new Error("Supabase não configurado.");
    }

    const { data, error } = await supabase
      .from("projects")
      .insert({
        name: project.name,
        code: project.code,
        description: project.description,
        team_id: project.teamId,
        color: project.color,
        active: project.active,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    const mapped = this._mapDbProject(data);
    this.projects = [...this.refresh(), mapped];
    return mapped;
  }

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    if (!supabase) {
      throw new Error("Supabase não configurado.");
    }

    const { data, error } = await supabase
      .from("projects")
      .update({
        name: updates.name,
        code: updates.code,
        description: updates.description,
        team_id: updates.teamId,
        color: updates.color,
        active: updates.active,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    const mapped = this._mapDbProject(data);
    const projects = this.refresh();
    const index = projects.findIndex((project) => project.id === id);
    if (index === -1) {
      this.projects = [...projects, mapped];
      return mapped;
    }
    projects[index] = mapped;
    this.projects = projects;
    return mapped;
  }

  async toggleActive(id: string, active: boolean): Promise<Project> {
    return this.update(id, { active });
  }
}

export const projectService = new ProjectService();
