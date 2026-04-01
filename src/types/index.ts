/**
 * User Type
 */
export type UserRole = "admin" | "estagiario";

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Activity Type
 */
export type ActivityStatus = "em-curso" | "concluido" | "pendente";

export interface Activity {
  id: string;
  userId: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: ActivityStatus;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Auth Context
 */
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
  ) => Promise<void>;
  logout: () => void;
}

/**
 * API Response
 */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

/**
 * Pagination
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Filter
 */
export interface ActivityFilter {
  userId?: string;
  date?: string;
  status?: ActivityStatus;
  search?: string;
}
