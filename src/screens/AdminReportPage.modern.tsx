"use client";

import React, { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  InsightCard,
  Select,
  Topbar,
  StatCard,
} from "@/components";
import { reportService, authService } from "@/services";
import type { SmartReport } from "@/types";
import { formatHours, formatDate } from "@/utils/helpers";

export const AdminReportPage: React.FC = () => {
  const [scope, setScope] = useState<"admin" | "team" | "user">("admin");
  const [period, setPeriod] = useState<"week" | "month" | "all">("month");
  const [teamId, setTeamId] = useState("");
  const [userId, setUserId] = useState("");
  const [report, setReport] = useState<SmartReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const users = authService.getAll();
  const teams = users
    .filter((user) => user.teamId)
    .map((user) => ({ id: user.teamId!, name: user.teamName || user.teamId! }))
    .filter(
      (team, index, array) =>
        array.findIndex((item) => item.id === team.id) === index,
    );

  const loadReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const generated = await reportService.generate({
        scope,
        teamId: scope === "team" ? teamId || undefined : undefined,
        userId: scope === "user" ? userId || undefined : undefined,
        period,
      });
      setReport(generated);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível gerar o relatório.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, period, teamId, userId]);

  const totalHours = report?.totalHours || 0;
  const completedTasks = report?.completedTasks || 0;
  const pendingTasks = report?.pendingTasks || 0;
  const completionRate =
    report && report.completedTasks + report.pendingTasks > 0
      ? Math.round(
          (report.completedTasks /
            (report.completedTasks + report.pendingTasks)) *
            100,
        )
      : 0;

  return (
    <>
      <Topbar title="Relatórios inteligentes" date={formatDate(new Date())} />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
        <section className="grid gap-4 lg:grid-cols-4">
          <StatCard
            icon="⏱"
            label="Horas totais"
            value={formatHours(totalHours)}
          />
          <StatCard
            icon="✅"
            label="Tarefas concluídas"
            value={`${completedTasks}`}
          />
          <StatCard
            icon="🕓"
            label="Tarefas pendentes"
            value={`${pendingTasks}`}
          />
          <StatCard
            icon="📈"
            label="Taxa de conclusão"
            value={`${completionRate}%`}
          />
        </section>

        <Card>
          <CardHeader className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <CardTitle>Configuração do relatório</CardTitle>
            <Button onClick={loadReport} isLoading={isLoading}>
              Regenerar relatório
            </Button>
          </CardHeader>
          <CardBody className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
            <Select
              label="Âmbito"
              value={scope}
              onChange={(event) =>
                setScope(event.target.value as "admin" | "team" | "user")
              }
              options={[
                { value: "admin", label: "Global" },
                { value: "team", label: "Equipa" },
                { value: "user", label: "Utilizador" },
              ]}
            />
            <Select
              label="Período"
              value={period}
              onChange={(event) =>
                setPeriod(event.target.value as "week" | "month" | "all")
              }
              options={[
                { value: "week", label: "Semana" },
                { value: "month", label: "Mês" },
                { value: "all", label: "Tudo" },
              ]}
            />
            <Select
              label="Equipa"
              value={teamId}
              onChange={(event) => setTeamId(event.target.value)}
              options={teams.map((team) => ({
                value: team.id,
                label: team.name,
              }))}
            />
            <Select
              label="Utilizador"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              options={users
                .filter((user) => user.role === "estagiario")
                .map((user) => ({ value: user.id, label: user.name }))}
            />
            <div className="flex items-end">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setScope("admin");
                  setPeriod("month");
                  setTeamId("");
                  setUserId("");
                }}
              >
                Repor filtros
              </Button>
            </div>
          </CardBody>
        </Card>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Resumo AI</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              {isLoading && !report ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                  A gerar relatório inteligente com os dados mais recentes...
                </div>
              ) : report ? (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Semanal
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {report.summaryWeekly}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Mensal
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {report.summaryMonthly}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {report.insights.map((insight) => (
                      <InsightCard key={insight.id} {...insight} />
                    ))}
                  </div>
                </>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deteção de dificuldades</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              {report?.difficulties.length ? (
                report.difficulties.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-navy">
                          {item.title}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {item.description}
                        </p>
                      </div>
                      <Badge label={item.severity} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                  Sem sinais de dificuldade relevantes no período selecionado.
                </div>
              )}
            </CardBody>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Projetos com maior investimento</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              {report?.projectEffort.length ? (
                report.projectEffort.map((project) => (
                  <div
                    key={project.projectId}
                    className="space-y-2 rounded-2xl bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-navy">
                          {project.projectName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {project.tasks} tarefas
                        </div>
                      </div>
                      <div className="text-sm font-mono text-slate-600">
                        {formatHours(project.hours)}
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-primary-500"
                        style={{ width: `${Math.max(8, project.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                  Ainda não existem projetos associados aos registos analisados.
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sugestões automáticas</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              {report?.suggestions.length ? (
                report.suggestions.map((suggestion) => (
                  <div
                    key={suggestion}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"
                  >
                    {suggestion}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                  Sem sugestões adicionais.
                </div>
              )}
            </CardBody>
          </Card>
        </section>
      </div>
    </>
  );
};

export default AdminReportPage;
