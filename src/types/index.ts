/**
 * User Type
 */
export type UserRole = string;

export type AccountStatus = "active" | "inactive";

export interface Team {
  id: string;
  name: string;
  company: string;
  groupCode: string;
  memberIds: string[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  teamId?: string;
  color: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  active?: boolean;
  teamId?: string;
  teamName?: string;
  company?: string;
  projectIds?: string[];
  temporaryPassword?: string;
  groupCode?: string;
  avatarUrl?: string;
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
  projectId?: string;
  projectName?: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: ActivityStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type CalendarViewMode = "day" | "week" | "month";

export type InsightLevel = "info" | "success" | "warning" | "critical";

export interface ReportInsight {
  id: string;
  title: string;
  description: string;
  level: InsightLevel;
  value?: string;
}

export interface DifficultySignal {
  id: string;
  userId?: string;
  activityId?: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  category: string;
}

export interface ProductivityPoint {
  label: string;
  hours: number;
  tasks: number;
}

export interface ProjectEffort {
  projectId: string;
  projectName: string;
  hours: number;
  tasks: number;
  percentage: number;
}

export interface SmartReport {
  generatedAt: string;
  periodLabel: string;
  summaryWeekly: string;
  summaryMonthly: string;
  totalHours: number;
  completedTasks: number;
  pendingTasks: number;
  productivityByDay: ProductivityPoint[];
  productivityByHour: ProductivityPoint[];
  projectEffort: ProjectEffort[];
  difficulties: DifficultySignal[];
  insights: ReportInsight[];
  suggestions: string[];
}

export interface ReportRequestPayload {
  scope: "user" | "team" | "admin";
  userId?: string;
  teamId?: string;
  period: "week" | "month" | "all";
  generatedAt: string;
  activities: Activity[];
  users: User[];
  projects: Project[];
}

/**
 * Auth Context
 */
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
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
  projectId?: string;
  date?: string;
  status?: ActivityStatus;
  search?: string;
}
