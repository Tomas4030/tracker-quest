"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Topbar,
  Button,
  Modal,
  Input,
  Select,
  Textarea,
  Alert,
} from "@/components";
import { useAppStore } from "@/store";
import { authService } from "@/services";
import type { User, Activity, ActivityStatus } from "@/types";
import { calculateHours, formatHours, getTodayString } from "@/utils/helpers";
import { Edit2, Trash2 } from "lucide-react";

export const AdminOverviewPage: React.FC = () => {
  const { activities, loadActivities, updateActivity, deleteActivity } =
    useAppStore();
  const [filterDate, setFilterDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
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

  useEffect(() => {
    loadActivities();
    setUsers(authService.getAll());
  }, []);

  const filtered = activities.filter((a) => {
    if (filterDate && a.date !== filterDate) return false;
    if (searchTerm) {
      const user = users.find((u) => u.id === a.userId);
      if (
        !user?.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !a.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;
    }
    return true;
  });

  const handleOpenModal = (activity: Activity) => {
    setEditingId(activity.id);
    setFormDate(activity.date);
    setFormStartTime(activity.startTime);
    setFormEndTime(activity.endTime);
    setFormTitle(activity.title);
    setFormDescription(activity.description || "");
    setFormStatus(activity.status);
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
    if (!formTitle.trim()) {
      setError("Por favor, insere um título");
      return;
    }
    if (formStartTime >= formEndTime) {
      setError("A hora de fim deve ser posterior à de início");
      return;
    }
    try {
      await updateActivity(editingId!, {
        title: formTitle,
        description: formDescription,
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        status: formStatus,
      });
      setSuccess("Atividade atualizada com sucesso!");
      setTimeout(() => {
        handleCloseModal();
        setSuccess(null);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao guardar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tens a certeza?")) return;
    try {
      await deleteActivity(id);
      setSuccess("Atividade apagada");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao apagar");
    }
  };

  return (
    <>
      <Topbar title="Todos os estagiários" />
      <div className="p-6 max-w-6xl mx-auto">
        <Card>
          <CardHeader className="flex flex-col md:flex-row gap-4 md:items-center">
            <CardTitle>Todas as atividades</CardTitle>
            <div className="flex gap-2 flex-1 md:justify-end">
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
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm flex-1 md:flex-none md:w-48"
              />
            </div>
          </CardHeader>
          <CardBody className="p-0 overflow-x-auto">
            {success && (
              <div className="px-6 pt-4">
                <Alert
                  type="success"
                  message={success}
                  onClose={() => setSuccess(null)}
                />
              </div>
            )}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">
                    Estagiário
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">
                    Tarefa
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">
                    Horário
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">
                    Horas
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      className="px-6 py-8 text-center text-slate-500"
                      colSpan={7}
                    >
                      Nenhuma atividade encontrada
                    </td>
                  </tr>
                ) : (
                  filtered.map((activity) => {
                    const user = users.find((u) => u.id === activity.userId);
                    const hours = calculateHours(
                      activity.startTime,
                      activity.endTime,
                    );
                    const statusLabels: Record<ActivityStatus, string> = {
                      "em-curso": "Em curso",
                      concluido: "Concluído",
                      pendente: "Pendente",
                    };
                    const statusColors: Record<ActivityStatus, string> = {
                      "em-curso": "bg-blue-100 text-blue-800",
                      concluido: "bg-green-100 text-green-800",
                      pendente: "bg-amber-100 text-amber-800",
                    };
                    return (
                      <tr
                        key={activity.id}
                        className="border-b border-slate-200 hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">
                            {user?.name || "?"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">
                            {activity.title}
                          </div>
                          {activity.description && (
                            <div className="text-xs text-slate-600 truncate">
                              {activity.description.substring(0, 60)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {activity.date}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-600">
                          {activity.startTime}–{activity.endTime}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {formatHours(hours)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[activity.status]}`}
                          >
                            {statusLabels[activity.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenModal(activity)}
                              className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(activity.id)}
                              className="p-1.5 hover:bg-red-100 rounded text-red-600 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Editar atividade"
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
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            required
          />
          <Textarea
            label="Descrição"
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

export default AdminOverviewPage;
