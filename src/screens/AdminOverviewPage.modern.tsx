"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Input,
  Modal,
  Select,
  Textarea,
  Topbar,
  StatCard,
} from "@/components";
import {
  authService,
  activityService,
  projectService,
  teamService,
} from "@/services";
import { useAppStore } from "@/store";
import type { Activity, Project, Team, User, UserRole } from "@/types";
import { calculateHours, formatHours } from "@/utils/helpers";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "estagiario", label: "Estagiário" },
  { value: "admin", label: "Admin" },
];

function createTempPassword(name: string): string {
  const firstName = name.split(" ")[0] || "user";
  return `${firstName.toLowerCase()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const AdminOverviewPage: React.FC = () => {
  const { loadActivities } = useAppStore();
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTeamId, setFilterTeamId] = useState("");
  const [filterProjectId, setFilterProjectId] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | "active" | "inactive">(
    "",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("estagiario");
  const [formTeamId, setFormTeamId] = useState("");
  const [formGroupCode, setFormGroupCode] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formProjectIds, setFormProjectIds] = useState<string[]>([]);
  const [formActive, setFormActive] = useState(true);
  const [formNotes, setFormNotes] = useState("");

  const refreshData = async () => {
    const [loadedUsers, loadedProjects, loadedTeams, loadedActivities] =
      await Promise.all([
        authService.loadAll(),
        projectService.loadAll(),
        teamService.loadAll(),
        activityService.getAll(),
      ]);

    setUsers(loadedUsers);
    setProjects(loadedProjects);
    setTeams(loadedTeams);
    setActivities(loadedActivities);
  };

  useEffect(() => {
    loadActivities()
      .then(() => refreshData())
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar dados de administração.",
        );
      });
  }, [loadActivities]);

  useEffect(() => {
    const selectedTeam = teams.find((team) => team.id === formTeamId);
    if (selectedTeam) {
      setFormCompany(selectedTeam.company);
      setFormGroupCode(selectedTeam.groupCode);
    }
  }, [formTeamId, teams]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (filterStatus === "active" && user.active === false) return false;
      if (filterStatus === "inactive" && user.active !== false) return false;
      if (filterTeamId && user.teamId !== filterTeamId) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesText =
          user.name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          (user.company || "").toLowerCase().includes(term) ||
          (user.teamName || "").toLowerCase().includes(term);
        if (!matchesText) return false;
      }
      return true;
    });
  }, [filterStatus, filterTeamId, searchTerm, users]);

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (filterProjectId && activity.projectId !== filterProjectId)
        return false;
      if (filterTeamId) {
        const owner = users.find((user) => user.id === activity.userId);
        if (owner?.teamId !== filterTeamId) return false;
      }
      return true;
    });
  }, [activities, filterProjectId, filterTeamId, users]);

  const totalHours = filteredActivities.reduce(
    (sum, activity) =>
      sum + calculateHours(activity.startTime, activity.endTime),
    0,
  );
  const activeInterns = filteredUsers.filter(
    (user) => user.role === "estagiario" && user.active !== false,
  ).length;
  const inactiveAccounts = filteredUsers.filter(
    (user) => user.active === false,
  ).length;
  const openModal = (user?: User) => {
    if (user) {
      setEditingUserId(user.id);
      setFormName(user.name);
      setFormEmail(user.email);
      setFormRole(user.role);
      setFormPassword("");
      setFormTeamId(user.teamId || "");
      setFormGroupCode(user.groupCode || "");
      setFormCompany(user.company || "");
      setFormProjectIds(user.projectIds || []);
      setFormActive(user.active !== false);
      setFormNotes("");
    } else {
      setEditingUserId(null);
      setFormName("");
      setFormEmail("");
      setFormPassword(createTempPassword("nova conta"));
      setFormRole("estagiario");
      setFormTeamId("");
      setFormGroupCode("");
      setFormCompany("");
      setFormProjectIds([]);
      setFormActive(true);
      setFormNotes("");
    }
    setError(null);
    setSuccess(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUserId(null);
  };

  const toggleProject = (projectId: string) => {
    setFormProjectIds((current) =>
      current.includes(projectId)
        ? current.filter((item) => item !== projectId)
        : [...current, projectId],
    );
  };

  const saveUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!formName.trim() || !formEmail.trim()) {
      setError("Preenche o nome e o email do utilizador.");
      return;
    }

    try {
      const team = teams.find((item) => item.id === formTeamId) || null;
      const hasNewPassword = Boolean(formPassword.trim());

      if (editingUserId && hasNewPassword) {
        setError(
          "Alterar palavra-passe exige chave service_role. Faz isso no painel Auth do Supabase.",
        );
        return;
      }

      if (editingUserId) {
        await authService.updateUser(editingUserId, {
          name: formName,
          email: formEmail,
          role: formRole,
          active: formActive,
          teamId: team?.id,
          teamName: team?.name,
          company: team?.company || formCompany,
          groupCode: team?.groupCode || formGroupCode,
          projectIds: formProjectIds,
        });
      } else {
        await authService.createAccount({
          name: formName,
          email: formEmail,
          password: formPassword.trim() || createTempPassword(formName),
          role: formRole,
          active: formActive,
          teamId: team?.id,
          projectIds: formProjectIds,
          company: team?.company || formCompany,
          groupCode: team?.groupCode || formGroupCode,
        });
      }

      if (team) {
        await authService.assignUserTeam(
          editingUserId ||
            users.find((item) => item.email === formEmail)?.id ||
            "",
          team,
        );
      }

      if (editingUserId) {
        await authService.assignUserProjects(editingUserId, formProjectIds);
      }

      setSuccess(
        editingUserId
          ? "Conta atualizada com sucesso."
          : "Conta criada com sucesso.",
      );
      await refreshData();
      setTimeout(() => {
        closeModal();
        setSuccess(null);
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao guardar utilizador.",
      );
    }
  };

  const toggleUserActive = async (user: User) => {
    try {
      await authService.toggleUserActive(user.id, user.active === false);
      await refreshData();
      setSuccess(
        user.active === false ? "Conta ativada." : "Conta desativada.",
      );
      setTimeout(() => setSuccess(null), 1200);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao alterar estado da conta.",
      );
    }
  };

  return (
    <>
      <Topbar title="Painel de administração" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon="👥"
            label="Estagiários ativos"
            value={`${activeInterns}`}
          />
          <StatCard
            icon="⛔"
            label="Contas inativas"
            value={`${inactiveAccounts}`}
          />
          <StatCard
            icon="📋"
            label="Atividades filtradas"
            value={`${filteredActivities.length}`}
          />
          <StatCard
            icon="⏱"
            label="Horas visíveis"
            value={formatHours(totalHours)}
          />
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <CardTitle>Gestão de contas</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => openModal()} size="sm">
                Nova conta
              </Button>
              <Button variant="secondary" size="sm" onClick={refreshData}>
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardBody className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input
              label="Pesquisar"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Nome, email, empresa"
            />
            <Select
              label="Equipa"
              value={filterTeamId}
              onChange={(event) => setFilterTeamId(event.target.value)}
              options={teams.map((team) => ({
                value: team.id,
                label: team.name,
              }))}
            />
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
                setFilterStatus(
                  event.target.value as "" | "active" | "inactive",
                )
              }
              options={[
                { value: "active", label: "Ativas" },
                { value: "inactive", label: "Inativas" },
              ]}
            />
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

        <div className="grid gap-4 xl:grid-cols-2">
          {filteredUsers.map((member) => {
            const memberActivities = activities.filter(
              (activity) => activity.userId === member.id,
            );
            const memberHours = memberActivities.reduce(
              (sum, activity) =>
                sum + calculateHours(activity.startTime, activity.endTime),
              0,
            );
            return (
              <Card
                key={member.id}
                className={member.active === false ? "opacity-75" : ""}
              >
                <CardBody className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold text-navy">
                        {member.name}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {member.email}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        label={member.role === "admin" ? "Admin" : "Estagiário"}
                      />
                      <Badge
                        label={member.active === false ? "Inativa" : "Ativa"}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm">
                      <div className="text-slate-500">Equipa</div>
                      <div className="mt-1 font-medium text-navy">
                        {member.teamName || "Sem equipa"}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm">
                      <div className="text-slate-500">Projetos</div>
                      <div className="mt-1 font-medium text-navy">
                        {member.projectIds?.length || 0}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm">
                      <div className="text-slate-500">Horas registadas</div>
                      <div className="mt-1 font-medium text-navy">
                        {formatHours(memberHours)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm">
                      <div className="text-slate-500">Estado</div>
                      <div className="mt-1 font-medium text-navy">
                        {member.active === false ? "Inativa" : "Ativa"}
                      </div>
                    </div>
                  </div>

                  {member.projectIds && member.projectIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {member.projectIds.map((projectId) => {
                        const project = projects.find(
                          (item) => item.id === projectId,
                        );
                        return (
                          <span
                            key={projectId}
                            className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700"
                          >
                            {project?.name || projectId}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openModal(member)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant={member.active === false ? "success" : "danger"}
                      onClick={() => toggleUserActive(member)}
                    >
                      {member.active === false ? "Ativar" : "Desativar"}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Atividades recentes da equipa</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {filteredActivities.slice(0, 8).map((activity) => {
              const owner = users.find((user) => user.id === activity.userId);
              const project = projects.find(
                (item) => item.id === activity.projectId,
              );
              return (
                <div
                  key={activity.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-navy">
                        {activity.title}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {owner?.name || "Sem utilizador"} ·{" "}
                        {project?.name || activity.projectName || "Sem projeto"}
                      </div>
                    </div>
                    <Badge status={activity.status} />
                  </div>
                  {activity.description && (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {activity.description}
                    </p>
                  )}
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingUserId ? "Editar conta" : "Criar conta de estagiário"}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button onClick={saveUser}>
              {editingUserId ? "Guardar" : "Criar"}
            </Button>
          </div>
        }
      >
        <form onSubmit={saveUser} className="space-y-5">
          <div className="space-y-4 border-b border-slate-200 pb-4">
            <h3 className="text-sm font-semibold text-navy">Dados pessoais</h3>
            <Input
              label="Nome completo"
              value={formName}
              onChange={(event) => setFormName(event.target.value)}
              placeholder="Ex: João Silva"
              required
            />
            <Input
              label="Email"
              type="email"
              value={formEmail}
              onChange={(event) => setFormEmail(event.target.value)}
              placeholder="Ex: joao@empresa.pt"
              required
            />
            <Input
              label="Password temporária"
              value={formPassword}
              onChange={(event) => setFormPassword(event.target.value)}
              placeholder="Deixar vazio para gerar automaticamente"
            />
          </div>

          <div className="space-y-4 border-b border-slate-200 pb-4">
            <h3 className="text-sm font-semibold text-navy">Perfil e acesso</h3>
            <Select
              label="Perfil / Papel"
              value={formRole}
              onChange={(event) => setFormRole(event.target.value as UserRole)}
              options={ROLE_OPTIONS}
            />
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-navy">Conta ativa</div>
                <div className="text-xs text-slate-500">
                  Permite login e acesso
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormActive((current) => !current)}
                className={`relative inline-flex h-6 w-12 items-center rounded-full transition ${
                  formActive ? "bg-primary-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    formActive ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-4 border-b border-slate-200 pb-4">
            <h3 className="text-sm font-semibold text-navy">
              Atribuição à equipa
            </h3>
            <Select
              label="Equipa"
              value={formTeamId}
              onChange={(event) => setFormTeamId(event.target.value)}
              options={teams.map((team) => ({
                value: team.id,
                label: team.name,
              }))}
            />
            <Input
              label="Empresa"
              value={formCompany}
              onChange={(event) => setFormCompany(event.target.value)}
              placeholder="Auto-preenchido pela equipa"
              disabled
            />
            <Input
              label="Código / Grupo"
              value={formGroupCode}
              onChange={(event) => setFormGroupCode(event.target.value)}
              placeholder="Auto-preenchido pela equipa"
              disabled
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-navy">
              Projetos atribuídos
            </h3>
            <div className="grid gap-2">
              {projects.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
                  Nenhum projeto disponível
                </div>
              ) : (
                projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => toggleProject(project.id)}
                    className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                      formProjectIds.includes(project.id)
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {project.code}
                        </div>
                      </div>
                      <div
                        className={`inline-block h-5 w-5 rounded border-2 transition ${
                          formProjectIds.includes(project.id)
                            ? "border-primary-500 bg-primary-500"
                            : "border-slate-300"
                        }`}
                      />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <Textarea
            label="Notas internas"
            value={formNotes}
            onChange={(event) => setFormNotes(event.target.value)}
            placeholder="Observações internas sobre a conta (visível apenas a admins)"
            rows={3}
          />
        </form>
      </Modal>
    </>
  );
};

export default AdminOverviewPage;
