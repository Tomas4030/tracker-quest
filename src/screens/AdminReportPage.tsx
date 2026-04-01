"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Topbar,
  StatCard,
} from "@/components";
import { useAppStore } from "@/store";
import { authService } from "@/services";
import type { User } from "@/types";
import { calculateHours, formatHours, getWeekDates } from "@/utils/helpers";

export const AdminReportPage: React.FC = () => {
  const { activities, loadActivities } = useAppStore();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadActivities();
    setUsers(authService.getAll().filter((u) => u.role === "estagiario"));
  }, []);

  const weekDates = getWeekDates();
  const totalHours = activities.reduce(
    (sum, a) => sum + calculateHours(a.startTime, a.endTime),
    0,
  );
  const weekHours = activities
    .filter((a) => weekDates.includes(a.date))
    .reduce((sum, a) => sum + calculateHours(a.startTime, a.endTime), 0);
  const completedTasks = activities.filter(
    (a) => a.status === "concluido",
  ).length;

  const stats = [
    { icon: "👥", label: "Total de estagiários", value: users.length },
    {
      icon: "⏱",
      label: "Horas totais registadas",
      value: formatHours(totalHours),
    },
    { icon: "📅", label: "Horas esta semana", value: formatHours(weekHours) },
    {
      icon: "✅",
      label: "Tarefas concluídas",
      value: `${completedTasks}/${activities.length}`,
    },
  ];

  const userStats = users.map((u) => {
    const userActivities = activities.filter((a) => a.userId === u.id);
    const hours = userActivities.reduce(
      (sum, a) => sum + calculateHours(a.startTime, a.endTime),
      0,
    );
    const completed = userActivities.filter(
      (a) => a.status === "concluido",
    ).length;
    return { user: u, activities: userActivities, hours, completed };
  });

  const maxHours = Math.max(...userStats.map((s) => s.hours), 1);

  return (
    <>
      <Topbar title="Relatórios" />
      <div className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <StatCard
              key={i}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
            />
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Produtividade por estagiário</CardTitle>
          </CardHeader>
          <CardBody>
            {userStats.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Nenhum estagiário registado.
              </div>
            ) : (
              <div className="space-y-6">
                {userStats.map((stat, i) => {
                  const percentage = Math.round((stat.hours / maxHours) * 100);
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {stat.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">
                              {stat.user.name}
                            </div>
                            <div className="text-xs text-slate-600">
                              <span className="font-semibold text-slate-900">
                                {formatHours(stat.hours)}
                              </span>{" "}
                              registadas •{" "}
                              <span className="font-semibold text-green-600">
                                {stat.completed}
                              </span>
                              /{stat.activities.length} concluídas
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default AdminReportPage;
