"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Modal,
  Pagination,
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

type AccountWizardStep = 1 | 2;

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
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<AccountWizardStep>(1);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [accountsPage, setAccountsPage] = useState(1);
  const [recentActivitiesTeamPage, setRecentActivitiesTeamPage] = useState(1);
  const [teamActivitiesCardHeight, setTeamActivitiesCardHeight] = useState(420);
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
  const [projectSearchTerm, setProjectSearchTerm] = useState("");
  const teamActivitiesMeasureRef = useRef<HTMLDivElement | null>(null);

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
    } else {
      setFormCompany("");
      setFormGroupCode("");
    }
  }, [formTeamId, teams]);

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === formTeamId),
    [formTeamId, teams],
  );

  const selectedProjects = useMemo(
    () => projects.filter((project) => formProjectIds.includes(project.id)),
    [formProjectIds, projects],
  );

  const filteredProjectOptions = useMemo(() => {
    const term = projectSearchTerm.trim().toLowerCase();
    return projects.filter((project) => {
      if (!term) return true;
      return (
        project.name.toLowerCase().includes(term) ||
        project.code.toLowerCase().includes(term) ||
        (project.description || "").toLowerCase().includes(term)
      );
    });
  }, [projectSearchTerm, projects]);

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

  // Pagination for accounts (4 per page)
  const ACCOUNTS_PER_PAGE = 2;
  const totalAccountsPages = Math.ceil(
    filteredUsers.length / ACCOUNTS_PER_PAGE,
  );
  const paginatedUsers = filteredUsers.slice(
    (accountsPage - 1) * ACCOUNTS_PER_PAGE,
    accountsPage * ACCOUNTS_PER_PAGE,
  );

  // Pagination for team activities (6 per page)
  const ACTIVITIES_PER_PAGE = 6;
  const totalTeamActivitiesPages = Math.ceil(
    filteredActivities.length / ACTIVITIES_PER_PAGE,
  );
  const paginatedTeamActivities = filteredActivities.slice(
    (recentActivitiesTeamPage - 1) * ACTIVITIES_PER_PAGE,
    recentActivitiesTeamPage * ACTIVITIES_PER_PAGE,
  );

  const allTeamActivityPages = useMemo(() => {
    return Array.from({ length: totalTeamActivitiesPages }, (_, index) =>
      filteredActivities.slice(
        index * ACTIVITIES_PER_PAGE,
        (index + 1) * ACTIVITIES_PER_PAGE,
      ),
    );
  }, [filteredActivities, totalTeamActivitiesPages]);

  useLayoutEffect(() => {
    const measureTeamActivities = () => {
      const container = teamActivitiesMeasureRef.current;
      if (!container) return;

      let maxHeight = 420;

      container
        .querySelectorAll<HTMLElement>("[data-page-height]")
        .forEach((node) => {
          maxHeight = Math.max(maxHeight, node.scrollHeight);
        });

      setTeamActivitiesCardHeight(maxHeight);
    };

    const frame = requestAnimationFrame(measureTeamActivities);
    window.addEventListener("resize", measureTeamActivities);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measureTeamActivities);
    };
  }, [allTeamActivityPages, users]);

  const openWizard = (user?: User) => {
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
      setProjectSearchTerm("");
    }
    setError(null);
    setSuccess(null);
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  const closeWizard = () => {
    setIsWizardOpen(false);
    setEditingUserId(null);
    setWizardStep(1);
    setProjectSearchTerm("");
  };

  const goBackToDetails = () => {
    setError(null);
    setWizardStep(1);
  };

  const validateStepOne = () => {
    if (!formName.trim() || !formEmail.trim()) {
      setError("Preenche o nome e o email do utilizador.");
      return false;
    }

    if (!editingUserId && !formPassword.trim()) {
      setFormPassword(createTempPassword(formName));
    }

    return true;
  };

  const goToAssignmentStep = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!validateStepOne()) {
      return;
    }

    setWizardStep(2);
  };

  const toggleProject = (projectId: string) => {
    setFormProjectIds((current) =>
      current.includes(projectId)
        ? current.filter((item) => item !== projectId)
        : [...current, projectId],
    );
  };

  const removeProject = (projectId: string) => {
    setFormProjectIds((current) =>
      current.filter((item) => item !== projectId),
    );
  };

  const saveUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!formName.trim() || !formEmail.trim()) {
      setError("Preenche o nome e o email do utilizador.");
      return;
    }

    if (!editingUserId && !formTeamId) {
      setError("Seleciona uma equipa para criar a conta.");
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
        closeWizard();
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
              <Button onClick={() => openWizard()} size="sm">
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

        <div className="flex min-h-[320px] flex-col gap-4">
          <div className="grid gap-4 xl:grid-cols-2">
            {paginatedUsers.map((member) => {
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
                          label={
                            member.role === "admin" ? "Admin" : "Estagiário"
                          }
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
                        onClick={() => openWizard(member)}
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

          {totalAccountsPages > 1 && (
            <div className="mt-auto border-t border-slate-200 pt-4">
              <Pagination
                currentPage={accountsPage}
                totalPages={totalAccountsPages}
                onPageChange={setAccountsPage}
                className="justify-center"
              />
            </div>
          )}
        </div>

        <div
          className="flex w-full"
          style={{ height: `${teamActivitiesCardHeight}px` }}
        >
          <Card className="flex h-full w-full flex-col overflow-hidden">
            <CardHeader>
              <CardTitle>Atividades recentes da equipa</CardTitle>
            </CardHeader>
            <CardBody className="flex flex-1 flex-col overflow-hidden p-0">
              {paginatedTeamActivities.length === 0 ? (
                <div className="flex flex-1 items-center p-6">
                  <EmptyState
                    title="Sem atividades"
                    description="Não há atividades disponíveis para a equipa selecionada."
                  />
                </div>
              ) : (
                <>
                  <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-6 pr-1">
                    {paginatedTeamActivities.map((activity) => {
                      const owner = users.find(
                        (user) => user.id === activity.userId,
                      );
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
                                {project?.name ||
                                  activity.projectName ||
                                  "Sem projeto"}
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
                  </div>
                  {totalTeamActivitiesPages > 1 && (
                    <div className="shrink-0 border-t border-slate-200 p-4">
                      <Pagination
                        currentPage={recentActivitiesTeamPage}
                        totalPages={totalTeamActivitiesPages}
                        onPageChange={setRecentActivitiesTeamPage}
                        className="justify-center"
                      />
                    </div>
                  )}
                </>
              )}
            </CardBody>
          </Card>
        </div>

        <div
          ref={teamActivitiesMeasureRef}
          className="pointer-events-none absolute left-0 top-0 -z-10 w-full opacity-0"
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
            {allTeamActivityPages.length === 0 ? (
              <div data-page-height className="w-full">
                <Card className="flex flex-col overflow-hidden">
                  <CardHeader>
                    <CardTitle>Atividades recentes da equipa</CardTitle>
                  </CardHeader>
                  <CardBody className="flex flex-col p-0">
                    <div className="flex flex-1 items-center p-6">
                      <EmptyState
                        title="Sem atividades"
                        description="Não há atividades disponíveis para a equipa selecionada."
                      />
                    </div>
                  </CardBody>
                </Card>
              </div>
            ) : (
              allTeamActivityPages.map((page, pageIndex) => (
                <div
                  key={`team-activities-measure-${pageIndex}`}
                  data-page-height
                  className="w-full"
                >
                  <Card className="flex flex-col overflow-hidden">
                    <CardHeader>
                      <CardTitle>Atividades recentes da equipa</CardTitle>
                    </CardHeader>
                    <CardBody className="flex flex-col p-0">
                      <div className="flex flex-col gap-3 p-6 pr-1">
                        {page.map((activity) => {
                          const owner = users.find(
                            (user) => user.id === activity.userId,
                          );
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
                                    {project?.name ||
                                      activity.projectName ||
                                      "Sem projeto"}
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
                      </div>
                      {totalTeamActivitiesPages > 1 && (
                        <div className="border-t border-slate-200 p-4">
                          <Pagination
                            currentPage={pageIndex + 1}
                            totalPages={totalTeamActivitiesPages}
                            onPageChange={() => {}}
                            className="justify-center"
                          />
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isWizardOpen && wizardStep === 1}
        onClose={closeWizard}
        title={editingUserId ? "Editar conta" : "Criar conta de estagiário"}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={closeWizard}>
              Cancelar
            </Button>
            <Button onClick={goToAssignmentStep}>Seguinte</Button>
          </div>
        }
      >
        <form onSubmit={goToAssignmentStep} className="space-y-4">
          <div className="space-y-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-sm font-semibold text-navy">
                Dados essenciais
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Preenche os dados principais antes de avançar.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nome completo
                </label>
                <input
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy transition-colors placeholder:text-slate-400 focus:border-primary-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(event) => setFormEmail(event.target.value)}
                  placeholder="Ex: joao@empresa.pt"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy transition-colors placeholder:text-slate-400 focus:border-primary-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Password temporária
                  </label>
                  <input
                    value={formPassword}
                    onChange={(event) => setFormPassword(event.target.value)}
                    placeholder="Gerada automaticamente"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy transition-colors placeholder:text-slate-400 focus:border-primary-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Papel / perfil do utilizador
                  </label>
                  <select
                    value={formRole}
                    onChange={(event) =>
                      setFormRole(event.target.value as UserRole)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy transition-colors focus:border-primary-500 focus:outline-none"
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-navy">
                    Conta ativa
                  </div>
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
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isWizardOpen && wizardStep === 2}
        onClose={closeWizard}
        title={editingUserId ? "Editar conta" : "Criar conta de estagiário"}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={goBackToDetails}>
              Voltar
            </Button>
            <Button onClick={saveUser}>
              {editingUserId ? "Guardar" : "Criar conta"}
            </Button>
          </div>
        }
      >
        <form onSubmit={saveUser} className="space-y-4">
          <div className="space-y-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-sm font-semibold text-navy">Atribuição</h3>
              <p className="mt-1 text-xs text-slate-500">
                Define a equipa e associa os projetos da conta.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Equipa
              </label>
              <select
                value={formTeamId}
                onChange={(event) => setFormTeamId(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy transition-colors focus:border-primary-500 focus:outline-none"
              >
                <option value="">Seleciona uma opção</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedTeam ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Empresa
                  </label>
                  <input
                    value={formCompany}
                    readOnly
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Código / grupo
                  </label>
                  <input
                    value={formGroupCode}
                    readOnly
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Escolhe uma equipa para mostrar a empresa e o código/grupo.
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-navy">
                Projetos atribuídos
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Pesquisa, seleciona e remove projetos sem listas longas.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Procurar projeto
              </label>
              <input
                value={projectSearchTerm}
                onChange={(event) => setProjectSearchTerm(event.target.value)}
                placeholder="Escreve para filtrar projetos..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy transition-colors placeholder:text-slate-400 focus:border-primary-500 focus:outline-none"
              />

              {selectedProjects.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => removeProject(project.id)}
                      className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 transition hover:bg-primary-100"
                    >
                      <span>{project.name}</span>
                      <span className="text-primary-500">×</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
                {filteredProjectOptions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Nenhum projeto encontrado.
                  </div>
                ) : (
                  filteredProjectOptions.map((project) => {
                    const isSelected = formProjectIds.includes(project.id);
                    return (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => toggleProject(project.id)}
                        className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition ${
                          isSelected
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-medium">{project.name}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {project.code}
                            {project.description
                              ? ` · ${project.description}`
                              : ""}
                          </div>
                        </div>
                        <div
                          className={`ml-3 inline-flex h-5 w-5 items-center justify-center rounded border-2 text-[11px] transition ${
                            isSelected
                              ? "border-primary-500 bg-primary-500 text-white"
                              : "border-slate-300 text-transparent"
                          }`}
                        >
                          ✓
                        </div>
                      </button>
                    );
                  })
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
          </div>
        </form>
      </Modal>
    </>
  );
};

export default AdminOverviewPage;
