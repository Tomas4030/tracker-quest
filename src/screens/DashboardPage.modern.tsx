"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  ActivityItem,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Pagination,
  StatCard,
  Topbar,
} from "@/components";
import { useAppStore } from "@/store";
import { authService, projectService } from "@/services";
import type { Project, User } from "@/types";
import { buildSmartReport } from "@/utils/analytics";
import {
  calculateHours,
  formatDate,
  formatHours,
  getWeekDates,
} from "@/utils/helpers";

export const DashboardPage: React.FC = () => {
  const { user, activities, loadActivities } = useAppStore();
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentActivitiesPage, setRecentActivitiesPage] = useState(1);
  const [difficultiesPage, setDifficultiesPage] = useState(1);

  // altura fixa final dos dois cards
  const [sharedCardsHeight, setSharedCardsHeight] = useState<number>(700);

  // refs das páginas ocultas usadas para medir
  const hiddenRecentPagesRef = useRef<HTMLDivElement | null>(null);
  const hiddenDifficultiesPagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadContext = async () => {
      await loadActivities(user.role === "admin" ? undefined : user.id);

      const [loadedUsers, loadedProjects] = await Promise.all([
        authService.loadAll(),
        projectService.loadAll(),
      ]);

      setUsers(loadedUsers);
      setProjects(loadedProjects);
    };

    loadContext().catch(() => {
      setUsers([]);
      setProjects([]);
    });
  }, [user, loadActivities]);

  const scopedActivities = useMemo(() => {
    if (!user) return [];

    return user.role === "admin"
      ? activities
      : activities.filter((activity) => activity.userId === user.id);
  }, [activities, user]);

  const report = useMemo(() => {
    if (!user) {
      return buildSmartReport({ activities: [], users: [], projects: [] });
    }

    return buildSmartReport({
      activities: scopedActivities,
      users:
        user.role === "admin"
          ? users
          : users.filter((item) => item.id === user.id),
      projects,
      periodLabel: "Painel atual",
    });
  }, [projects, scopedActivities, user, users]);

  const weekDates = getWeekDates();
  const today = new Date().toISOString().split("T")[0];

  const allRecentActivities = useMemo(() => {
    return [...scopedActivities].sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime),
    );
  }, [scopedActivities]);

  const RECENT_ACTIVITIES_PER_PAGE = 4;
  const DIFFICULTIES_PER_PAGE = 4;

  const totalRecentActivityPages = Math.ceil(
    allRecentActivities.length / RECENT_ACTIVITIES_PER_PAGE,
  );

  const totalDifficultiesPages = Math.ceil(
    report.difficulties.length / DIFFICULTIES_PER_PAGE,
  );

  const recentActivities = allRecentActivities.slice(
    (recentActivitiesPage - 1) * RECENT_ACTIVITIES_PER_PAGE,
    recentActivitiesPage * RECENT_ACTIVITIES_PER_PAGE,
  );

  const paginatedDifficulties = report.difficulties.slice(
    (difficultiesPage - 1) * DIFFICULTIES_PER_PAGE,
    difficultiesPage * DIFFICULTIES_PER_PAGE,
  );

  const allRecentPages = useMemo(() => {
    return Array.from({ length: totalRecentActivityPages }, (_, index) =>
      allRecentActivities.slice(
        index * RECENT_ACTIVITIES_PER_PAGE,
        (index + 1) * RECENT_ACTIVITIES_PER_PAGE,
      ),
    );
  }, [allRecentActivities, totalRecentActivityPages]);

  const allDifficultyPages = useMemo(() => {
    return Array.from({ length: totalDifficultiesPages }, (_, index) =>
      report.difficulties.slice(
        index * DIFFICULTIES_PER_PAGE,
        (index + 1) * DIFFICULTIES_PER_PAGE,
      ),
    );
  }, [report.difficulties, totalDifficultiesPages]);

  const todayHours = scopedActivities
    .filter((activity) => activity.date === today)
    .reduce(
      (sum, activity) =>
        sum + calculateHours(activity.startTime, activity.endTime),
      0,
    );

  const weekHours = scopedActivities
    .filter((activity) => weekDates.includes(activity.date))
    .reduce(
      (sum, activity) =>
        sum + calculateHours(activity.startTime, activity.endTime),
      0,
    );

  const completionRate =
    scopedActivities.length > 0
      ? Math.round((report.completedTasks / scopedActivities.length) * 100)
      : 0;

  const activeInterns = users.filter(
    (item) => item.role === "estagiario" && item.active !== false,
  ).length;

  const cards =
    user?.role === "admin"
      ? [
          {
            icon: "👥",
            label: "Estagiários ativos",
            value: `${activeInterns}`,
          },
          {
            icon: "⏱",
            label: "Horas esta semana",
            value: formatHours(weekHours),
          },
          {
            icon: "📋",
            label: "Atividades visíveis",
            value: `${scopedActivities.length}`,
          },
          {
            icon: "✅",
            label: "Taxa de conclusão",
            value: `${completionRate}%`,
          },
        ]
      : [
          { icon: "⏱", label: "Horas hoje", value: formatHours(todayHours) },
          {
            icon: "📅",
            label: "Horas esta semana",
            value: formatHours(weekHours),
          },
          {
            icon: "📋",
            label: "Tarefas pessoais",
            value: `${scopedActivities.length}`,
          },
          {
            icon: "✅",
            label: "Taxa de conclusão",
            value: `${completionRate}%`,
          },
        ];

  useLayoutEffect(() => {
    const measureAllPages = () => {
      let maxHeight = 700;

      if (hiddenRecentPagesRef.current) {
        const recentPageNodes =
          hiddenRecentPagesRef.current.querySelectorAll("[data-page-height]");
        recentPageNodes.forEach((node) => {
          const el = node as HTMLDivElement;
          maxHeight = Math.max(maxHeight, el.scrollHeight);
        });
      }

      if (hiddenDifficultiesPagesRef.current) {
        const difficultyPageNodes =
          hiddenDifficultiesPagesRef.current.querySelectorAll(
            "[data-page-height]",
          );
        difficultyPageNodes.forEach((node) => {
          const el = node as HTMLDivElement;
          maxHeight = Math.max(maxHeight, el.scrollHeight);
        });
      }

      setSharedCardsHeight(maxHeight);
    };

    const frame = requestAnimationFrame(measureAllPages);
    window.addEventListener("resize", measureAllPages);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measureAllPages);
    };
  }, [allRecentPages, allDifficultyPages, users]);

  if (!user) return null;

  return (
    <>
      <Topbar title="Dashboard" date={formatDate(new Date())} />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-navy via-slate-900 to-primary-700 text-white shadow-lg">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.7fr] lg:p-8">
            <div className="space-y-5">
              <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-white/80">
                {user.role === "admin"
                  ? "Painel de supervisão"
                  : "Espaço de trabalho diário"}
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {user.role === "admin"
                    ? "Visão global da equipa"
                    : `Olá, ${user.name.split(" ")[0]}`}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
                  {user.role === "admin"
                    ? "Acompanhe o progresso, identifique bloqueios e intervenha mais cedo com base em dados reais."
                    : "Regista o teu trabalho diário, acompanha a tua produtividade e consulta sinais de evolução de forma rápida."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/calendar"
                  className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
                >
                  Abrir calendário
                </Link>

                <Link
                  href="/activities"
                  className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-navy transition hover:bg-slate-100"
                >
                  Ver atividades
                </Link>
              </div>
            </div>

            <div className="grid gap-3 rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/60">
                  Concluídas
                </div>
                <div className="mt-2 text-3xl font-semibold">
                  {report.completedTasks}
                </div>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/60">
                  Horas totais
                </div>
                <div className="mt-2 text-3xl font-semibold">
                  {formatHours(report.totalHours)}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <StatCard
              key={card.label}
              icon={card.icon}
              label={card.label}
              value={card.value}
            />
          ))}
        </section>

        <section>
          <Card className="flex min-h-[300px] flex-col align-center justify-center">
            <CardHeader className="flex items-center justify-between gap-3">
              <CardTitle>Produtividade semanal</CardTitle>
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                {report.periodLabel}
              </span>
            </CardHeader>

            <CardBody>
              <div className="grid grid-cols-7 gap-3">
                {report.productivityByDay.map((point) => {
                  const percentage = Math.min(
                    100,
                    Math.round((point.hours / 8) * 100),
                  );

                  return (
                    <div
                      key={point.label}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="text-xs font-medium text-slate-600">
                        {point.label}
                      </div>

                      <div className="flex h-32 w-full items-end overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                        <div
                          className="w-full rounded-t-2xl bg-gradient-to-t from-primary-500 to-primary-300 transition-all"
                          style={{ height: `${Math.max(8, percentage)}%` }}
                        />
                      </div>

                      <div className="text-[11px] font-mono text-slate-500">
                        {point.hours > 0 ? formatHours(point.hours) : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div
            className="flex w-full"
            style={{ height: `${sharedCardsHeight}px` }}
          >
            <Card className="flex h-full w-full flex-col overflow-hidden">
              <CardHeader className="flex items-center justify-between gap-3">
                <CardTitle>Atividades recentes</CardTitle>
                <Link
                  href="/calendar"
                  className="text-sm font-medium text-primary-600 hover:underline"
                >
                  Ver calendário
                </Link>
              </CardHeader>

              <CardBody className="flex flex-1 flex-col overflow-hidden p-0">
                {recentActivities.length === 0 ? (
                  <div className="flex flex-1 items-center p-6">
                    <EmptyState
                      title="Sem atividades"
                      description="Começa a registar tarefas para preencher o dashboard com dados úteis."
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-1 flex-col pr-1">
                      {recentActivities.map((activity) => {
                        const actUser = users.find(
                          (item) => item.id === activity.userId,
                        );

                        return (
                          <ActivityItem
                            key={activity.id}
                            activity={activity}
                            showUser={user.role === "admin"}
                            userName={actUser?.name}
                          />
                        );
                      })}
                    </div>

                    {totalRecentActivityPages > 1 && (
                      <div className="mt-auto shrink-0 border-t border-slate-200 p-4">
                        <Pagination
                          currentPage={recentActivitiesPage}
                          totalPages={totalRecentActivityPages}
                          onPageChange={setRecentActivitiesPage}
                          className="justify-center"
                        />
                      </div>
                    )}
                  </>
                )}
              </CardBody>
            </Card>
          </div>

          <div
            className="flex w-full"
            style={{ height: `${sharedCardsHeight}px` }}
          >
            <Card className="flex h-full w-full flex-col overflow-hidden">
              <CardHeader className="shrink-0">
                <CardTitle>Sinais de dificuldade</CardTitle>
              </CardHeader>

              <CardBody className="flex flex-1 flex-col overflow-hidden">
                {report.difficulties.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                    Nenhum sinal de dificuldade detetado no período atual.
                  </div>
                ) : (
                  <>
                    <div className="flex flex-1 flex-col space-y-3 pr-1">
                      {paginatedDifficulties.map((signal) => (
                        <div
                          key={signal.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold text-navy">
                              {signal.title}
                            </div>

                            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                              {signal.severity}
                            </div>
                          </div>

                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {signal.description}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto shrink-0 border-t border-slate-200 pt-4">
                      {totalDifficultiesPages > 1 && (
                        <Pagination
                          currentPage={difficultiesPage}
                          totalPages={totalDifficultiesPages}
                          onPageChange={setDifficultiesPage}
                          className="justify-center"
                        />
                      )}
                    </div>
                  </>
                )}
              </CardBody>
            </Card>
          </div>
        </section>
      </div>

      {/* área invisível só para medir todas as páginas */}
      <div className="pointer-events-none absolute left-0 top-0 -z-10 opacity-0">
        <div className="grid w-[calc(100vw-4rem)] max-w-[1400px] gap-6 xl:grid-cols-2">
          <div ref={hiddenRecentPagesRef}>
            {allRecentPages.length === 0 ? (
              <div data-page-height className="w-full">
                <Card className="flex flex-col overflow-hidden">
                  <CardHeader className="flex items-center justify-between gap-3">
                    <CardTitle>Atividades recentes</CardTitle>
                  </CardHeader>
                  <CardBody className="flex flex-col p-0">
                    <div className="flex flex-1 items-center p-6">
                      <EmptyState
                        title="Sem atividades"
                        description="Começa a registar tarefas para preencher o dashboard com dados úteis."
                      />
                    </div>
                  </CardBody>
                </Card>
              </div>
            ) : (
              allRecentPages.map((page, pageIndex) => (
                <div
                  key={`recent-measure-${pageIndex}`}
                  data-page-height
                  className="mb-6 w-full"
                >
                  <Card className="flex flex-col overflow-hidden">
                    <CardHeader className="flex items-center justify-between gap-3">
                      <CardTitle>Atividades recentes</CardTitle>
                    </CardHeader>

                    <CardBody className="flex flex-col p-0">
                      <div className="flex flex-col pr-1">
                        {page.map((activity) => {
                          const actUser = users.find(
                            (item) => item.id === activity.userId,
                          );

                          return (
                            <ActivityItem
                              key={activity.id}
                              activity={activity}
                              showUser={user.role === "admin"}
                              userName={actUser?.name}
                            />
                          );
                        })}
                      </div>

                      {totalRecentActivityPages > 1 && (
                        <div className="mt-auto shrink-0 border-t border-slate-200 p-4">
                          <Pagination
                            currentPage={pageIndex + 1}
                            totalPages={totalRecentActivityPages}
                            onPageChange={() => {}}
                            className="justify-center"
                          />
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </div>
              ))
            )}
          </div>

          <div ref={hiddenDifficultiesPagesRef}>
            {allDifficultyPages.length === 0 ? (
              <div data-page-height className="w-full">
                <Card className="flex flex-col overflow-hidden">
                  <CardHeader className="shrink-0">
                    <CardTitle>Sinais de dificuldade</CardTitle>
                  </CardHeader>
                  <CardBody className="flex flex-col">
                    <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                      Nenhum sinal de dificuldade detetado no período atual.
                    </div>
                  </CardBody>
                </Card>
              </div>
            ) : (
              allDifficultyPages.map((page, pageIndex) => (
                <div
                  key={`difficulty-measure-${pageIndex}`}
                  data-page-height
                  className="mb-6 w-full"
                >
                  <Card className="flex flex-col overflow-hidden">
                    <CardHeader className="shrink-0">
                      <CardTitle>Sinais de dificuldade</CardTitle>
                    </CardHeader>

                    <CardBody className="flex flex-col">
                      <div className="flex flex-col space-y-3 pr-1">
                        {page.map((signal) => (
                          <div
                            key={signal.id}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-semibold text-navy">
                                {signal.title}
                              </div>

                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                {signal.severity}
                              </div>
                            </div>

                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {signal.description}
                            </p>
                          </div>
                        ))}
                      </div>

                      {totalDifficultiesPages > 1 && (
                        <div className="mt-auto shrink-0 border-t border-slate-200 pt-4">
                          <Pagination
                            currentPage={pageIndex + 1}
                            totalPages={totalDifficultiesPages}
                            onPageChange={() => {}}
                            className="justify-center"
                          />
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
