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
  Modal,
  Input,
  Select,
  Textarea,
  Button,
  Alert,
  Pagination,
} from "@/components";
import { useAppStore } from "@/store";
import type { Activity, ActivityStatus } from "@/types";
import {
  calculateHours,
  formatHours,
  getTodayString,
  formatTime,
} from "@/utils/helpers";

type ActivityTab = "todas" | "hoje";

export const ActivitiesPage: React.FC = () => {
  const {
    user,
    activities,
    loadActivities,
    createActivity,
    updateActivity,
    deleteActivity,
  } = useAppStore();
  const [filterDate, setFilterDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formDate, setFormDate] = useState(getTodayString());
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("13:00");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<ActivityStatus>("em-curso");
  const [currentTab, setCurrentTab] = useState<ActivityTab>("todas");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user) loadActivities(user.id);
  }, [user]);

  // Reset page when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [currentTab, filterDate, searchTerm]);

  const today = getTodayString();

  const filtered = useMemo(() => {
    let result = activities.filter((a) => {
      if (filterDate && a.date !== filterDate) return false;
      if (
        searchTerm &&
        !a.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !a.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;
      return true;
    });

    if (currentTab === "hoje") {
      result = result.filter((a) => a.date === today);
    }

    return result;
  }, [activities, filterDate, searchTerm, currentTab, today]);

  const todayHours = useMemo(() => {
    return activities
      .filter((a) => a.date === today)
      .reduce((sum, a) => sum + calculateHours(a.startTime, a.endTime), 0);
  }, [activities, today]);

  // Pagination (6 per page)
  const ACTIVITIES_PER_PAGE = 6;
  const totalPages = Math.ceil(filtered.length / ACTIVITIES_PER_PAGE);
  const paginatedActivities = filtered.slice(
    (currentPage - 1) * ACTIVITIES_PER_PAGE,
    currentPage * ACTIVITIES_PER_PAGE,
  );

  const handleOpenModal = (activity?: Activity) => {
    if (activity) {
      setEditingId(activity.id);
      setFormDate(activity.date);
      setFormStartTime(formatTime(activity.startTime));
      setFormEndTime(formatTime(activity.endTime));
      setFormTitle(activity.title);
      setFormDescription(activity.description || "");
      setFormStatus(activity.status);
    } else {
      setEditingId(null);
      setFormDate(getTodayString());
      setFormStartTime("09:00");
      setFormEndTime("13:00");
      setFormTitle("");
      setFormDescription("");
      setFormStatus("em-curso");
    }
    setError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!formTitle.trim()) {
      setError("Por favor, insere um título para a atividade");
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
    try {
      if (editingId) {
        await updateActivity(editingId, {
          title: formTitle,
          description: formDescription,
          date: formDate,
          startTime: formStartTime,
          endTime: formEndTime,
          status: formStatus,
        });
        setSuccess("Atividade atualizada com sucesso!");
      } else {
        await createActivity({
          userId: user!.id,
          title: formTitle,
          description: formDescription,
          date: formDate,
          startTime: formStartTime,
          endTime: formEndTime,
          status: formStatus,
        });
        setSuccess("Atividade criada com sucesso!");
      }
      setTimeout(() => {
        handleCloseModal();
        setSuccess(null);
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao guardar atividade",
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tens a certeza que queres apagar esta atividade?")) return;
    try {
      await deleteActivity(id);
      setSuccess("Atividade apagada com sucesso!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao apagar atividade");
    }
  };

  if (!user) return null;

  return (
    <>
      <Topbar title="As minhas atividades" />
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="flex min-h-[640px] flex-col">
          <CardHeader className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle>As minhas atividades</CardTitle>
              <Button onClick={() => handleOpenModal()} size="sm">
                + Nova
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200">
              <button
                onClick={() => setCurrentTab("todas")}
                className={`px-4 py-2 text-sm font-medium transition border-b-2 ${
                  currentTab === "todas"
                    ? "border-navy text-navy"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                Todas ({filtered.length})
              </button>
              <button
                onClick={() => setCurrentTab("hoje")}
                className={`px-4 py-2 text-sm font-medium transition border-b-2 ${
                  currentTab === "hoje"
                    ? "border-navy text-navy"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                Registos de hoje
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm flex-1 md:flex-none md:w-40"
              />
              {(filterDate || searchTerm) && (
                <Button
                  onClick={() => {
                    setFilterDate("");
                    setSearchTerm("");
                  }}
                  variant="secondary"
                  size="sm"
                >
                  Limpar filtros
                </Button>
              )}
            </div>

            {/* Today stats */}
            {currentTab === "hoje" && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <div className="text-xs text-slate-500">
                    Horas registadas hoje
                  </div>
                  <div className="mt-1 text-lg font-semibold text-navy">
                    {formatHours(todayHours)}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <div className="text-xs text-slate-500">Registos</div>
                  <div className="mt-1 text-lg font-semibold text-navy">
                    {filtered.length}
                  </div>
                </div>
              </div>
            )}
          </CardHeader>

          <CardBody className="flex flex-1 flex-col p-0">
            {success && (
              <div className="px-6 pt-4">
                <Alert
                  type="success"
                  message={success}
                  onClose={() => setSuccess(null)}
                />
              </div>
            )}
            {filtered.length === 0 ? (
              <div className="flex flex-1 items-center p-6">
                <EmptyState
                  title={
                    currentTab === "hoje"
                      ? "Nenhum registo de hoje"
                      : "Nenhuma atividade encontrada"
                  }
                  description={
                    currentTab === "hoje"
                      ? "Cria o teu primeiro registo do dia"
                      : "Regista a tua primeira atividade"
                  }
                />
              </div>
            ) : (
              <>
                <div className="flex-1">
                  {paginatedActivities.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      activity={activity}
                      onEdit={() => handleOpenModal(activity)}
                      onDelete={() => handleDelete(activity.id)}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-auto border-t border-slate-200 p-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      className="justify-center"
                    />
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? "Editar atividade" : "Registar nova atividade"}
        footer={
          <div className="flex gap-2">
            <Button onClick={handleCloseModal} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleSave}>Guardar</Button>
          </div>
        }
      >
        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        )}
        <form onSubmit={handleSave} className="space-y-4">
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
          <Input
            label="Projeto / Tarefa"
            type="text"
            placeholder="Ex: Desenvolvimento da Aplicação X"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
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
        </form>
      </Modal>
    </>
  );
};

export default ActivitiesPage;
