"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardBody, CardTitle, Topbar, ActivityItem, EmptyState, Modal, Input, Select, Textarea, Button, Alert } from "@/components";
import { useAppStore } from "@/store";
import type { Activity, ActivityStatus } from "@/types";
import { getTodayString } from "@/utils/helpers";

export const ActivitiesPage: React.FC = () => {
  const { user, activities, loadActivities, createActivity, updateActivity, deleteActivity } = useAppStore();
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

  useEffect(() => { if (user) loadActivities(user.id); }, [user]);

  const filtered = activities.filter((a) => {
    if (filterDate && a.date !== filterDate) return false;
    if (searchTerm && !a.title.toLowerCase().includes(searchTerm.toLowerCase()) && !a.description?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleOpenModal = (activity?: Activity) => {
    if (activity) {
      setEditingId(activity.id);
      setFormDate(activity.date);
      setFormStartTime(activity.startTime);
      setFormEndTime(activity.endTime);
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

  const handleCloseModal = () => { setIsModalOpen(false); setEditingId(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!formTitle.trim()) { setError("Por favor, insere um título para a atividade"); return; }
    if (!formDate || !formStartTime || !formEndTime) { setError("Por favor, preenche todos os campos obrigatórios"); return; }
    if (formStartTime >= formEndTime) { setError("A hora de fim deve ser posterior à de início"); return; }
    try {
      if (editingId) {
        await updateActivity(editingId, { title: formTitle, description: formDescription, date: formDate, startTime: formStartTime, endTime: formEndTime, status: formStatus });
        setSuccess("Atividade atualizada com sucesso!");
      } else {
        await createActivity({ userId: user!.id, title: formTitle, description: formDescription, date: formDate, startTime: formStartTime, endTime: formEndTime, status: formStatus });
        setSuccess("Atividade criada com sucesso!");
      }
      setTimeout(() => { handleCloseModal(); setSuccess(null); }, 1500);
    } catch (err) { setError(err instanceof Error ? err.message : "Erro ao guardar atividade"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tens a certeza que queres apagar esta atividade?")) return;
    try { await deleteActivity(id); setSuccess("Atividade apagada com sucesso!"); setTimeout(() => setSuccess(null), 2000); }
    catch (err) { setError(err instanceof Error ? err.message : "Erro ao apagar atividade"); }
  };

  return (
    <>
      <Topbar title="As minhas atividades" />
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader className="flex flex-col md:flex-row gap-4 md:items-center">
            <CardTitle>As minhas atividades</CardTitle>
            <div className="flex gap-2 flex-1 md:justify-end">
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm flex-1 md:flex-none md:w-40" />
              <Button onClick={() => handleOpenModal()} size="sm">+ Nova</Button>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {success && <div className="px-6 pt-4"><Alert type="success" message={success} onClose={() => setSuccess(null)} /></div>}
            {filtered.length === 0 ? <div className="p-6"><EmptyState title="Nenhuma atividade encontrada" description="Regista a tua primeira atividade" /></div> : <div>{filtered.map((activity) => <ActivityItem key={activity.id} activity={activity} onEdit={() => handleOpenModal(activity)} onDelete={() => handleDelete(activity.id)} />)}</div>}
          </CardBody>
        </Card>
      </div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? "Editar atividade" : "Nova atividade"} footer={<div className="flex gap-2"><Button onClick={handleCloseModal} variant="secondary">Cancelar</Button><Button onClick={handleSave}>Guardar</Button></div>}>
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Data" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Hora de início" type="time" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} required />
            <Input label="Hora de fim" type="time" value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} required />
          </div>
          <Input label="Projeto / Tarefa" type="text" placeholder="Ex: Desenvolvimento da Aplicação X" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required />
          <Textarea label="Descrição" placeholder="Descreve as tarefas realizadas..." value={formDescription} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormDescription(e.target.value)} />
          <Select label="Estado" value={formStatus} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormStatus(e.target.value as ActivityStatus)} options={[{ value: "em-curso", label: "Em curso" }, { value: "concluido", label: "Concluído" }, { value: "pendente", label: "Pendente" }]} />
        </form>
      </Modal>
    </>
  );
};

export default ActivitiesPage;