"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Activity, CalendarViewMode, Project, User } from "@/types";
import {
  getActivitiesForDate,
  getActivitiesForMonth,
  getActivitiesForWeek,
  getCalendarActivityLabel,
  getCalendarDates,
  getCalendarLabel,
  isSameCalendarMonth,
  isToday,
} from "@/utils/analytics";
import { formatHours, calculateHours, getStatusLabel } from "@/utils/helpers";
import { Badge, Button } from ".";

interface CalendarBoardProps {
  view: CalendarViewMode;
  referenceDate: Date;
  activities: Activity[];
  users: User[];
  projects: Project[];
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onSelectActivity?: (activity: Activity) => void;
  onSelectDate?: (dateKey: string) => void;
  onCreateActivity?: (dateKey: string) => void;
}

function getProjectColor(activity: Activity, projects: Project[]): string {
  const project = projects.find(
    (item) =>
      item.id === activity.projectId || item.name === activity.projectName,
  );
  return project?.color || "#1a56db";
}

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getDayTitle(date: Date): string {
  return date.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export const CalendarBoard: React.FC<CalendarBoardProps> = ({
  view,
  referenceDate,
  activities,
  users,
  projects,
  onPrevious,
  onNext,
  onToday,
  onSelectActivity,
  onSelectDate,
  onCreateActivity,
}) => {
  const dates = getCalendarDates(view, referenceDate);
  const calendarLabel = getCalendarLabel(view, referenceDate);

  const renderActivityChip = (activity: Activity) => {
    const user = users.find((item) => item.id === activity.userId);
    const project = projects.find(
      (item) =>
        item.id === activity.projectId || item.name === activity.projectName,
    );

    return (
      <button
        key={activity.id}
        onClick={() => onSelectActivity?.(activity)}
        className="group flex w-full flex-col rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        style={{
          borderLeftColor: project?.color || "#1a56db",
          borderLeftWidth: 4,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900 truncate-2">
              {activity.title}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {user?.name || "Sem utilizador"}
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
            {getCalendarActivityLabel(activity)}
          </div>
        </div>
        {activity.description && (
          <p className="mt-2 text-xs leading-5 text-slate-600 truncate-2">
            {activity.description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between gap-2">
          <Badge status={activity.status} />
          <span className="text-xs font-mono text-slate-500">
            {formatHours(calculateHours(activity.startTime, activity.endTime))}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Calendário
          </div>
          <h2 className="mt-1 text-xl font-semibold text-navy">
            {calendarLabel}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onToday}>
            Hoje
          </Button>
          <button
            onClick={onPrevious}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 transition hover:bg-slate-100"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={onNext}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 transition hover:bg-slate-100"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {view === "day" && (
        <div className="grid gap-4 p-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-navy">
                  {getDayTitle(referenceDate)}
                </div>
                <div className="text-xs text-slate-500">
                  Lista completa de atividades do dia
                </div>
              </div>
              <button
                onClick={() => onCreateActivity?.(formatDateKey(referenceDate))}
                className="inline-flex items-center gap-2 rounded-xl bg-navy px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
              >
                <Plus size={16} />
                Nova
              </button>
            </div>
            <div className="space-y-3">
              {getActivitiesForDate(
                activities,
                formatDateKey(referenceDate),
              ).map((activity) => (
                <div key={activity.id}>{renderActivityChip(activity)}</div>
              ))}
              {getActivitiesForDate(activities, formatDateKey(referenceDate))
                .length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                  Sem atividades registadas para este dia.
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
            <div className="text-sm font-semibold text-navy">Resumo rápido</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="text-slate-500">Total de atividades</div>
                <div className="mt-1 text-lg font-semibold text-navy">
                  {
                    getActivitiesForDate(
                      activities,
                      formatDateKey(referenceDate),
                    ).length
                  }
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="text-slate-500">Horas previstas</div>
                <div className="mt-1 text-lg font-semibold text-navy">
                  {formatHours(
                    getActivitiesForDate(
                      activities,
                      formatDateKey(referenceDate),
                    ).reduce(
                      (total, activity) =>
                        total +
                        calculateHours(activity.startTime, activity.endTime),
                      0,
                    ),
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
              Clique numa atividade para abrir detalhes e edição rápida.
            </div>
          </div>
        </div>
      )}

      {view === "week" && (
        <div className="grid gap-3 p-4 md:grid-cols-7">
          {dates.map((date) => {
            const dateKey = formatDateKey(date);
            const dayActivities = getActivitiesForWeek(
              activities,
              referenceDate,
            ).filter((activity) => activity.date === dateKey);
            const dayHours = dayActivities.reduce(
              (total, activity) =>
                total + calculateHours(activity.startTime, activity.endTime),
              0,
            );

            return (
              <button
                key={dateKey}
                onClick={() => onSelectDate?.(dateKey)}
                className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                  isToday(dateKey)
                    ? "border-primary-500 bg-primary-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-navy">
                    {date.toLocaleDateString("pt-PT", { weekday: "short" })}
                  </div>
                  <div className="text-xs text-slate-500">{date.getDate()}</div>
                </div>
                <div className="mt-3 space-y-2">
                  {dayActivities.slice(0, 3).map((activity) => (
                    <div
                      key={activity.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectActivity?.(activity);
                      }}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                      style={{
                        borderLeftColor: getProjectColor(activity, projects),
                        borderLeftWidth: 4,
                      }}
                    >
                      <div className="font-medium truncate-2">
                        {activity.title}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        {getCalendarActivityLabel(activity)} ·{" "}
                        {getStatusLabel(activity.status)}
                      </div>
                    </div>
                  ))}
                  {dayActivities.length > 3 && (
                    <div className="text-xs text-slate-500">
                      + {dayActivities.length - 3} atividades
                    </div>
                  )}
                </div>
                <div className="mt-3 text-xs font-mono text-slate-500">
                  {formatHours(dayHours)}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {view === "month" && (
        <div className="p-4">
          <div className="grid grid-cols-7 gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((label) => (
              <div key={label} className="px-2 py-1 text-center">
                {label}
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
            {dates.map((date) => {
              const dateKey = formatDateKey(date);
              const dayActivities = getActivitiesForMonth(
                activities,
                referenceDate,
              ).filter((activity) => activity.date === dateKey);
              const dayHours = dayActivities.reduce(
                (total, activity) =>
                  total + calculateHours(activity.startTime, activity.endTime),
                0,
              );

              return (
                <button
                  key={dateKey}
                  onClick={() => onSelectDate?.(dateKey)}
                  className={`min-h-32 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                    isSameCalendarMonth(date, referenceDate)
                      ? "border-slate-200 bg-white"
                      : "border-slate-100 bg-slate-50 text-slate-400"
                  } ${isToday(dateKey) ? "ring-2 ring-primary-200" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold">
                      {date.getDate()}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {formatHours(dayHours)}
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {dayActivities.slice(0, 2).map((activity) => (
                      <div
                        key={activity.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectActivity?.(activity);
                        }}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs"
                        style={{
                          borderLeftColor: getProjectColor(activity, projects),
                          borderLeftWidth: 4,
                        }}
                      >
                        <div className="truncate-2 font-medium text-slate-700">
                          {activity.title}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                          {getCalendarActivityLabel(activity)}
                        </div>
                      </div>
                    ))}
                    {dayActivities.length > 2 && (
                      <div className="text-[11px] text-slate-500">
                        + {dayActivities.length - 2} mais
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
            <div>
              {getActivitiesForMonth(activities, referenceDate).length}{" "}
              atividades no mês
            </div>
            <div>
              {formatHours(
                getActivitiesForMonth(activities, referenceDate).reduce(
                  (total, activity) =>
                    total +
                    calculateHours(activity.startTime, activity.endTime),
                  0,
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
