"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardBody, CardTitle, StatCard, Topbar, ActivityItem, EmptyState } from "@/components";
import { useAppStore } from "@/store";
import { formatDate, getWeekDates, calculateHours, formatHours } from "@/utils/helpers";
import { authService } from "@/services";
import type { User } from "@/types";

export const DashboardPage: React.FC = () => {
  const { user, activities, loadActivities } = useAppStore();
  const [weekLabels] = useState(["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (user) {
      loadActivities(user.role === "admin" ? undefined : user.id);
      setUsers(authService.getAll());
    }
  }, [user]);

  if (!user) return null;

  const weekDates = getWeekDates();
  const today = new Date().toISOString().split("T")[0];
  const isAdmin = user.role === "admin";
  const userActivities = isAdmin ? activities : activities.filter((a) => a.userId === user.id);
  const todayHours = userActivities.filter((a) => a.date === today).reduce((sum, a) => sum + calculateHours(a.startTime, a.endTime), 0);
  const weekHours = userActivities.filter((a) => weekDates.includes(a.date)).reduce((sum, a) => sum + calculateHours(a.startTime, a.endTime), 0);
  const completedTasks = userActivities.filter((a) => a.status === "concluido").length;

  const stats = isAdmin
    ? [
        { icon: "👥", label: "Estagiários", value: users.filter((u) => u.role === "estagiario").length },
        { icon: "⏱", label: "Horas esta semana", value: formatHours(weekHours) },
        { icon: "📋", label: "Atividades", value: userActivities.length },
        { icon: "✅", label: "Concluídas", value: `${completedTasks}/${userActivities.length}` },
      ]
    : [
        { icon: "⏱", label: "Horas hoje", value: formatHours(todayHours) },
        { icon: "📅", label: "Horas esta semana", value: formatHours(weekHours) },
        { icon: "📋", label: "Tarefas totais", value: userActivities.length },
        { icon: "✅", label: "Concluídas", value: `${completedTasks}/${userActivities.length}` },
      ];

  const recent = [...userActivities].sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime)).slice(0, 5);

  return (
    <>
      <Topbar title="Dashboard" date={formatDate(new Date())} />
      <div className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => <StatCard key={i} icon={stat.icon} label={stat.label} value={stat.value} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle>Horas esta semana</CardTitle></CardHeader>
            <CardBody>
              <div className="grid grid-cols-7 gap-2">
                {weekDates.map((date, i) => {
                  const dayActivities = userActivities.filter((a) => a.date === date);
                  const dayHours = dayActivities.reduce((sum, a) => sum + calculateHours(a.startTime, a.endTime), 0);
                  const percentage = Math.min(100, (dayHours / 8) * 100);
                  return (
                    <div key={date} className="flex flex-col items-center">
                      <div className="text-xs font-medium text-slate-600 mb-1">{weekLabels[i]}</div>
                      <div className="w-8 h-16 bg-slate-100 rounded-sm border border-slate-200 flex items-end overflow-hidden">
                        <div className="w-full bg-primary-200 transition-all" style={{ height: `${percentage}%` }} />
                      </div>
                      <div className="text-xs text-slate-600 mt-1.5 font-mono">{dayHours > 0 ? formatHours(dayHours) : "—"}</div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Atividades recentes</CardTitle></CardHeader>
            <CardBody className="p-0">
              {recent.length === 0 ? (
                <div className="p-6"><EmptyState title="Sem atividades" description="Regista a tua primeira atividade" /></div>
              ) : (
                <div>{recent.map((activity) => { const actUser = users.find((u) => u.id === activity.userId); return <ActivityItem key={activity.id} activity={activity} showUser={isAdmin} userName={actUser?.name} />; })}</div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;