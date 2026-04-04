import { NextResponse } from "next/server";
import type { ReportRequestPayload, SmartReport } from "@/types";
import { buildSmartReport } from "@/utils/analytics";
import { calculateHours, formatTime } from "@/utils/helpers";

function isSmartReport(value: unknown): value is SmartReport {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SmartReport>;
  return (
    Array.isArray(candidate.insights) && Array.isArray(candidate.difficulties)
  );
}

async function generateWithGroq(
  payload: ReportRequestPayload,
): Promise<SmartReport | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const totalHoursRaw = payload.activities.reduce(
    (sum, a) => sum + calculateHours(a.startTime, a.endTime),
    0,
  );
  const completedTasks = payload.activities.filter(
    (a) => a.status === "concluido",
  ).length;
  const pendingTasks = payload.activities.filter(
    (a) => a.status !== "concluido",
  ).length;

  const projectMap: Record<
    string,
    { hours: number; tasks: number; name: string }
  > = {};
  for (const activity of payload.activities) {
    const project = payload.projects.find((p) => p.id === activity.projectId);
    const key = activity.projectId || "sem-projeto";
    const name = project?.name || "Sem projeto";
    if (!projectMap[key]) projectMap[key] = { hours: 0, tasks: 0, name };
    projectMap[key].hours += calculateHours(
      formatTime(activity.startTime),
      formatTime(activity.endTime),
    );
    projectMap[key].tasks += 1;
  }

  const topProjects = Object.entries(projectMap)
    .sort((a, b) => b[1].hours - a[1].hours)
    .slice(0, 5)
    .map(([, v]) => `${v.name}: ${v.hours.toFixed(1)}h em ${v.tasks} tarefas`)
    .join("; ");

  const userNames = payload.users.map((u) => u.name).join(", ") || "nenhum";
  const activeUsers = payload.users.filter((u) => u.active !== false).length;

  const prompt = `
És um analista de produtividade de estágios profissionais. Analisa os dados abaixo e gera um relatório JSON completo e detalhado com insights reais baseados nos números.

=== DADOS DO RELATÓRIO ===
Âmbito: ${payload.scope}
Período: ${payload.period}
Gerado em: ${payload.generatedAt}
Utilizadores ativos: ${activeUsers} (${userNames})
Total de atividades: ${payload.activities.length}
Total de horas: ${totalHoursRaw.toFixed(1)}h
Tarefas concluídas: ${completedTasks}
Tarefas pendentes: ${pendingTasks}
Taxa de conclusão: ${payload.activities.length > 0 ? Math.round((completedTasks / payload.activities.length) * 100) : 0}%
Projetos com mais tempo: ${topProjects || "nenhum"}

=== INSTRUÇÕES ===
Gera um relatório DETALHADO e REAL com base nos números acima. Não uses frases genéricas.
Faz referência a valores concretos (horas, percentagens, nomes de projetos, utilizadores).
Cada insight e dificuldade deve ter conteúdo substantivo e acionável.

Responde APENAS com JSON válido (sem markdown, sem backticks, sem comentários):

{
  "totalHours": number (em horas decimais),
  "completedTasks": number,
  "pendingTasks": number,
  "summaryWeekly": "resumo semanal detalhado com números concretos, mínimo 2 frases",
  "summaryMonthly": "resumo mensal detalhado com números concretos, mínimo 2 frases",
  "insights": [
    {
      "id": "prod-1",
      "category": "produtividade",
      "title": "título curto e direto",
      "description": "descrição detalhada com números reais do relatório, mínimo 2 frases",
      "type": "success|warning|info",
      "badge": "valor métrico chave ex: '162h' ou '44%'"
    },
    {
      "id": "risk-1",
      "category": "riscos",
      "title": "título curto",
      "description": "descrição detalhada do risco identificado com dados concretos",
      "type": "warning|danger",
      "badge": "ex: '12 alertas'"
    },
    {
      "id": "trend-1",
      "category": "tendencias",
      "title": "título curto",
      "description": "tendência observada com base nos dados do período",
      "type": "info|success",
      "badge": "ex: '+18%'"
    },
    {
      "id": "team-1",
      "category": "utilizacao",
      "title": "título curto",
      "description": "análise de utilização da equipa com referência a utilizadores e distribuição de carga",
      "type": "info|warning",
      "badge": "ex: '11 ativos'"
    }
  ],
  "difficulties": [
    {
      "id": "diff-1",
      "title": "título do problema detetado",
      "description": "descrição clara do problema com impacto estimado e recomendação concreta",
      "severity": "low|medium|high"
    }
  ],
  "projectEffort": [
    {
      "projectId": "id do projeto",
      "projectName": "nome do projeto",
      "hours": number,
      "tasks": number,
      "percentage": number (0-100)
    }
  ],
  "suggestions": [
    "sugestão concreta e acionável baseada nos dados, não genérica"
  ]
}

Gera pelo menos 4 insights (um por categoria), 2 dificuldades e 4 sugestões concretas.
`.trim();

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content:
                "És um analista de dados rigoroso. Respondes SEMPRE em JSON válido, sem markdown, sem texto adicional.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!response.ok) {
      console.error("Groq API error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    const clean = text.replace(/```json|```/g, "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(clean);
    } catch {
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else return null;
    }

    if (isSmartReport(parsed)) return parsed as SmartReport;
    return null;
  } catch (err) {
    console.error("Groq fetch error:", err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ReportRequestPayload;

    const groqReport = await generateWithGroq(payload);
    if (groqReport) return NextResponse.json(groqReport);

    const localReport = buildSmartReport({
      activities: payload.activities,
      users: payload.users,
      projects: payload.projects,
      periodLabel: `${payload.scope} · ${payload.period}`,
    });

    return NextResponse.json(localReport);
  } catch {
    return NextResponse.json(
      buildSmartReport({
        activities: [],
        users: [],
        projects: [],
        periodLabel: "fallback",
      }),
    );
  }
}
