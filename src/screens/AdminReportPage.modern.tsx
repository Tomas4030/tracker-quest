"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Select,
  Topbar,
  StatCard,
} from "@/components";
import { reportService, authService } from "@/services";
import type { SmartReport, User } from "@/types";
import { formatHours, formatDate } from "@/utils/helpers";

// ─── tipos ────────────────────────────────────────────────────────────────────

type Scope = "admin" | "team" | "user";
type Period = "week" | "month" | "all";

interface CacheKey {
  scope: Scope;
  period: Period;
  teamId: string;
  userId: string;
}

interface CachedReport {
  report: SmartReport;
  key: CacheKey;
}

type DisplayInsight = SmartReport["insights"][number] & {
  category?: string;
  badge?: string;
};

interface ReportStats {
  totalHours: number;
  completedTasks: number;
  pendingTasks: number;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function cacheKeyStr(key: CacheKey) {
  return `${key.scope}__${key.period}__${key.teamId}__${key.userId}`;
}

function keysEqual(a: CacheKey, b: CacheKey) {
  return cacheKeyStr(a) === cacheKeyStr(b);
}

function getInsightCategory(insight: DisplayInsight): string {
  if (insight.category) return insight.category;
  if (insight.id === "risks") return "riscos";
  if (insight.id === "projects") return "utilizacao";
  if (insight.id === "productivity") return "tendencias";
  return "produtividade";
}

const CATEGORY_META: Record<
  string,
  { label: string; emoji: string; borderClass: string; badgeClass: string }
> = {
  produtividade: {
    label: "Produtividade",
    emoji: "📊",
    borderClass: "border-blue-200 bg-blue-50",
    badgeClass: "bg-blue-100 text-blue-800",
  },
  riscos: {
    label: "Riscos",
    emoji: "⚠️",
    borderClass: "border-red-200 bg-red-50",
    badgeClass: "bg-red-100 text-red-800",
  },
  tendencias: {
    label: "Tendências",
    emoji: "📈",
    borderClass: "border-amber-200 bg-amber-50",
    badgeClass: "bg-amber-100 text-amber-800",
  },
  utilizacao: {
    label: "Utilização",
    emoji: "👥",
    borderClass: "border-violet-200 bg-violet-50",
    badgeClass: "bg-violet-100 text-violet-800",
  },
};

const SEVERITY_META: Record<
  string,
  { borderClass: string; badgeClass: string; label: string }
> = {
  high: {
    borderClass: "border-red-300 bg-red-50",
    badgeClass: "bg-red-100 text-red-700",
    label: "Alta",
  },
  medium: {
    borderClass: "border-amber-200 bg-amber-50",
    badgeClass: "bg-amber-100 text-amber-700",
    label: "Média",
  },
  low: {
    borderClass: "border-slate-200 bg-slate-50",
    badgeClass: "bg-slate-100 text-slate-600",
    label: "Baixa",
  },
};

// ─── componente principal ─────────────────────────────────────────────────────

export const AdminReportPage: React.FC = () => {
  const [scope, setScope] = useState<Scope>("admin");
  const [period, setPeriod] = useState<Period>("month");
  const [teamId, setTeamId] = useState("");
  const [userId, setUserId] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [report, setReport] = useState<SmartReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<ReportStats>({
    totalHours: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });

  // cache
  const cacheRef = useRef<CachedReport | null>(null);
  const [cacheHit, setCacheHit] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const teams = users
    .filter((u) => u.teamId)
    .map((u) => ({ id: u.teamId!, name: u.teamName || u.teamId! }))
    .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);

  const currentKey = useCallback(
    (): CacheKey => ({ scope, period, teamId, userId }),
    [scope, period, teamId, userId],
  );

  // Carrega utilizadores na montagem
  useEffect(() => {
    authService
      .loadAll()
      .then((loaded) => setUsers(loaded))
      .catch(() => setUsers([]));
  }, []);

