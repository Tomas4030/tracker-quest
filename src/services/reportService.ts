import type { ReportRequestPayload, SmartReport } from "@/types";
import { activityService } from "./activityService";
import { authService } from "./authService";
import { projectService } from "./projectService";
import { buildSmartReport } from "@/utils/analytics";

async function getLocalPayload(
  payload: Pick<ReportRequestPayload, "scope" | "userId" | "teamId" | "period">,
): Promise<ReportRequestPayload> {
  const activities = await activityService.getAll();
  const users = authService.getAll();
  const projects = projectService.getAll();

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

  return {
    ...payload,
    generatedAt: new Date().toISOString(),
    activities: scopedActivities,
    users: scopedUsers,
    projects,
  };
}

class ReportService {
  async generate(payload: {
    scope: "user" | "team" | "admin";
    userId?: string;
    teamId?: string;
    period: "week" | "month" | "all";
  }): Promise<SmartReport> {
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
