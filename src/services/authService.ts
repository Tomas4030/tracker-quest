import type { Project, Team, User, UserRole } from "@/types";
import { supabase } from "./supabase";
import { teamService } from "./teamService";
import { projectService } from "./projectService";

const ADMIN_EMAIL = "admin@estagio.pt";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class AuthService {
  private users: User[] = [];

  private _isMissingColumnError(message: string, column: string): boolean {
    const normalized = message.toLowerCase();
    return (
      normalized.includes("could not find") &&
      normalized.includes(`'${column.toLowerCase()}'`) &&
      normalized.includes("column")
    );
  }

  private _persistCurrentUser(user: User | null) {
    if (typeof window === "undefined") return;
    if (!user) {
      localStorage.removeItem("estagio_current_user");
      return;
    }
    localStorage.setItem("estagio_current_user", JSON.stringify(user));
  }

  private _touchTeamMetadata(user: User): User {
    const team = user.teamId ? teamService.getById(user.teamId) : undefined;
    const enrichedProjects = this._getProjectNames(user.projectIds || []);
    return {
      ...user,
      teamName: team?.name || user.teamName,
      company: team?.company || user.company,
      groupCode: team?.groupCode || user.groupCode,
      projectIds:
        user.projectIds || enrichedProjects.map((project) => project.id),
    };
  }

  private _getProjectNames(projectIds: string[]): Project[] {
    return projectIds
      .map((projectId) => projectService.getById(projectId))
      .filter((project): project is Project => Boolean(project));
  }

  private _isUuid(value?: string): boolean {
    if (!value) return false;
    return UUID_REGEX.test(value);
  }

  private _upsertUserInCache(user: User): void {
    const index = this.users.findIndex((item) => item.id === user.id);
    if (index === -1) {
      this.users = [...this.users, user];
      return;
    }
    this.users[index] = user;
  }

  private _mapDbUser(profile: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    active?: boolean;
    team_id?: string | null;
    company?: string | null;
    group_code?: string | null;
    project_ids?: string[] | null;
    created_at?: string;
    updated_at?: string;
  }): User {
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      active: profile.active !== false,
      teamId: profile.team_id || undefined,
      company: profile.company || undefined,
      groupCode: profile.group_code || undefined,
      projectIds: profile.project_ids || [],
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  }

  async loadAll(): Promise<User[]> {
    if (!supabase) {
      this.users = [];
      return [];
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);

    this.users = (data || []).map((item) =>
      this._touchTeamMetadata(this._mapDbUser(item)),
    );
    return this.users;
  }

  async login(email: string, password: string): Promise<User> {
    if (!supabase) {
      throw new Error(
        "Supabase não configurado. Define NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Login failed");

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) throw new Error(profileError.message);

    let finalProfile = profile;
    if (!finalProfile) {
      const fallbackRole: UserRole =
        email.toLowerCase() === ADMIN_EMAIL ? "admin" : "estagiario";

      const { data: inserted, error: insertError } = await supabase
        .from("users")
        .insert({
          id: data.user.id,
          name:
            data.user.user_metadata?.name ||
            email.split("@")[0] ||
            "Utilizador",
          email,
          role: fallbackRole,
          active: true,
        })
        .select("*")
        .single();

      if (insertError) throw new Error(insertError.message);
      finalProfile = inserted;
    }

    const mapped = this._touchTeamMetadata(this._mapDbUser(finalProfile));
    this._upsertUserInCache(mapped);
    this._persistCurrentUser(mapped);
    return mapped;
  }

  async register(
    name: string,
    email: string,
    password: string,
    role: UserRole,
  ): Promise<User> {
    if (!supabase) {
      throw new Error(
        "Supabase não configurado. Define NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Registration failed");

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .upsert(
        {
          id: data.user.id,
          name,
          email,
          role,
          active: true,
        },
        { onConflict: "id" },
      )
      .select("*")
      .single();

    if (profileError) throw new Error(profileError.message);
    const mapped = this._touchTeamMetadata(this._mapDbUser(profile));
    this._upsertUserInCache(mapped);
    this._persistCurrentUser(mapped);
    return mapped;
  }

  async createAccount(input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    active?: boolean;
    teamId?: string;
    projectIds?: string[];
    company?: string;
    groupCode?: string;
  }): Promise<User> {
    const {
      name,
      email,
      password,
      role,
      active = true,
      teamId,
      projectIds,
      company,
      groupCode,
    } = input;

    if (!supabase) {
      throw new Error(
        "Supabase não configurado. Define NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
    }
    const db = supabase;

    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Account creation failed");

    const payload = {
      id: data.user.id,
      name,
      email,
      role,
      active,
      team_id: this._isUuid(teamId) ? teamId : null,
      project_ids: projectIds || [],
      company,
      group_code: groupCode,
    };

    const attempt = async (withoutProjectIds: boolean) => {
      const nextPayload = withoutProjectIds
        ? (() => {
            const { project_ids, ...rest } = payload;
            void project_ids;
            return rest;
          })()
        : payload;

      return db
        .from("users")
        .upsert(nextPayload, { onConflict: "id" })
        .select("*")
        .single();
    };

    let { data: profile, error: profileError } = await attempt(false);

    if (
      profileError &&
      this._isMissingColumnError(profileError.message, "project_ids")
    ) {
      const retry = await attempt(true);
      profile = retry.data;
      profileError = retry.error;
    }

    if (profileError) throw new Error(profileError.message);
    const mapped = this._touchTeamMetadata(this._mapDbUser(profile));
    this._upsertUserInCache(mapped);
    return mapped;
  }

  async logout(): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    if (typeof window === "undefined") return;
    localStorage.removeItem("estagio_current_user");
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    if (!supabase) {
      throw new Error(
        "Supabase não configurado. Define NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
    }
    const db = supabase;

    const payload = {
      name: updates.name,
      email: updates.email,
      role: updates.role,
      active: updates.active,
      team_id: updates.teamId
        ? this._isUuid(updates.teamId)
          ? updates.teamId
          : null
        : undefined,
      project_ids: updates.projectIds,
      company: updates.company,
      group_code: updates.groupCode,
    };

    const attempt = async (withoutProjectIds: boolean) => {
      const nextPayload = withoutProjectIds
        ? (() => {
            const { project_ids, ...rest } = payload;
            void project_ids;
            return rest;
          })()
        : payload;

      return db
        .from("users")
        .update(nextPayload)
        .eq("id", id)
        .select("*")
        .single();
    };

    let { data, error } = await attempt(false);

    if (error && this._isMissingColumnError(error.message, "project_ids")) {
      const retry = await attempt(true);
      data = retry.data;
      error = retry.error;
    }

    if (error) throw new Error(error.message);
    const mapped = this._touchTeamMetadata(this._mapDbUser(data));
    this._upsertUserInCache(mapped);

    const current = this.getCurrentUser();
    if (current?.id === id) this._persistCurrentUser(mapped);

    return mapped;
  }

  async toggleUserActive(id: string, active: boolean): Promise<User> {
    return this.updateUser(id, { active });
  }

  async assignUserTeam(
    id: string,
    team: Pick<Team, "id" | "name" | "company" | "groupCode"> | null,
  ): Promise<User> {
    return this.updateUser(id, {
      teamId: team?.id,
      teamName: team?.name,
      company: team?.company,
      groupCode: team?.groupCode,
    });
  }

  async assignUserProjects(id: string, projectIds: string[]): Promise<User> {
    return this.updateUser(id, { projectIds });
  }

  async resetPassword(id: string, password: string): Promise<User> {
    void id;
    void password;
    throw new Error(
      "A alteração de palavra-passe por admins requer chave service_role. Usa o script scripts/create-admin.mjs ou o painel Auth do Supabase.",
    );
  }

  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("estagio_current_user");
    if (stored) {
      const parsed = JSON.parse(stored) as User;
      if (!this._isUuid(parsed.id)) {
        localStorage.removeItem("estagio_current_user");
        return null;
      }
      return parsed;
    }
    return null;
  }

  getAll(): User[] {
    return this.users.map((user) => this._touchTeamMetadata(user));
  }

  getActive(): User[] {
    return this.getAll().filter((user) => user.active !== false);
  }

  getById(id: string): User | undefined {
    if (!this._isUuid(id)) return undefined;
    const user = this.users.find((u) => u.id === id);
    return user ? this._touchTeamMetadata(user) : undefined;
  }
}

export const authService = new AuthService();
