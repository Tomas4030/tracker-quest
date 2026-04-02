import type { Team } from "@/types";
import { supabase } from "./supabase";

class TeamService {
  private teams: Team[] = [];

  private _mapDbTeam(row: {
    id: string;
    name: string;
    company: string;
    group_code: string;
    member_ids: string[];
    active: boolean;
    created_at?: string;
    updated_at?: string;
  }): Team {
    return {
      id: row.id,
      name: row.name,
      company: row.company,
      groupCode: row.group_code,
      memberIds: row.member_ids || [],
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async loadAll(): Promise<Team[]> {
    if (!supabase) {
      this.teams = [];
      return [];
    }

    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    this.teams = (data || []).map((item) => this._mapDbTeam(item));
    return this.teams;
  }

  private refresh(): Team[] {
    return this.teams;
  }

  getAll(): Team[] {
    return this.refresh();
  }

  getActive(): Team[] {
    return this.refresh().filter((team) => team.active);
  }

  getById(id: string): Team | undefined {
    return this.refresh().find((team) => team.id === id);
  }

  async create(
    team: Omit<Team, "id" | "createdAt" | "updatedAt">,
  ): Promise<Team> {
    if (!supabase) {
      throw new Error("Supabase não configurado.");
    }

    const { data, error } = await supabase
      .from("teams")
      .insert({
        name: team.name,
        company: team.company,
        group_code: team.groupCode,
        member_ids: team.memberIds || [],
        active: team.active,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    const mapped = this._mapDbTeam(data);
    this.teams = [...this.refresh(), mapped];
    return mapped;
  }

  async update(id: string, updates: Partial<Team>): Promise<Team> {
    if (!supabase) {
      throw new Error("Supabase não configurado.");
    }

    const { data, error } = await supabase
      .from("teams")
      .update({
        name: updates.name,
        company: updates.company,
        group_code: updates.groupCode,
        member_ids: updates.memberIds,
        active: updates.active,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    const mapped = this._mapDbTeam(data);
    const teams = this.refresh();
    const index = teams.findIndex((team) => team.id === id);
    if (index === -1) {
      this.teams = [...teams, mapped];
      return mapped;
    }
    teams[index] = mapped;
    this.teams = teams;
    return mapped;
  }

  async toggleActive(id: string, active: boolean): Promise<Team> {
    return this.update(id, { active });
  }
}

export const teamService = new TeamService();