  // Carrega estatísticas automaticamente
  const loadStats = useCallback(async () => {
    setIsStatsLoading(true);

    try {
      // Este método deve existir no teu reportService
      const data = await reportService.getStats({
        scope,
        teamId: scope === "team" ? teamId || undefined : undefined,
        userId: scope === "user" ? userId || undefined : undefined,
        period,
      });

      setStats({
        totalHours: data?.totalHours ?? 0,
        completedTasks: data?.completedTasks ?? 0,
        pendingTasks: data?.pendingTasks ?? 0,
      });
    } catch {
      setStats({
        totalHours: 0,
        completedTasks: 0,
        pendingTasks: 0,
      });
    } finally {
      setIsStatsLoading(false);
    }
  }, [scope, period, teamId, userId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Quando os filtros mudam, verifica cache (não gera automaticamente)
  useEffect(() => {
    const key = currentKey();
    if (cacheRef.current && keysEqual(cacheRef.current.key, key)) {
      setCacheHit(true);
      setReport(cacheRef.current.report);
    } else {
      setCacheHit(false);
      setShowConfirm(false);
    }
  }, [scope, period, teamId, userId, currentKey]);

  const doGenerate = useCallback(async () => {
    const key = currentKey();
    setIsLoading(true);
    setError(null);
    setCacheHit(false);
    setShowConfirm(false);

    try {
      const generated = await reportService.generate({
        scope,
        teamId: scope === "team" ? teamId || undefined : undefined,
        userId: scope === "user" ? userId || undefined : undefined,
        period,
      });

      setReport(generated);

      // sincroniza também as métricas do topo
      setStats({
        totalHours: generated.totalHours ?? 0,
        completedTasks: generated.completedTasks ?? 0,
        pendingTasks: generated.pendingTasks ?? 0,
      });

      cacheRef.current = { report: generated, key };
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível gerar o relatório.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [scope, period, teamId, userId, currentKey]);

  const handleGenerateClick = () => {
    const key = currentKey();
    if (cacheRef.current && keysEqual(cacheRef.current.key, key)) {
      setShowConfirm(true);
      return;
    }
    doGenerate();
  };

  const handleConfirmRegenerate = () => doGenerate();
  const handleCancelRegenerate = () => setShowConfirm(false);

  const handleReset = () => {
    setScope("admin");
    setPeriod("month");
    setTeamId("");
    setUserId("");
    setShowConfirm(false);
  };

  // ─── métricas ────────────────────────────────────────────────────────────

  const totalHours = stats.totalHours;
  const completedTasks = stats.completedTasks;
  const pendingTasks = stats.pendingTasks;

  const completionRate =
    completedTasks + pendingTasks > 0
      ? Math.round((completedTasks / (completedTasks + pendingTasks)) * 100)
      : 0;

  // ─── agrupamento por categoria ────────────────────────────────────────────

  const insightsByCategory = (
    (report?.insights ?? []) as DisplayInsight[]
  ).reduce<Record<string, DisplayInsight[]>>((acc, insight) => {
    const cat = getInsightCategory(insight);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(insight);
    return acc;
  }, {});

  const categoryOrder = ["produtividade", "riscos", "tendencias", "utilizacao"];

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <>
      <Topbar title="Relatórios inteligentes" date={formatDate(new Date())} />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
        {/* ── Estatísticas ── */}
        <section className="grid gap-4 lg:grid-cols-4">
          <StatCard
            icon="⏱"
            label="Horas totais"
            value={isStatsLoading ? "—" : formatHours(totalHours)}
          />
          <StatCard
            icon="✅"
            label="Tarefas concluídas"
            value={isStatsLoading ? "—" : `${completedTasks}`}
          />
          <StatCard
            icon="🕓"
            label="Tarefas pendentes"
            value={isStatsLoading ? "—" : `${pendingTasks}`}
          />
          <StatCard
            icon="📈"
            label="Taxa de conclusão"
            value={isStatsLoading ? "—" : `${completionRate}%`}
          />
        </section>

        {/* ── Configuração ── */}
        <Card>
          <CardHeader className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <CardTitle>Configuração do relatório</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleReset}
                disabled={isLoading || isStatsLoading}
              >
                Repor filtros
              </Button>
              <Button onClick={handleGenerateClick} isLoading={isLoading}>
                {isLoading ? "A gerar…" : "Gerar relatório IA"}
              </Button>
            </div>
          </CardHeader>

          <CardBody className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Select
              label="Âmbito"
              value={scope}
              onChange={(e) => setScope(e.target.value as Scope)}
              options={[
                { value: "admin", label: "Global" },
                { value: "team", label: "Equipa" },
                { value: "user", label: "Utilizador" },
              ]}
            />

            <Select
              label="Período"
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              options={[
                { value: "week", label: "Semana" },
                { value: "month", label: "Mês" },
                { value: "all", label: "Tudo" },
              ]}
            />

            <Select
              label="Equipa"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              options={[
                { value: "", label: "Todas as equipas" },
                ...teams.map((t) => ({ value: t.id, label: t.name })),
              ]}
            />

            <Select
              label="Utilizador"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              options={[
                { value: "", label: "Todos os utilizadores" },
                ...users
                  .filter((u) => u.role === "estagiario")
                  .map((u) => ({ value: u.id, label: u.name })),
              ]}
            />
          </CardBody>
        </Card>

        {/* ── Alerta de cache ── */}
        {cacheHit && !showConfirm && !isLoading && report && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="mb-1 text-sm font-semibold text-blue-800">
              💾 Relatório em cache
            </div>
            <div className="text-sm text-blue-700">
              Já existe um relatório gerado para esta combinação de filtros.
              Estás a ver os resultados guardados — nenhum crédito adicional foi
              consumido. Clica em <strong>Gerar relatório IA</strong> se
              quiseres forçar uma nova geração.
            </div>
          </div>
        )}

        {/* ── Confirmação de regeneração ── */}
        {showConfirm && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="mb-1 text-sm font-semibold text-amber-800">
              ⚠️ Tens a certeza que queres gerar um novo relatório?
            </div>
            <div className="text-sm text-amber-700">
              <p className="mb-3">
                Os filtros não mudaram desde o último relatório. Gerar um novo
                relatório irá consumir créditos da API e o resultado será muito
                semelhante ao atual.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleConfirmRegenerate} isLoading={isLoading}>
                  Sim, gerar mesmo assim
                </Button>
                <Button variant="secondary" onClick={handleCancelRegenerate}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Erro ── */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── Estado inicial (sem relatório) ── */}
        {!report && !isLoading && !error && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="mb-2 text-2xl">🤖</p>
            <p className="text-sm font-medium text-slate-700">
              Nenhum relatório gerado ainda
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Configura os filtros acima e clica em{" "}
              <strong>Gerar relatório IA</strong>.
            </p>
          </div>
        )}

