import type { Project, User, UserRole } from "@/types";
import { supabase } from "./supabase";
import { teamService } from "./teamService";
import { projectService } from "./projectService";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class AuthService {
  private users: User[] = [];

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
    } else {
      this.users[index] = user;
    }
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
    avatar_url?: string | null;
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
      avatarUrl: profile.avatar_url || undefined,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  }

  async loadAll(): Promise<User[]> {
    if (!supabase) return [];

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
      throw new Error("Supabase não configurado.");
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

  async logout(): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);

    localStorage.removeItem("estagio_current_user");
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    if (!supabase) throw new Error("Supabase não configurado.");

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
      avatar_url: updates.avatarUrl,
    };

    const { data, error } = await supabase
      .from("users")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    const mapped = this._touchTeamMetadata(this._mapDbUser(data));
    this._upsertUserInCache(mapped);

    const current = this.getCurrentUser();
    if (current?.id === id) this._persistCurrentUser(mapped);

    return mapped;
  }

  async uploadAvatar(file: File, userId: string): Promise<string> {
    if (!supabase) throw new Error("Supabase não configurado.");

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${userId}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error("Erro ao obter URL da imagem.");
    }

    return data.publicUrl;
  }

  async updateAvatar(userId: string, file: File): Promise<User> {
    const avatarUrl = await this.uploadAvatar(file, userId);
    return this.updateUser(userId, { avatarUrl });
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    if (!supabase) throw new Error("Supabase não configurado.");

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/update-password`
        : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) throw new Error(error.message);
  }

  async updateMyPassword(newPassword: string): Promise<void> {
    if (!supabase) throw new Error("Supabase não configurado.");

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw new Error(error.message);
  }

  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;

    const stored = localStorage.getItem("estagio_current_user");
    if (!stored) return null;

    const parsed = JSON.parse(stored) as User;

    if (!this._isUuid(parsed.id)) {
      localStorage.removeItem("estagio_current_user");
      return null;
    }

    return parsed;
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
