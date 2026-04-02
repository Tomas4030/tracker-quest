"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  CalendarBoard,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Input,
  InsightCard,
  Modal,
  Pagination,
  Select,
  Textarea,
  Topbar,
} from "@/components";
import { useAppStore } from "@/store";
import { authService, projectService } from "@/services";
import type {
  Activity,
  ActivityStatus,
  CalendarViewMode,
  Project,
  User,
} from "@/types";
import {
  buildSmartReport,
  getActivitiesForDate,
  getCalendarLabel,
} from "@/utils/analytics";
import {
  calculateHours,
  formatDate,
  formatHours,
  getTodayString,
} from "@/utils/helpers";

function shiftDate(
  referenceDate: Date,
  view: CalendarViewMode,
  direction: -1 | 1,
): Date {
  const next = new Date(referenceDate);
  if (view === "month") {
    next.setMonth(next.getMonth() + direction);
    return next;
  }
  if (view === "week") {
    next.setDate(next.getDate() + direction * 7);
    return next;
  }
  next.setDate(next.getDate() + direction);
  return next;
}

export const CalendarPage: React.FC = () => {
  const {
    user,
    activities,
    loadActivities,
    createActivity,
    updateActivity,
    deleteActivity,
  } = useAppStore();
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<CalendarViewMode>("month");
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [dayActivityPage, setDayActivityPage] = useState(1);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterUserId, setFilterUserId] = useState("");
  const [filterProjectId, setFilterProjectId] = useState("");
  const [filterStatus, setFilterStatus] = useState<ActivityStatus | "">("");
  const [filterDate, setFilterDate] = useState("");
  const [formDate, setFormDate] = useState(getTodayString());
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("13:00");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<ActivityStatus>("em-curso");
  const [formProjectId, setFormProjectId] = useState("");
  const [formUserId, setFormUserId] = useState("");

  const isAdmin = user?.role === "admin";

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

    loadContext().catch((error: unknown) => {
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao carregar dados do calendário.",
      );
      setUsers([]);
      setProjects([]);
    });
  }, [user, loadActivities]);

  // Reset pagination when date changes
  useEffect(() => {
    setDayActivityPage(1);
  }, [selectedDate]);

  const visibleActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (!isAdmin && activity.userId !== user?.id) return false;
      if (filterUserId && activity.userId !== filterUserId) return false;
      if (filterProjectId && activity.projectId !== filterProjectId)
        return false;
      if (filterStatus && activity.status !== filterStatus) return false;
      if (filterDate && activity.date !== filterDate) return false;
      return true;
    });
  }, [
    activities,
    filterDate,
    filterProjectId,
    filterStatus,
    filterUserId,
    isAdmin,
    user?.id,
  ]);

  const report = useMemo(
    () =>
      buildSmartReport({
        activities: visibleActivities,
        users: isAdmin ? users : users.filter((item) => item.id === user?.id),
        projects,
        periodLabel: getCalendarLabel(view, referenceDate),
        referenceDate,
      }),
    [
      visibleActivities,
      users,
      projects,
      isAdmin,
      user?.id,
      view,
      referenceDate,
    ],
  );

  const selectedDayActivities = getActivitiesForDate(
    visibleActivities,
    selectedDate,
  );
  const selectedDayHours = selectedDayActivities.reduce(
    (total, activity) =>
      total + calculateHours(activity.startTime, activity.endTime),
    0,
  );

  // Pagination for day activities (4 per page)
  const ACTIVITIES_PER_PAGE = 4;
  const totalDayActivityPages = Math.ceil(
    selectedDayActivities.length / ACTIVITIES_PER_PAGE,
  );
  const paginatedDayActivities = selectedDayActivities.slice(
    (dayActivityPage - 1) * ACTIVITIES_PER_PAGE,
    dayActivityPage * ACTIVITIES_PER_PAGE,
  );

  const handleOpenModal = (activity?: Activity, dateKey?: string) => {
    if (activity) {
      setEditingId(activity.id);
      setFormDate(activity.date);
      setFormStartTime(activity.startTime);
      setFormEndTime(activity.endTime);
      setFormTitle(activity.title);
      setFormDescription(activity.description || "");
      setFormStatus(activity.status);
      setFormProjectId(activity.projectId || "");
      setFormUserId(activity.userId);
    } else {
      const dateToUse = dateKey || selectedDate || getTodayString();
      setEditingId(null);
      setFormDate(dateToUse);
      setFormStartTime("09:00");
      setFormEndTime("13:00");
      setFormTitle("");
      setFormDescription("");
      setFormStatus("em-curso");
      setFormProjectId(projects[0]?.id || "");
      setFormUserId(user?.id || "");
    }
    setError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formTitle.trim()) {
      setError("Por favor, adiciona um título à atividade.");
      return;
    }

    if (formStartTime >= formEndTime) {
      setError("A hora de fim deve ser posterior à hora de início.");
      return;
    }

    const targetUserId = isAdmin ? formUserId || user?.id : user?.id;
    if (!targetUserId) {
      setError("Não foi possível identificar o utilizador.");
      return;
    }

    const selectedProject = projects.find(
      (project) => project.id === formProjectId,
    );

    try {
      if (editingId) {
        await updateActivity(editingId, {
          userId: targetUserId,
          projectId: formProjectId || undefined,
          projectName: selectedProject?.name,
          title: formTitle,
          description: formDescription,
          date: formDate,
          startTime: formStartTime,
          endTime: formEndTime,
          status: formStatus,
        });
        setSuccess("Atividade atualizada com sucesso.");
      } else {
        await createActivity({
          userId: targetUserId,
          projectId: formProjectId || undefined,
          projectName: selectedProject?.name,
          title: formTitle,
          description: formDescription,
          date: formDate,
          startTime: formStartTime,
          endTime: formEndTime,
          status: formStatus,
        });
        setSuccess("Atividade criada com sucesso.");
      }
      setSelectedDate(formDate);
      setTimeout(() => {
        handleCloseModal();
        setSuccess(null);
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao guardar atividade.",
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Queres remover este registo?")) return;
    try {
      await deleteActivity(id);
      setSuccess("Atividade apagada com sucesso.");
      setTimeout(() => setSuccess(null), 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao apagar atividade.",
      );
    }
  };

  if (!user) return null;

  return (
    <>
      <Topbar title="Calendário de atividades" date={formatDate(new Date())} />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="flex min-h-[100px] flex-col">
            <CardBody>
              <div className="text-sm text-slate-500">Total visível</div>
              <div className="mt-2 text-2xl font-semibold text-navy">
                {visibleActivities.length}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm text-slate-500">Horas totais</div>
              <div className="mt-2 text-2xl font-semibold text-navy">
                {formatHours(report.totalHours)}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm text-slate-500">Concluídas</div>
              <div className="mt-2 text-2xl font-semibold text-navy">
                {report.completedTasks}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm text-slate-500">
                Sinais de dificuldade
              </div>
              <div className="mt-2 text-2xl font-semibold text-navy">
                {report.difficulties.length}
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Controlos do calendário</CardTitle>
            <div className="flex flex-wrap gap-2">
              {(["day", "week", "month"] as CalendarViewMode[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setView(item)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    view === item
                      ? "bg-navy text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {item === "day" ? "Dia" : item === "week" ? "Semana" : "Mês"}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardBody className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {isAdmin && (
              <Select
                label="Utilizador"
                value={filterUserId}
                onChange={(event) => setFilterUserId(event.target.value)}
                options={users
                  .filter((item) => item.role === "estagiario")
                  .map((item) => ({ value: item.id, label: item.name }))}
              />
            )}
            <Select
              label="Projeto"
              value={filterProjectId}
              onChange={(event) => setFilterProjectId(event.target.value)}
              options={projects.map((project) => ({
                value: project.id,
                label: project.name,
              }))}
            />
            <Select
              label="Estado"
              value={filterStatus}
              onChange={(event) =>
                setFilterStatus(event.target.value as ActivityStatus | "")
              }
              options={[
                { value: "pendente", label: "Pendente" },
                { value: "em-curso", label: "Em curso" },
                { value: "concluido", label: "Concluída" },
              ]}
            />
            <Input
              label="Data"
              type="date"
              value={filterDate}
              onChange={(event) => setFilterDate(event.target.value)}
            />
            <div className="flex items-end">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setFilterUserId("");
                  setFilterProjectId("");
                  setFilterStatus("");
                  setFilterDate("");
                }}
              >
                Limpar filtros
              </Button>
            </div>
          </CardBody>
        </Card>

        {success && (
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess(null)}
          />
        )}
        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        )}

        <CalendarBoard
          view={view}
          referenceDate={referenceDate}
          activities={visibleActivities}
          users={users}
          projects={projects}
          onPrevious={() =>
            setReferenceDate((current) => shiftDate(current, view, -1))
          }
          onNext={() =>
            setReferenceDate((current) => shiftDate(current, view, 1))
          }
          onToday={() => {
            const today = new Date();
            setReferenceDate(today);
            setSelectedDate(getTodayString());
          }}
          onSelectActivity={(activity) => {
            setSelectedActivity(activity);
            handleOpenModal(activity, activity.date);
          }}
          onSelectDate={(dateKey) => {
            setSelectedDate(dateKey);
            setReferenceDate(new Date(`${dateKey}T00:00:00`));
          }}
          onCreateActivity={(dateKey) => handleOpenModal(undefined, dateKey)}
        />

        <div className="grid items-start gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <CardTitle>Atividades do dia</CardTitle>
              <div className="text-sm text-slate-500">
                {formatDate(`${selectedDate}T00:00:00`)}
              </div>
            </CardHeader>
            <CardBody className="flex flex-1 flex-col p-0 ">
              {selectedDayActivities.length === 0 ? (
                <div className="flex flex-1 items-center p-6 text-sm text-slate-500">
                  Nenhuma atividade para a data selecionada.
                </div>
              ) : (
                <>
                  <div className="flex-1 divide-y divide-slate-200">
                    {paginatedDayActivities.map((activity) => {
                      const project = projects.find(
                        (item) => item.id === activity.projectId,
                      );
                      const author = users.find(
                        (item) => item.id === activity.userId,
                      );
                      return (
                        <div key={activity.id} className="p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-navy">
                                {activity.title}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {author?.name || "Sem utilizador"} ·{" "}
                                {project?.name ||
                                  activity.projectName ||
                                  "Sem projeto"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge status={activity.status} />
                              <span className="text-xs font-mono text-slate-500">
                                {formatHours(
                                  calculateHours(
                                    activity.startTime,
                                    activity.endTime,
                                  ),
                                )}
                              </span>
                            </div>
                          </div>
                          {activity.description && (
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                              {activity.description}
                            </p>
                          )}
                          <div className="mt-4 flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleOpenModal(activity)}
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleDelete(activity.id)}
                            >
                              Apagar
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {totalDayActivityPages > 1 && (
                    <div className="mt-auto border-t border-slate-200 p-4">
                      <Pagination
                        currentPage={dayActivityPage}
                        totalPages={totalDayActivityPages}
                        onPageChange={setDayActivityPage}
                        className="justify-center"
                      />
                    </div>
                  )}
                </>
              )}
            </CardBody>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalhe do dia</CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                {selectedActivity && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Selecionada
                    </div>
                    <div className="mt-2 text-sm font-semibold text-navy">
                      {selectedActivity.title}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {selectedActivity.projectName || "Sem projeto"}
                    </div>
                  </div>
                )}
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">Horas registadas</div>
                  <div className="mt-1 text-2xl font-semibold text-navy">
                    {formatHours(selectedDayHours)}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">Atividades</div>
                  <div className="mt-1 text-2xl font-semibold text-navy">
                    {selectedDayActivities.length}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  O calendário destaca o contexto do trabalho e facilita a
                  leitura por dia, semana e mês.
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gerar registo</CardTitle>
              </CardHeader>
              <CardBody>
                <Button
                  className="w-full"
                  onClick={() => handleOpenModal(undefined, selectedDate)}
                >
                  Criar nova atividade
                </Button>
              </CardBody>
            </Card>

            <div className="grid gap-4">
              {report.insights.map((insight) => (
                <InsightCard key={insight.id} {...insight} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? "Editar atividade" : "Nova atividade"}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Guardar</Button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {isAdmin && (
            <Select
              label="Utilizador"
              value={formUserId}
              onChange={(event) => setFormUserId(event.target.value)}
              options={users
                .filter((item) => item.role === "estagiario")
                .map((item) => ({ value: item.id, label: item.name }))}
            />
          )}
          <Input
            label="Data"
            type="date"
            value={formDate}
            onChange={(event) => setFormDate(event.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Hora de início"
              type="time"
              value={formStartTime}
              onChange={(event) => setFormStartTime(event.target.value)}
              required
            />
            <Input
              label="Hora de fim"
              type="time"
              value={formEndTime}
              onChange={(event) => setFormEndTime(event.target.value)}
              required
            />
          </div>
          <Select
            label="Projeto"
            value={formProjectId}
            onChange={(event) => setFormProjectId(event.target.value)}
            options={projects.map((project) => ({
              value: project.id,
              label: project.name,
            }))}
          />
          <Input
            label="Título"
            type="text"
            value={formTitle}
            onChange={(event) => setFormTitle(event.target.value)}
            required
          />
          <Textarea
            label="Descrição"
            value={formDescription}
            onChange={(event) => setFormDescription(event.target.value)}
            placeholder="Descreve o trabalho realizado, bloqueios e resultados obtidos"
          />
          <Select
            label="Estado"
            value={formStatus}
            onChange={(event) =>
              setFormStatus(event.target.value as ActivityStatus)
            }
            options={[
              { value: "pendente", label: "Pendente" },
              { value: "em-curso", label: "Em curso" },
              { value: "concluido", label: "Concluída" },
            ]}
          />
        </form>
      </Modal>
    </>
  );
};

export default CalendarPage;
