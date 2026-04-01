import type { User, UserRole } from "@/types";
import { supabase } from "./supabase";

const DEMO_USERS: User[] = [
  { id: "u1", name: "Administrador", email: "admin@estagio.pt", role: "admin" },
  {
    id: "u2",
    name: "Ana Ferreira",
    email: "ana@estagio.pt",
    role: "estagiario",
  },
  {
    id: "u3",
    name: "Bruno Silva",
    email: "bruno@estagio.pt",
    role: "estagiario",
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
      this.users = JSON.parse(stored);
    } else {
      this.users = DEMO_USERS;
      this._saveUsersToStorage();
    }
  }

  private _saveUsersToStorage() {
    if (typeof window === "undefined") return;
    localStorage.setItem("estagio_users", JSON.stringify(this.users));
  }

  async login(email: string, password: string): Promise<User> {
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
          const storedPassword = DEMO_PASSWORDS[email];
          if (storedPassword !== password) {
            reject(new Error("Email ou palavra-passe incorretos."));
            return;
          }
          const userWithoutPassword = { ...user };
          delete userWithoutPassword.password;
          if (typeof window === "undefined") {
            resolve(userWithoutPassword);
            return;
          }
          localStorage.setItem(
            "estagio_current_user",
            JSON.stringify(userWithoutPassword),
          );
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
          };
          this.users.push(newUser);
          DEMO_PASSWORDS[email] = password;
          this._saveUsersToStorage();
          if (typeof window === "undefined") {
            resolve(newUser);
            return;
          }
          localStorage.setItem("estagio_current_user", JSON.stringify(newUser));
          resolve(newUser);
        }, 500);
      });
    }
  }

  async logout(): Promise<void> {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
    }
    if (typeof window === "undefined") return;
    localStorage.removeItem("estagio_current_user");
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
    return this.users;
  }

  getById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }
}

export const authService = new AuthService();
