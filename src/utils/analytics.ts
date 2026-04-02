import type {
  Activity,
  DifficultySignal,
  ProductivityPoint,
  Project,
  ProjectEffort,
  ReportInsight,
  SmartReport,
  User,
} from "@/types";
import {
  calculateHours,
  formatDate,
  formatHours,
  formatTimeRange,
  getTodayString,
} from "./helpers";

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HOUR_BUCKETS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

function toDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00`);
}

function getSortedActivities(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => {
    const dateDiff = a.date.localeCompare(b.date);
    if (dateDiff !== 0) return dateDiff;
    return a.startTime.localeCompare(b.startTime);
  });
}

function getWeekDates(referenceDate = new Date()): string[] {
  const date = new Date(referenceDate);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));

  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(monday);
    next.setDate(monday.getDate() + index);
    return toDateKey(next);
  });
}

function getMonthGrid(referenceDate = new Date()): Date[] {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + index);
    return current;
  });
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getDayLabel(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return `${DAY_LABELS[date.getDay()]} ${date.getDate()}/${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}`;
}

function formatShortTime(time: string): string {
  return time.slice(0, 5);
}

function countBy<T>(
  items: T[],
  selector: (item: T) => string,
): Record<string, number> {
  return items.reduce<Record<string, number>>((accumulator, item) => {
    const key = selector(item);
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}

function sumBy<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((total, item) => total + selector(item), 0);
}

export function getActivitiesForDate(
  activities: Activity[],
  dateKey: string,
): Activity[] {
  return getSortedActivities(
    activities.filter((activity) => activity.date === dateKey),
  );
}

export function getActivitiesForWeek(
  activities: Activity[],
  referenceDate = new Date(),
): Activity[] {
  const weekDates = getWeekDates(referenceDate);
  return getSortedActivities(
    activities.filter((activity) => weekDates.includes(activity.date)),
  );
}

export function getActivitiesForMonth(
  activities: Activity[],
  referenceDate = new Date(),
): Activity[] {
  const monthKey = getMonthKey(referenceDate);
  return getSortedActivities(
    activities.filter((activity) => activity.date.startsWith(monthKey)),
  );
}

export function getCalendarDates(
  view: "day" | "week" | "month",
  referenceDate = new Date(),
): Date[] {
  if (view === "day") return [new Date(referenceDate)];
  if (view === "week") {
    return getWeekDates(referenceDate).map((dateKey) => parseDateKey(dateKey));
  }
  return getMonthGrid(referenceDate);
}

export function buildSmartReport(params: {
  activities: Activity[];
  users: User[];
  projects: Project[];
  periodLabel?: string;
  referenceDate?: Date;
}): SmartReport {
  const {
    activities,
    users,
    projects,
    periodLabel,
    referenceDate = new Date(),
  } = params;
  const orderedActivities = getSortedActivities(activities);
  const totalHours = sumBy(orderedActivities, (activity) =>
    calculateHours(activity.startTime, activity.endTime),
  );
  const completedTasks = orderedActivities.filter(
    (activity) => activity.status === "concluido",
  ).length;
  const pendingTasks = orderedActivities.filter(
    (activity) => activity.status !== "concluido",
  ).length;

  const weekDates = getWeekDates(referenceDate);
  const dailyCounts = countBy(orderedActivities, (activity) => activity.date);
  const productiveDays = weekDates.map((dateKey) => ({
    label: DAY_LABELS[parseDateKey(dateKey).getDay()],
    hours: sumBy(
      orderedActivities.filter((activity) => activity.date === dateKey),
      (activity) => calculateHours(activity.startTime, activity.endTime),
    ),
    tasks: dailyCounts[dateKey] || 0,
  }));

  const hourlyCounts = HOUR_BUCKETS.map((hour) => {
    const nextHour = `${String(Number(hour.slice(0, 2)) + 1).padStart(2, "0")}:00`;
    const bucketActivities = orderedActivities.filter(
      (activity) => activity.startTime >= hour && activity.startTime < nextHour,
    );
    return {
      label: hour,
      hours: sumBy(bucketActivities, (activity) =>
        calculateHours(activity.startTime, activity.endTime),
      ),
      tasks: bucketActivities.length,
    } satisfies ProductivityPoint;
  });

  const projectTotals = projects.map((project) => {
    const projectActivities = orderedActivities.filter(
      (activity) =>
        activity.projectId === project.id ||
        activity.projectName === project.name,
    );
    const hours = sumBy(projectActivities, (activity) =>
      calculateHours(activity.startTime, activity.endTime),
    );
    return {
      projectId: project.id,
      projectName: project.name,
      hours,
      tasks: projectActivities.length,
      percentage: 0,
    } satisfies ProjectEffort;
  });

  const totalProjectHours = Math.max(
    sumBy(projectTotals, (item) => item.hours),
    1,
  );
  const projectEffort = projectTotals
    .map((item) => ({
      ...item,
      percentage: Math.round((item.hours / totalProjectHours) * 100),
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 6);

  const difficultySignals = detectDifficultySignals(
    orderedActivities,
    users,
    projects,
  );
  const insights = buildInsights({
    activities: orderedActivities,
    projects,
    totalHours,
    completedTasks,
    pendingTasks,
    difficultySignals,
  });

  const weeklyTotal = sumBy(
    orderedActivities.filter((activity) => weekDates.includes(activity.date)),
    (activity) => calculateHours(activity.startTime, activity.endTime),
  );

  const monthlyTotal = sumBy(
    orderedActivities.filter((activity) =>
      activity.date.startsWith(referenceDate.toISOString().slice(0, 7)),
    ),
    (activity) => calculateHours(activity.startTime, activity.endTime),
  );

  return {
    generatedAt: new Date().toISOString(),
    periodLabel: periodLabel || formatDate(referenceDate),
    summaryWeekly: `Na semana atual foram registadas ${formatHours(weeklyTotal)} em ${activities.filter((activity) => weekDates.includes(activity.date)).length} atividades.`,
    summaryMonthly: `No mês em análise há ${formatHours(monthlyTotal)} de trabalho distribuídas por ${new Set(activities.map((activity) => activity.date)).size} dias distintos.`,
    totalHours,
    completedTasks,
    pendingTasks,
    productivityByDay: productiveDays,
    productivityByHour: hourlyCounts,
    projectEffort,
    difficulties: difficultySignals,
    insights,
    suggestions: buildSuggestions({
      activities: orderedActivities,
      difficulties: difficultySignals,
      users,
      projects,
    }),
  };
}

export function detectDifficultySignals(
  activities: Activity[],
  users: User[] = [],
  projects: Project[] = [],
): DifficultySignal[] {
  const signals: DifficultySignal[] = [];
  const averageDuration =
    activities.length > 0
      ? sumBy(activities, (activity) =>
          calculateHours(activity.startTime, activity.endTime),
        ) / activities.length
      : 0;

  activities.forEach((activity) => {
    const duration = calculateHours(activity.startTime, activity.endTime);
    if (duration >= Math.max(averageDuration * 1.5, 5)) {
      signals.push({
        id: `duration-${activity.id}`,
        activityId: activity.id,
        userId: activity.userId,
        title: "Atividade acima do tempo habitual",
        description: `${activity.title} decorreu durante ${formatHours(duration)} (${formatTimeRange(activity.startTime, activity.endTime)}).`,
        severity: duration >= 6 ? "high" : "medium",
        category: "duration",
      });
    }

    if (activity.status === "pendente") {
      signals.push({
        id: `pending-${activity.id}`,
        activityId: activity.id,
        userId: activity.userId,
        title: "Tarefa por concluir",
        description: `${activity.title} continua em aberto desde ${activity.date}.`,
        severity: "medium",
        category: "status",
      });
    }

    if (Number(activity.startTime.slice(0, 2)) >= 11) {
      signals.push({
        id: `delay-${activity.id}`,
        activityId: activity.id,
        userId: activity.userId,
        title: "Início tardio registado",
        description: `${activity.title} começou às ${activity.startTime}, acima da janela ideal para acompanhamento diário.`,
        severity: "low",
        category: "timing",
      });
    }
  });

  const projectActivityCount = countBy(
    activities,
    (activity) => activity.projectId || activity.projectName || activity.title,
  );
  Object.entries(projectActivityCount).forEach(([projectKey, count]) => {
    const projectHours = sumBy(
      activities.filter(
        (activity) =>
          (activity.projectId && activity.projectId === projectKey) ||
          activity.projectName === projectKey ||
          activity.title === projectKey,
      ),
      (activity) => calculateHours(activity.startTime, activity.endTime),
    );
    if (count >= 4 && projectHours <= 8) {
      const project = projects.find(
        (item) => item.id === projectKey || item.name === projectKey,
      );
      signals.push({
        id: `project-${projectKey}`,
        title: "Projeto com baixa conversão de horas",
        description: `${project?.name || projectKey} tem ${count} atividades mas apenas ${formatHours(projectHours)} registadas.`,
        severity: "medium",
        category: "project",
      });
    }
  });

  const userCounts = countBy(activities, (activity) => activity.userId);
  Object.entries(userCounts).forEach(([userId, count]) => {
    const user = users.find((item) => item.id === userId);
    const userActivities = activities.filter(
      (activity) => activity.userId === userId,
    );
    const pending = userActivities.filter(
      (activity) => activity.status === "pendente",
    ).length;
    if (count >= 6 && pending >= Math.ceil(count / 2)) {
      signals.push({
        id: `user-${userId}`,
        userId,
        title: "Dificuldade operacional recorrente",
        description: `${user?.name || "O utilizador"} tem ${pending} tarefas pendentes em ${count} registos analisados.`,
        severity: "high",
        category: "user",
      });
    }
  });

  return signals.slice(0, 12);
}

function buildInsights(params: {
  activities: Activity[];
  projects: Project[];
  totalHours: number;
  completedTasks: number;
  pendingTasks: number;
  difficultySignals: DifficultySignal[];
}): ReportInsight[] {
  const {
    activities,
    projects,
    totalHours,
    completedTasks,
    pendingTasks,
    difficultySignals,
  } = params;
  const activeUsers = new Set(activities.map((activity) => activity.userId))
    .size;
  const completionRate =
    activities.length > 0
      ? Math.round((completedTasks / activities.length) * 100)
      : 0;
  const topProject = projectWithMostHours(activities, projects);
  const busiestDay = getBusiestDay(activities);

  return [
    {
      id: "overview",
      title: "Resumo operativo",
      description: `${activities.length} atividades analisadas, ${formatHours(totalHours)} no total e ${activeUsers} utilizadores ativos no período.`,
      level: "info",
      value: `${completionRate}% concluído`,
    },
    {
      id: "productivity",
      title: "Tendência de produtividade",
      description: busiestDay
        ? `O dia mais forte foi ${busiestDay.label}, com ${formatHours(busiestDay.hours)} registadas.`
        : "Ainda não há dados suficientes para avaliar o ritmo diário.",
      level: completionRate >= 70 ? "success" : "warning",
      value: busiestDay ? busiestDay.label : "Sem pico",
    },
    {
      id: "projects",
      title: "Maior investimento",
      description: topProject
        ? `${topProject.projectName} concentrou ${formatHours(topProject.hours)} em ${topProject.tasks} tarefas.`
        : "Sem projetos associados aos registos atuais.",
      level: "info",
      value: topProject ? topProject.projectName : "N/A",
    },
    {
      id: "risks",
      title: "Risco operacional",
      description: `${pendingTasks} tarefas continuam por concluir e foram detetados ${difficultySignals.length} sinais de atenção.`,
      level: pendingTasks > completedTasks ? "critical" : "warning",
      value: `${pendingTasks} pendentes`,
    },
  ];
}

function projectWithMostHours(
  activities: Activity[],
  projects: Project[],
): ProjectEffort | null {
  const totals = projects.map((project) => {
    const projectActivities = activities.filter(
      (activity) =>
        activity.projectId === project.id ||
        activity.projectName === project.name,
    );
    return {
      projectId: project.id,
      projectName: project.name,
      hours: sumBy(projectActivities, (activity) =>
        calculateHours(activity.startTime, activity.endTime),
      ),
      tasks: projectActivities.length,
      percentage: 0,
    } satisfies ProjectEffort;
  });
  const top = totals.sort((a, b) => b.hours - a.hours)[0];
  return top && top.hours > 0 ? top : null;
}

function getBusiestDay(activities: Activity[]): ProductivityPoint | null {
  const grouped = activities.reduce<Record<string, ProductivityPoint>>(
    (accumulator, activity) => {
      const current = accumulator[activity.date] || {
        label: activity.date,
        hours: 0,
        tasks: 0,
      };
      current.hours += calculateHours(activity.startTime, activity.endTime);
      current.tasks += 1;
      accumulator[activity.date] = current;
      return accumulator;
    },
    {},
  );

  const values = Object.values(grouped).sort((a, b) => b.hours - a.hours);
  return values[0] || null;
}

function buildSuggestions(params: {
  activities: Activity[];
  difficulties: DifficultySignal[];
  users: User[];
  projects: Project[];
}): string[] {
  const { activities, difficulties, users, projects } = params;
  const suggestions = new Set<string>();

  if (activities.length === 0) {
    suggestions.add(
      "Inicie o registo diário para libertar relatórios mais precisos e comparáveis.",
    );
  }

  if (difficulties.some((item) => item.category === "status")) {
    suggestions.add(
      "Revise as tarefas em curso e aplique uma rotina de fecho no fim do dia.",
    );
  }

  const userActivityCounts = countBy(activities, (activity) => activity.userId);
  if (Object.values(userActivityCounts).some((count) => count > 5)) {
    suggestions.add(
      "Distribua tarefas longas em blocos menores para reduzir variações de duração.",
    );
  }

  if (projects.length > 0) {
    suggestions.add(
      "Associe todas as atividades a projetos para reforçar a leitura de produtividade por contexto.",
    );
  }

  if (users.filter((user) => user.role === "estagiario").length > 3) {
    suggestions.add(
      "Use a visão de equipa para comparar ritmos, atrasos e necessidade de apoio entre estagiários.",
    );
  }

  if (!suggestions.size) {
    suggestions.add(
      "Continue a monitorizar o padrão semanal para identificar picos de produtividade e bloqueios recorrentes.",
    );
  }

  return Array.from(suggestions).slice(0, 5);
}

export function getCalendarLabel(
  view: "day" | "week" | "month",
  referenceDate = new Date(),
): string {
  if (view === "day") return formatDate(referenceDate);
  if (view === "week") {
    const weekDates = getWeekDates(referenceDate);
    return `${getDayLabel(weekDates[0])} - ${getDayLabel(weekDates[6])}`;
  }
  return referenceDate.toLocaleDateString("pt-PT", {
    month: "long",
    year: "numeric",
  });
}

export function getCalendarActivityLabel(activity: Activity): string {
  return `${formatShortTime(activity.startTime)} - ${formatShortTime(activity.endTime)}`;
}

export function getMonthCalendar(referenceDate = new Date()): Date[] {
  return getMonthGrid(referenceDate);
}

export function isSameCalendarMonth(
  date: Date,
  referenceDate = new Date(),
): boolean {
  return (
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth()
  );
}

export function isToday(dateKey: string): boolean {
  return dateKey === getTodayString();
}
