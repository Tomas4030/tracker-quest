"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardBody, CardTitle, Topbar, ActivityItem, EmptyState, Input, Select, Textarea, Button, Alert } from "@/components";
import { useAppStore } from "@/store";
import { getTodayString, formatDate, formatHours, calculateHours } from "@/utils/helpers";
import type { ActivityStatus } from "@/types";

export const RegisterPage: React.FC = () => {
  const { user, activities, loadActivities, createActivity } = useAppStore();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formDate, setFormDate] = useState(getTodayString());
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("13:00");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<ActivityStatus>("em-curso");

  useEffect(() => { if (user) loadActivities(user.id); }, [user]);

  const today = getTodayString();
  const todayActivities = activities.filter((a) => a.date === today);
  const todayHours = todayActivities.reduce((sum, a) => sum + calculateHours(a.startTime, a.endTime), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!formTitle.trim()) { setError("Por favor, insere um título para a atividade"); return; }
    if (!formDate || !formStartTime || !formEndTime) { setError("Por favor, preenche todos os campos obrigatórios"); return; }
    if (formStartTime >= formEndTime) { setError("A hora de fim deve ser posterior à de início"); return; }
    try {
      await createActivity({ userId: user!.id, title: formTitle, description: formDescription, date: formDate, startTime: formStartTime, endTime: formEndTime, status: formStatus });
      setSuccess("Atividade registada com sucesso!");
      setFormTitle(""); setFormDescription(""); setFormStartTime("09:00"); setFormEndTime("13:00"); setFormStatus("em-curso");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) { setError(err instanceof Error ? err.message : "Erro ao registar atividade"); }
  };

  return (
    <>
      <Topbar title="Registar horas" date={formatDate(new Date())} />
      <div className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Registar atividade</CardTitle></CardHeader>
            <CardBody>
              {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
              {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Data" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Hora de início" type="time" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} required />
                  <Input label="Hora de fim" type="time" value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} required />
                </div>
                <Input label="Projeto / Tarefa" type="text" placeholder="Ex: Desenvolvimento da Aplicação X" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required />
                <Textarea label="Descrição" placeholder="Descreve as tarefas realizadas..." value={formDescription} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormDescription(e.target.value)} />
                <Select label="Estado" value={formStatus} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormStatus(e.target.value as ActivityStatus)} options={[{ value: "em-curso", label: "Em curso" }, { value: "concluido", label: "Concluído" }, { value: "pendente", label: "Pendente" }]} />
                <Button type="submit" size="lg">Guardar atividade</Button>
              </form>
            </CardBody>
          </Card>
          <Card>
            <CardHeader><CardTitle>Registos de hoje</CardTitle></CardHeader>
            <CardBody className="p-0">
              {todayActivities.length === 0 ? <div className="p-6"><EmptyState title="Sem registos hoje" description="Regista as tuas horas à esquerda" /></div> : <div>{todayActivities.map((activity) => <ActivityItem key={activity.id} activity={activity} />)}<div className="px-6 py-4 border-t border-slate-200 bg-slate-50"><div className="text-sm font-medium text-slate-700">Total: <span className="text-primary-600">{formatHours(todayHours)}</span></div></div></div>}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;