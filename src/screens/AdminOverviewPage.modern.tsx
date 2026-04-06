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
  Modal,
  Pagination,
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
import {
  calculateHours,
  formatHours,
  formatTime,
  getWeekDates,
} from "@/utils/helpers";

type AccountWizardStep = 1 | 2;

function createTempPassword(name: string): string {
  const firstName = name.split(" ")[0] || "user";
  return `${firstName.toLowerCase()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getRoleLabel(role: string): string {
  if (role === "admin") return "Admin";
  if (role === "estagiario") return "Estagiário";
  return role
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

export const AdminOverviewPage: React.FC = () => {
  const { loadActivities } = useAppStore();
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<AccountWizardStep>(1);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [accountsPage, setAccountsPage] = useState(1);
  const [teamsPage, setTeamsPage] = useState(1);
  const [projectsPage, setProjectsPage] = useState(1);
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
  const [projectSearchTerm, setProjectSearchTerm] = useState("");
  const teamActivitiesMeasureRef = useRef<HTMLDivElement | null>(null);

  // Modal states — equipas
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamFormName, setTeamFormName] = useState("");

  // Modal states — projetos
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectFormName, setProjectFormName] = useState("");
  const [projectFormDescription, setProjectFormDescription] = useState("");

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

  const selectedProjects = useMemo(
    () => projects.filter((project) => formProjectIds.includes(project.id)),
    [formProjectIds, projects],
  );

  const roleSuggestions = useMemo(() => {
    const uniqueRoles = Array.from(new Set(users.map((user) => user.role)));
    return Array.from(new Set(["estagiario", "admin", ...uniqueRoles]));
  }, [users]);

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

  const filteredUsers = users;
  const filteredActivities = activities;
  const weekDates = useMemo(() => getWeekDates(), []);

  const weeklyTeamActivities = useMemo(
    () =>
      filteredActivities.filter((activity) =>
        weekDates.includes(activity.date),
      ),
    [filteredActivities, weekDates],
  );

  const totalHours = filteredActivities.reduce(
    (sum, activity) =>
      sum +
      calculateHours(
        formatTime(activity.startTime),
        formatTime(activity.endTime),
      ),
    0,
  );
  const activeInterns = users.filter(
    (user) => user.role === "estagiario" && user.active !== false,
  ).length;
  const inactiveAccounts = users.filter((user) => user.active === false).length;

  const ACCOUNTS_PER_PAGE = 4;
  const totalAccountsPages = Math.ceil(
    filteredUsers.length / ACCOUNTS_PER_PAGE,
  );
  const paginatedUsers = filteredUsers.slice(
    (accountsPage - 1) * ACCOUNTS_PER_PAGE,
    accountsPage * ACCOUNTS_PER_PAGE,
  );

  const ACTIVITIES_PER_PAGE = 6;
  const totalTeamActivitiesPages = Math.ceil(
    weeklyTeamActivities.length / ACTIVITIES_PER_PAGE,
  );
  const paginatedTeamActivities = weeklyTeamActivities.slice(
    (recentActivitiesTeamPage - 1) * ACTIVITIES_PER_PAGE,
    recentActivitiesTeamPage * ACTIVITIES_PER_PAGE,
  );

  const allTeamActivityPages = useMemo(() => {
    return Array.from({ length: totalTeamActivitiesPages }, (_, index) =>
      weeklyTeamActivities.slice(
        index * ACTIVITIES_PER_PAGE,
        (index + 1) * ACTIVITIES_PER_PAGE,
      ),
    );
  }, [totalTeamActivitiesPages, weeklyTeamActivities]);

  useEffect(() => {
    setRecentActivitiesTeamPage(1);
  }, [weeklyTeamActivities.length]);

  const TEAM_CARDS_PER_PAGE = 6;
  const totalTeamsPages = Math.ceil(teams.length / TEAM_CARDS_PER_PAGE);
  const paginatedTeams = teams.slice(
    (teamsPage - 1) * TEAM_CARDS_PER_PAGE,
    teamsPage * TEAM_CARDS_PER_PAGE,
  );

  const PROJECT_CARDS_PER_PAGE = 6;
  const totalProjectsPages = Math.ceil(
    projects.length / PROJECT_CARDS_PER_PAGE,
  );
  const paginatedProjects = projects.slice(
    (projectsPage - 1) * PROJECT_CARDS_PER_PAGE,
    projectsPage * PROJECT_CARDS_PER_PAGE,
  );

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

  // ── Wizard de contas ────────────────────────────────────────────────────────

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
      setProjectSearchTerm("");
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
    if (!validateStepOne()) return;
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
    try {
      const team = teams.find((item) => item.id === formTeamId) || null;
      const hasNewPassword = Boolean(formPassword.trim());
      const payload = {
        name: formName,
        email: formEmail,
        role: formRole,
        active: formActive,
        teamId: team?.id,
        projectIds: formProjectIds,
        company: team?.company || formCompany,
        groupCode: team?.groupCode || formGroupCode,
      };

      if (editingUserId && hasNewPassword) {
        setError(
          "Alterar palavra-passe exige chave service_role. Faz isso no painel Auth do Supabase.",
        );
        return;
      }
      if (editingUserId) {
        await authService.updateUser(editingUserId, payload);
      } else {
        const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: payload.name,
            email: payload.email,
            password: formPassword.trim() || createTempPassword(formName),
            role: payload.role,
            active: payload.active,
            teamId: payload.teamId,
            projectIds: payload.projectIds,
            company: payload.company,
            groupCode: payload.groupCode,
          }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao criar conta");
        }
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
      await authService.updateUser(user.id, {
        active: user.active === false,
      });
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

  // ── Equipas ─────────────────────────────────────────────────────────────────

  const openTeamModal = (team?: Team) => {
    setEditingTeam(team || null);
    setTeamFormName(team?.name || "");
    setError(null);
    setIsTeamModalOpen(true);
  };

  const saveTeam = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!teamFormName.trim()) {
      setError("Preenche o nome da equipa.");
      return;
    }
    try {
      if (editingTeam) {
        await teamService.update(editingTeam.id, {
          name: teamFormName,
          company: editingTeam.company,
          groupCode: editingTeam.groupCode,
          memberIds: editingTeam.memberIds,
          active: editingTeam.active,
        });
      } else {
        await teamService.create({
          name: teamFormName,
          company: "",
          groupCode: "",
          memberIds: [],
          active: true,
        });
      }
      setSuccess(editingTeam ? "Equipa atualizada." : "Equipa criada.");
      setIsTeamModalOpen(false);
      await refreshData();
      setTimeout(() => setSuccess(null), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao guardar equipa.");
    }
  };

  const deleteTeam = async (teamId: string) => {
    if (!confirm("Tens a certeza que queres apagar esta equipa?")) return;
    try {
      await teamService.delete(teamId);
      setSuccess("Equipa apagada.");
      await refreshData();
      setTimeout(() => setSuccess(null), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao apagar equipa.");
    }
  };

  // ── Projetos ─────────────────────────────────────────────────────────────────

  const openProjectModal = (project?: Project) => {
    setEditingProject(project || null);
    setProjectFormName(project?.name || "");
    setProjectFormDescription(project?.description || "");
    setError(null);
    setIsProjectModalOpen(true);
  };

  const saveProject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!projectFormName.trim()) {
      setError("Preenche o nome do projeto.");
      return;
    }
    try {
      if (editingProject) {
        await projectService.update(editingProject.id, {
          name: projectFormName,
          code: editingProject.code,
          description: projectFormDescription,
          color: editingProject.color,
          active: editingProject.active,
        });
      } else {
        await projectService.create({
          name: projectFormName,
          code: projectFormName.slice(0, 3).toUpperCase(),
          description: projectFormDescription,
          color: "#3b82f6",
          active: true,
        });
      }
      setSuccess(editingProject ? "Projeto atualizado." : "Projeto criado.");
      setIsProjectModalOpen(false);
      await refreshData();
      setTimeout(() => setSuccess(null), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao guardar projeto.");
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm("Tens a certeza que queres apagar este projeto?")) return;
    try {
      await projectService.delete(projectId);
      setSuccess("Projeto apagado.");
      await refreshData();
      setTimeout(() => setSuccess(null), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao apagar projeto.");
    }
  };

  return (
    <>
      <Topbar title="Painel de administração" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
        {/* ── Stat cards ───────────────────────────────────────────────────────── */}
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
            label="Atividades totais"
            value={`${filteredActivities.length}`}
          />
          <StatCard
            icon="⏱"
            label="Horas totais"
            value={formatHours(totalHours)}
          />
        </div>

        {/* ── Gestão de contas ──────────────────────────────────────────────────── */}
        <Card>
          <CardBody className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <CardTitle>Gestão de contas</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => openWizard()} size="sm">
                Nova conta
              </Button>
              <Button variant="secondary" size="sm" onClick={refreshData}>
                Atualizar
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* ── Alertas globais ───────────────────────────────────────────────────── */}
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

        {/* ── Cards de utilizadores ─────────────────────────────────────────────── */}
        <div className="flex min-h-[320px] flex-col gap-4">
          <div className="grid gap-4 xl:grid-cols-2">
            {paginatedUsers.map((member) => {
              const memberActivities = activities.filter(
                (activity) => activity.userId === member.id,
              );
              const memberHours = memberActivities.reduce(
                (sum, activity) =>
                  sum +
                  calculateHours(
                    formatTime(activity.startTime),
                    formatTime(activity.endTime),
                  ),
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
                        <Badge label={getRoleLabel(member.role)} />
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

        {/* ── Gestão de Equipas ───────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <CardTitle>Equipas</CardTitle>
            <Button onClick={() => openTeamModal()} size="sm">
              Nova equipa
            </Button>
          </CardHeader>
          <CardBody className="space-y-4">
            {teams.length === 0 ? (
              <EmptyState
                title="Sem equipas"
                description="Cria a primeira equipa para começar."
              />
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {paginatedTeams.map((team) => {
                    const memberCount = users.filter(
                      (u) => u.teamId === team.id,
                    ).length;
                    return (
                      <div
                        key={team.id}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-semibold text-navy truncate">
                              {team.name}
                            </div>
                            {team.company && (
                              <div className="mt-0.5 text-xs text-slate-500 truncate">
                                {team.company}
                              </div>
                            )}
                          </div>
                          {team.groupCode && (
                            <span className="shrink-0 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                              {team.groupCode}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {memberCount}{" "}
                          {memberCount === 1 ? "membro" : "membros"}
                        </div>
                        <div className="flex gap-2 border-t border-slate-200 pt-3">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openTeamModal(team)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => deleteTeam(team.id)}
                          >
                            Apagar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {totalTeamsPages > 1 && (
                  <div className="border-t border-slate-200 pt-4">
                    <Pagination
                      currentPage={teamsPage}
                      totalPages={totalTeamsPages}
                      onPageChange={setTeamsPage}
                      className="justify-center"
                    />
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>

        {/* ── Gestão de Projetos ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <CardTitle>Projetos</CardTitle>
            <Button onClick={() => openProjectModal()} size="sm">
              Novo projeto
            </Button>
          </CardHeader>
          <CardBody className="space-y-4">
            {projects.length === 0 ? (
              <EmptyState
                title="Sem projetos"
                description="Cria o primeiro projeto para começar."
              />
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {paginatedProjects.map((project) => {
                    const assignedCount = users.filter((u) =>
                      u.projectIds?.includes(project.id),
                    ).length;
                    return (
                      <div
                        key={project.id}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-semibold text-navy truncate">
                              {project.name}
                            </div>
                            {project.description && (
                              <div className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                                {project.description}
                              </div>
                            )}
                          </div>
                          <span className="shrink-0 rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            {project.code}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {assignedCount}{" "}
                          {assignedCount === 1 ? "estagiário" : "estagiários"}{" "}
                          atribuídos
                        </div>
                        <div className="flex gap-2 border-t border-slate-200 pt-3">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openProjectModal(project)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => deleteProject(project.id)}
                          >
                            Apagar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {totalProjectsPages > 1 && (
                  <div className="border-t border-slate-200 pt-4">
                    <Pagination
                      currentPage={projectsPage}
                      totalPages={totalProjectsPages}
                      onPageChange={setProjectsPage}
                      className="justify-center"
                    />
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>

        {/* ── Atividades recentes ───────────────────────────────────────────────── */}
        <div
          className=""
          style={{ maxHeight: `${teamActivitiesCardHeight}px` }}
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

        {/* ── Ghost div para medir altura das atividades ────────────────────────── */}
        <div
          ref={teamActivitiesMeasureRef}
          className="pointer-events-none absolute left-0 top-0 -z-10 h-0 w-0 overflow-hidden opacity-0"
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

      {/* ── Modal wizard — step 1 ─────────────────────────────────────────────── */}
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
                {!editingUserId && (
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
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Papel / perfil do utilizador
                  </label>
                  <input
                    value={formRole}
                    onChange={(event) =>
                      setFormRole(event.target.value as UserRole)
                    }
                    list="role-suggestions"
                    placeholder="Ex: estagiario, admin, coordenador"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy transition-colors focus:border-primary-500 focus:outline-none"
                  />
                  <datalist id="role-suggestions">
                    {roleSuggestions.map((role) => (
                      <option key={role} value={role} />
                    ))}
                  </datalist>
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

      {/* ── Modal wizard — step 2 ─────────────────────────────────────────────── */}
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
                Equipa (opcional)
              </label>
              <select
                value={formTeamId}
                onChange={(event) => setFormTeamId(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy transition-colors focus:border-primary-500 focus:outline-none"
              >
                <option value="">Sem equipa</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-navy">
                Projetos atribuídos (opcional)
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Pesquisa, seleciona e remove projetos se quiseres associar
                algum.
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
              <div className="mt-3 max-h-60 space-y-3 overflow-y-auto pr-1">
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
                        className={`flex w-full items-start justify-between gap-4 rounded-xl border px-4 py-4 text-left transition ${
                          isSelected
                            ? "border-primary-500 bg-primary-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div
                            className={`text-sm font-semibold ${
                              isSelected ? "text-primary-700" : "text-navy"
                            }`}
                          >
                            {project.name}
                          </div>

                          <div className="mt-1 text-sm text-slate-500">
                            {project.code}
                            {project.description
                              ? ` · ${project.description}`
                              : ""}
                          </div>
                        </div>

                        <div
                          className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
                            isSelected
                              ? "border-primary-500 bg-primary-500 text-white"
                              : "border-slate-300 bg-white text-transparent"
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
          </div>
        </form>
      </Modal>

      {/* ── Modal — Nova / Editar equipa ──────────────────────────────────────── */}
      <Modal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        title={editingTeam ? "Editar equipa" : "Nova equipa"}
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsTeamModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={saveTeam}>
              {editingTeam ? "Guardar" : "Criar"}
            </Button>
          </div>
        }
      >
        <form onSubmit={saveTeam} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nome
            </label>
            <input
              value={teamFormName}
              onChange={(e) => setTeamFormName(e.target.value)}
              placeholder="Ex: Turma A"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy placeholder:text-slate-400 focus:border-primary-500 focus:outline-none"
              required
            />
          </div>
        </form>
      </Modal>

      {/* ── Modal — Novo / Editar projeto ────────────────────────────────────── */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title={editingProject ? "Editar projeto" : "Novo projeto"}
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsProjectModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={saveProject}>
              {editingProject ? "Guardar" : "Criar"}
            </Button>
          </div>
        }
      >
        <form onSubmit={saveProject} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nome
            </label>
            <input
              value={projectFormName}
              onChange={(e) => setProjectFormName(e.target.value)}
              placeholder="Ex: Projeto Alpha"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy placeholder:text-slate-400 focus:border-primary-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Descrição
            </label>
            <input
              value={projectFormDescription}
              onChange={(e) => setProjectFormDescription(e.target.value)}
              placeholder="Breve descrição (opcional)"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy placeholder:text-slate-400 focus:border-primary-500 focus:outline-none"
            />
          </div>
        </form>
      </Modal>
    </>
  );
};

export default AdminOverviewPage;
