import type { Project, Team, User, UserRole } from "@/types";
import { supabase } from "./supabase";
import { teamService } from "./teamService";
import { projectService } from "./projectService";

const DEMO_USERS: User[] = [
  {
    id: "u1",
    name: "Administrador",
    email: "admin@estagio.pt",
    role: "admin",
    active: true,
  },
  {
    id: "u2",
    name: "Ana Ferreira",
    email: "ana@estagio.pt",
    role: "estagiario",
    active: true,
    teamId: "t1",
    teamName: "Produto Digital",
    company: "EstágioTrack",
    projectIds: ["p1", "p2"],
    groupCode: "GRP-2026-A",
  },
  {
    id: "u3",
    name: "Bruno Silva",
    email: "bruno@estagio.pt",
    role: "estagiario",
    active: true,
    teamId: "t2",
    teamName: "Data & Operações",
    company: "EstágioTrack",
    projectIds: ["p3"],
    groupCode: "GRP-2026-B",
  },
];

const DEMO_PASSWORDS: Record<string, string> = {
  "admin@estagio.pt": "admin123",
  "ana@estagio.pt": "ana123",
  "bruno@estagio.pt": "bruno123",
};

class AuthService {
  private users: User[] = [];

  constructor() {
    this._loadUsersFromStorage();
  }

  private _loadUsersFromStorage() {
    if (typeof window === "undefined") {
      this.users = DEMO_USERS;
      return;
    }

    const stored = localStorage.getItem("estagio_users");
    if (stored) {
      this.users = JSON.parse(stored).map((user: User) => ({
        active: true,
        ...user,
      }));
    } else {
      this.users = DEMO_USERS;
      this._saveUsersToStorage();
    }
  }

  private _saveUsersToStorage() {
    if (typeof window === "undefined") return;
    localStorage.setItem("estagio_users", JSON.stringify(this.users));
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

  private _findUserByEmail(email: string): User | undefined {
    return this.users.find((user) => user.email === email);
  }

  private _findDemoUserByEmail(email: string): User | undefined {
    return DEMO_USERS.find((user) => user.email === email);
  }

  private _persistDemoUserIfMissing(user: User) {
    if (this._findUserByEmail(user.email)) return;
    this.users.push(user);
    this._saveUsersToStorage();
  }

  async login(email: string, password: string): Promise<User> {
    const demoUser =
      this._findUserByEmail(email) || this._findDemoUserByEmail(email);
    const demoPassword = DEMO_PASSWORDS[email];

    if (demoUser && demoPassword === password) {
      this._persistDemoUserIfMissing(demoUser);

      if (demoUser.active === false) {
        throw new Error("Esta conta encontra-se desativada.");
      }

      const userWithoutPassword = this._touchTeamMetadata({ ...demoUser });
      delete userWithoutPassword.password;

      if (typeof window !== "undefined") {
        this._persistCurrentUser(userWithoutPassword);
      }

      return userWithoutPassword;
    }

    if (supabase) {
      // Use Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("Login failed");

      // Get user profile from database
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError) throw new Error(profileError.message);
      return profile;
    } else {
      // Demo mode
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const user = this.users.find((u) => u.email === email);
          if (!user) {
            reject(new Error("Email ou palavra-passe incorretos."));
            return;
          }
          if (user.active === false) {
            reject(new Error("Esta conta encontra-se desativada."));
            return;
          }
          const storedPassword = DEMO_PASSWORDS[email];
          if (storedPassword !== password) {
            reject(new Error("Email ou palavra-passe incorretos."));
            return;
          }
          const userWithoutPassword = this._touchTeamMetadata({ ...user });
          delete userWithoutPassword.password;
          if (typeof window === "undefined") {
            resolve(userWithoutPassword);
            return;
          }
          this._persistCurrentUser(userWithoutPassword);
          resolve(userWithoutPassword);
        }, 500);
      });
    }
  }

  async register(
    name: string,
    email: string,
    password: string,
    role: UserRole,
  ): Promise<User> {
    if (supabase) {
      // Use Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("Registration failed");

      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .insert({
          id: data.user.id,
          name,
          email,
          role,
          active: true,
        })
        .select()
        .single();

      if (profileError) throw new Error(profileError.message);
      return profile;
    } else {
      // Demo mode
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (this.users.find((u) => u.email === email)) {
            reject(new Error("Este email já está registado."));
            return;
          }
          if (password.length < 6) {
            reject(
              new Error("A palavra-passe deve ter pelo menos 6 caracteres."),
            );
            return;
          }
          const newUser: User = {
            id: "u" + Date.now(),
            name,
            email,
            role,
            active: true,
          };
          this.users.push(newUser);
          DEMO_PASSWORDS[email] = password;
          this._saveUsersToStorage();
          if (typeof window === "undefined") {
            resolve(newUser);
            return;
          }
          this._persistCurrentUser(newUser);
          resolve(newUser);
        }, 500);
      });
    }
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

    if (supabase) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("Account creation failed");

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .insert({
          id: data.user.id,
          name,
          email,
          role,
          active,
          team_id: teamId,
          project_ids: projectIds || [],
          company,
          group_code: groupCode,
        })
        .select()
        .single();

      if (profileError) throw new Error(profileError.message);
      return profile;
    }

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (this.users.some((user) => user.email === email)) {
          reject(new Error("Este email já está registado."));
          return;
        }

        if (password.length < 6) {
          reject(
            new Error("A palavra-passe deve ter pelo menos 6 caracteres."),
          );
          return;
        }

        const newUser: User = {
          id: `u${Date.now()}`,
          name,
          email,
          role,
          active,
          teamId,
          projectIds: projectIds || [],
          company,
          groupCode,
          temporaryPassword: password,
        };

        this.users.push(newUser);
        DEMO_PASSWORDS[email] = password;
        this._saveUsersToStorage();
        resolve(newUser);
      }, 300);
    });
  }

  async logout(): Promise<void> {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
    }
    if (typeof window === "undefined") return;
    localStorage.removeItem("estagio_current_user");
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    if (supabase) {
      const { data, error } = await supabase
        .from("users")
        .update({
          name: updates.name,
          email: updates.email,
          role: updates.role,
          active: updates.active,
          team_id: updates.teamId,
          project_ids: updates.projectIds,
          company: updates.company,
          group_code: updates.groupCode,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) throw new Error("Utilizador não encontrado.");

    const updated: User = {
      ...this.users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.users[index] = updated;
    this._saveUsersToStorage();

    const current = this.getCurrentUser();
    if (current?.id === id) {
      this._persistCurrentUser(updated);
    }

    return updated;
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
    const user = this.getById(id);
    if (!user) throw new Error("Utilizador não encontrado.");
    DEMO_PASSWORDS[user.email] = password;
    return this.updateUser(id, { temporaryPassword: password });
  }

  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("estagio_current_user");
    if (stored) {
      return JSON.parse(stored);
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
    const user = this.users.find((u) => u.id === id);
    return user ? this._touchTeamMetadata(user) : undefined;
  }
}

export const authService = new AuthService();
