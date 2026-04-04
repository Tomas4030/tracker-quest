import type { ReportRequestPayload, SmartReport } from "@/types";
import { activityService } from "./activityService";
import { authService } from "./authService";
import { projectService } from "./projectService";
import { buildSmartReport } from "@/utils/analytics";

type ReportScope = "user" | "team" | "admin";
type ReportPeriod = "week" | "month" | "all";

interface GeneratePayload {
  scope: ReportScope;
  userId?: string;
  teamId?: string;
  period: ReportPeriod;
}

interface ReportStats {
  totalHours: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
}

function getActivityHours(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMinute) ||
    Number.isNaN(endHour) ||
    Number.isNaN(endMinute)
  ) {
    return 0;
  }

  const startInMinutes = startHour * 60 + startMinute;
  const endInMinutes = endHour * 60 + endMinute;
  const diffInMinutes = endInMinutes - startInMinutes;

  return diffInMinutes > 0 ? diffInMinutes / 60 : 0;
}

async function getLocalPayload(
  payload: Pick<ReportRequestPayload, "scope" | "userId" | "teamId" | "period">,
): Promise<ReportRequestPayload> {
  const activities = await activityService.getAll();
  const users = await authService.loadAll();
  const projects = await projectService.loadAll();

  let scopedActivities = activities;
  let scopedUsers = users;

  if (payload.scope === "user" && payload.userId) {
    scopedActivities = activities.filter(
      (activity) => activity.userId === payload.userId,
    );
    scopedUsers = users.filter((user) => user.id === payload.userId);
  }

  if (payload.scope === "team" && payload.teamId) {
    scopedUsers = users.filter((user) => user.teamId === payload.teamId);
    const userIds = new Set(scopedUsers.map((user) => user.id));
    scopedActivities = activities.filter((activity) =>
      userIds.has(activity.userId),
    );
  }

  if (payload.period !== "all") {
    const now = new Date();
    const cutoff = new Date(now);

    if (payload.period === "week") {
      cutoff.setDate(cutoff.getDate() - 7);
    } else if (payload.period === "month") {
      cutoff.setMonth(cutoff.getMonth() - 1);
    }

    scopedActivities = scopedActivities.filter(
      (activity) => new Date(activity.date) >= cutoff,
    );
  }

  return {
    ...payload,
    generatedAt: new Date().toISOString(),
    activities: scopedActivities,
    users: scopedUsers,
    projects,
  };
}

class ReportService {
  async getStats(payload: GeneratePayload): Promise<ReportStats> {
    const requestPayload = await getLocalPayload(payload);

    const totalHours = requestPayload.activities.reduce((sum, activity) => {
      return (
        sum +
        getActivityHours(
          formatTime(activity.startTime),
          formatTime(activity.endTime),
        )
      );
    }, 0);

    const completedTasks = requestPayload.activities.filter(
      (activity) => activity.status === "concluido",
    ).length;

    const pendingTasks = requestPayload.activities.filter(
      (activity) =>
        activity.status === "pendente" || activity.status === "em-curso",
    ).length;

    const totalTasks = completedTasks + pendingTasks;

    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalHours,
      completedTasks,
      pendingTasks,
      completionRate,
    };
  }

  async generate(payload: GeneratePayload): Promise<SmartReport> {
    const requestPayload = await getLocalPayload(payload);

    try {
      const response = await fetch("/api/reports/group", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      if (response.ok) {
        const data = (await response.json()) as SmartReport;
        if (data && Array.isArray(data.insights)) {
          return data;
        }
      }
    } catch {
      // fallback below
    }

    return buildSmartReport({
      activities: requestPayload.activities,
      users: requestPayload.users,
      projects: requestPayload.projects,
      periodLabel: `${requestPayload.scope} · ${requestPayload.period}`,
    });
  }
}

export const reportService = new ReportService();