        {/* ── Loading ── */}
        {isLoading && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="mb-2 animate-pulse text-2xl">🤖</p>
            <p className="text-sm font-medium text-slate-700">
              A gerar relatório com IA…
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Estamos a analisar os dados e a construir os insights.
            </p>
          </div>
        )}

        {/* ── Resumo semanal / mensal ── */}
        {report && !isLoading && (
          <Card>
            <CardHeader>
              <CardTitle>Resumo AI</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                    Semanal
                  </div>
                  <p className="text-sm leading-6 text-slate-700">
                    {report.summaryWeekly}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                    Mensal
                  </div>
                  <p className="text-sm leading-6 text-slate-700">
                    {report.summaryMonthly}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* ── Insights por categoria ── */}
        {report && !isLoading && (
          <section className="grid gap-6 xl:grid-cols-2">
            {categoryOrder.map((cat) => {
              const items = insightsByCategory[cat];
              if (!items?.length) return null;

              const meta = CATEGORY_META[cat] ?? {
                label: cat,
                emoji: "📌",
                borderClass: "border-slate-200 bg-slate-50",
                badgeClass: "bg-slate-100 text-slate-700",
              };

              return (
                <Card key={cat}>
                  <CardHeader>
                    <CardTitle>
                      {meta.emoji} {meta.label}
                    </CardTitle>
                  </CardHeader>

                  <CardBody className="space-y-3">
                    {items.map((insight) => (
                      <div
                        key={insight.id}
                        className={`rounded-2xl border p-4 ${meta.borderClass}`}
                      >
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <span className="text-sm font-semibold text-navy">
                            {insight.title}
                          </span>

                          {(insight.badge || insight.value) && (
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${meta.badgeClass}`}
                            >
                              {insight.badge || insight.value}
                            </span>
                          )}
                        </div>

                        <p className="text-sm leading-6 text-slate-600">
                          {insight.description}
                        </p>
                      </div>
                    ))}
                  </CardBody>
                </Card>
              );
            })}
          </section>
        )}

        {/* ── Dificuldades detetadas ── */}
        {report && !isLoading && (
          <Card>
            <CardHeader>
              <CardTitle>⚠️ Dificuldades detetadas</CardTitle>
            </CardHeader>

            <CardBody className="space-y-3">
              {report.difficulties.length ? (
                report.difficulties.map((item) => {
                  const sev = SEVERITY_META[item.severity] ?? SEVERITY_META.low;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-4 ${sev.borderClass}`}
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

                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${sev.badgeClass}`}
                        >
                          {sev.label}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                  Sem sinais de dificuldade relevantes no período selecionado.
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* ── Projetos + Sugestões ── */}
        {report && !isLoading && (
          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle>📁 Projetos com maior investimento</CardTitle>
              </CardHeader>

              <CardBody className="space-y-4">
                {report.projectEffort?.length ? (
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
                          style={{
                            width: `${Math.max(8, project.percentage)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                    Ainda não existem projetos associados aos registos
                    analisados.
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>💡 Sugestões automáticas</CardTitle>
              </CardHeader>

              <CardBody className="space-y-3">
                {report.suggestions?.length ? (
                  report.suggestions.map((suggestion, i) => (
                    <div
                      key={i}
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
        )}
      </div>
    </>
  );
};

export default AdminReportPage;