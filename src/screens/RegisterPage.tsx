"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Topbar,
  ActivityItem,
  EmptyState,
  Input,
  Select,
  Textarea,
  Button,
  Alert,
  Pagination,
} from "@/components";
import { useAppStore } from "@/store";
import { projectService } from "@/services";
import {
  getTodayString,
  formatDate,
  formatHours,
  calculateHours,
} from "@/utils/helpers";
import type { ActivityStatus, Project } from "@/types";

type RegisterViewMode = "hoje" | "total";

export const RegisterPage: React.FC = () => {
  const { user, activities, loadActivities, createActivity } = useAppStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [viewMode, setViewMode] = useState<RegisterViewMode>("hoje");
  const [recordsPage, setRecordsPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formDate, setFormDate] = useState(getTodayString());
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("13:00");
  const [formProjectId, setFormProjectId] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<ActivityStatus>("em-curso");

  useEffect(() => {
    if (!user) return;

    const loadContext = async () => {
      await loadActivities(user.id);
      const loadedProjects = await projectService.loadAll();
      setProjects(loadedProjects.filter((project) => project.active));
    };

    loadContext().catch(() => {
      setProjects([]);
    });
  }, [loadActivities, user]);

  const availableProjects = useMemo(() => {
    if (!user) return [];

    if (user.role === "admin") return projects;

    return projects.filter((project) => user.projectIds?.includes(project.id));
  }, [projects, user]);

  const today = getTodayString();
  const todayActivities = activities.filter((a) => a.date === today);
  const todayHours = todayActivities.reduce(
    (sum, a) => sum + calculateHours(a.startTime, a.endTime),
    0,
  );
  const totalHours = activities.reduce(
    (sum, a) => sum + calculateHours(a.startTime, a.endTime),
    0,
  );
  const visibleActivities = viewMode === "hoje" ? todayActivities : activities;
  const RECORDS_PER_PAGE = 4;
  const totalRecordPages = Math.ceil(
    visibleActivities.length / RECORDS_PER_PAGE,
  );
  const paginatedVisibleActivities = visibleActivities.slice(
    (recordsPage - 1) * RECORDS_PER_PAGE,
    recordsPage * RECORDS_PER_PAGE,
  );

  useEffect(() => {
    setRecordsPage(1);
  }, [viewMode, activities.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formProjectId) {
      setError("Por favor, seleciona um projeto");
      return;
    }

    if (!formDate || !formStartTime || !formEndTime) {
      setError("Por favor, preenche todos os campos obrigatórios");
      return;
    }

    if (formStartTime >= formEndTime) {
      setError("A hora de fim deve ser posterior à de início");
      return;
    }

    const selectedProject = availableProjects.find(
      (project) => project.id === formProjectId,
    );

    if (!selectedProject) {
      setError("O projeto selecionado não está atribuído ao teu utilizador");
      return;
    }

    try {
      await createActivity({
        userId: user!.id,
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        title: selectedProject.name,
        description: formDescription,
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        status: formStatus,
      });

      setSuccess("Atividade registada com sucesso!");
      setFormProjectId("");
      setFormDescription("");
      setFormStartTime("09:00");
      setFormEndTime("13:00");
      setFormStatus("em-curso");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao registar atividade",
      );
    }
  };

  return (
    <>
      <Topbar title="Registar horas" date={formatDate(new Date())} />
      <div className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Registar atividade</CardTitle>
            </CardHeader>
            <CardBody>
              {success && (
                <Alert
                  type="success"
                  message={success}
                  onClose={() => setSuccess(null)}
                />
              )}
              {error && (
                <Alert
                  type="error"
                  message={error}
                  onClose={() => setError(null)}
                />
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Data"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Hora de início"
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    required
                  />
                  <Input
                    label="Hora de fim"
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    required
                  />
                </div>
                <Select
                  label="Projeto / Tarefa"
                  value={formProjectId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormProjectId(e.target.value)
                  }
                  options={availableProjects.map((project) => ({
                    value: project.id,
                    label: project.name,
                  }))}
                  required
                />
                <Textarea
                  label="Descrição"
                  placeholder="Descreve as tarefas realizadas..."
                  value={formDescription}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormDescription(e.target.value)
                  }
                />
                <Select
                  label="Estado"
                  value={formStatus}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormStatus(e.target.value as ActivityStatus)
                  }
                  options={[
                    { value: "em-curso", label: "Em curso" },
                    { value: "concluido", label: "Concluído" },
                    { value: "pendente", label: "Pendente" },
                  ]}
                />
                <Button type="submit" size="lg">
                  Guardar atividade
                </Button>
              </form>
            </CardBody>
          </Card>
          <Card className="flex h-full flex-col">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>
                  {viewMode === "hoje" ? "Registos de hoje" : "Registos totais"}
                </CardTitle>
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("hoje")}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                      viewMode === "hoje"
                        ? "bg-white text-navy shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("total")}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                      viewMode === "total"
                        ? "bg-white text-navy shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Total
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardBody className="flex min-h-[560px] flex-1 flex-col p-0">
              {visibleActivities.length === 0 ? (
                <div className="flex flex-1 items-center p-6">
                  <EmptyState
                    title={
                      viewMode === "hoje" ? "Sem registos hoje" : "Sem registos"
                    }
                    description={
                      viewMode === "hoje"
                        ? "Regista as tuas horas à esquerda"
                        : "Ainda não existem atividades acumuladas"
                    }
                  />
                </div>
              ) : (
                <div className="flex flex-1 flex-col">
                  <div className="flex-1">
                    {paginatedVisibleActivities.map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))}
                  </div>

                  {totalRecordPages > 1 && (
                    <div className="mt-auto border-t border-slate-200 p-4">
                      <Pagination
                        currentPage={recordsPage}
                        totalPages={totalRecordPages}
                        onPageChange={setRecordsPage}
                        className="justify-center"
                      />
                    </div>
                  )}

                  <div className="mt-auto border-t border-slate-200 bg-slate-50 px-6 py-4">
                    <div className="text-sm font-medium text-slate-700">
                      Total:{" "}
                      <span className="text-primary-600">
                        {formatHours(
                          viewMode === "hoje" ? todayHours : totalHours,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;
