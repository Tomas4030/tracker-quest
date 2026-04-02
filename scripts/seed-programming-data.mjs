import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function normalizeEnv(value, fallback = "") {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function loadLocalEnv() {
  const envPath = new URL("../.env.local", import.meta.url);
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [name, ...rest] = trimmed.split("=");
    if (!process.env[name]) {
      process.env[name] = rest.join("=");
    }
  }
}

function formatDate(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() - offsetDays);
  return date.toISOString().slice(0, 10);
}

loadLocalEnv();

const supabaseUrl = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceRoleKey = normalizeEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
const adminEmail = normalizeEnv(process.env.ADMIN_EMAIL, "admin@estagio.pt");
const adminPassword = normalizeEnv(process.env.ADMIN_PASSWORD);
const adminName = normalizeEnv(process.env.ADMIN_NAME, "Administrador");

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

if (!adminPassword || adminPassword.length < 6) {
  console.error("Set ADMIN_PASSWORD with at least 6 characters.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function upsertRows(table, rows, onConflict) {
  if (!rows.length) return [];

  const { data, error } = await supabase
    .from(table)
    .upsert(rows, { onConflict })
    .select("*");

  if (error) {
    throw error;
  }

  return data || [];
}

async function resolveOrCreateAdminAuthUser() {
  const created = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { name: adminName },
  });

  if (!created.error && created.data.user) {
    return created.data.user;
  }

  const alreadyExists = created.error?.message
    ?.toLowerCase()
    .includes("already");
  if (!alreadyExists) {
    throw created.error || new Error("Failed to create admin auth user.");
  }

  const listed = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listed.error) {
    throw listed.error;
  }

  const existing = listed.data.users.find(
    (item) => item.email?.toLowerCase() === adminEmail.toLowerCase(),
  );

  if (!existing) {
    throw new Error(
      "Admin user exists but could not be retrieved from listUsers.",
    );
  }

  const updated = await supabase.auth.admin.updateUserById(existing.id, {
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { name: adminName },
  });

  if (updated.error || !updated.data.user) {
    throw updated.error || new Error("Failed to reset existing admin user.");
  }

  return updated.data.user;
}

async function main() {
  const adminAuthUser = await resolveOrCreateAdminAuthUser();

  const teamsSeed = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Backend Guild",
      company: "Davinci Board Labs",
      group_code: "PG-101",
      member_ids: [],
      active: true,
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      name: "Frontend Forge",
      company: "Davinci Board Labs",
      group_code: "PG-202",
      member_ids: [],
      active: true,
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      name: "Platform Squad",
      company: "Davinci Board Labs",
      group_code: "PG-303",
      member_ids: [],
      active: true,
    },
  ];

  const teams = await upsertRows("teams", teamsSeed, "group_code");
  const teamByCode = new Map(teams.map((team) => [team.group_code, team]));

  const projectsSeed = [
    {
      id: "44444444-4444-4444-8444-444444444444",
      name: "API de Autenticação",
      code: "PG-API",
      description: "Endpoints de login, refresh token e proteção de rotas.",
      team_id: teamByCode.get("PG-101")?.id || null,
      color: "#1A56DB",
      active: true,
    },
    {
      id: "55555555-5555-4555-8555-555555555555",
      name: "Dashboard Moderno",
      code: "PG-DASH",
      description: "Painel de métricas com cards, filtros e quick actions.",
      team_id: teamByCode.get("PG-202")?.id || null,
      color: "#10B981",
      active: true,
    },
    {
      id: "66666666-6666-4666-8666-666666666666",
      name: "Pipeline CI/CD",
      code: "PG-CICD",
      description: "Build, lint, tests e deploy contínuo para Vercel.",
      team_id: teamByCode.get("PG-303")?.id || null,
      color: "#F59E0B",
      active: true,
    },
    {
      id: "77777777-7777-4777-8777-777777777777",
      name: "Relatórios Inteligentes",
      code: "PG-AI",
      description: "Resumo automático com analytics local e fallback externo.",
      team_id: teamByCode.get("PG-303")?.id || null,
      color: "#8B5CF6",
      active: true,
    },
    {
      id: "88888888-8888-4888-8888-888888888888",
      name: "Sistema de Design",
      code: "PG-UI",
      description: "Componentes reutilizáveis, estados e consistência visual.",
      team_id: teamByCode.get("PG-202")?.id || null,
      color: "#06B6D4",
      active: true,
    },
  ];

  const projects = await upsertRows("projects", projectsSeed, "code");
  const projectByCode = new Map(
    projects.map((project) => [project.code, project]),
  );

  const usersSeed = [
    {
      id: adminAuthUser.id,
      name: adminName,
      email: adminEmail,
      role: "admin",
      active: true,
      team_id: teamByCode.get("PG-101")?.id || null,
      company: "Davinci Board Labs",
      group_code: "PG-101",
      project_ids: [
        projectByCode.get("PG-API")?.id,
        projectByCode.get("PG-CICD")?.id,
      ].filter(Boolean),
    },
    {
      id: "99999999-9999-4999-8999-999999999991",
      name: "Marta Silva",
      email: "marta.silva@estagio.pt",
      role: "estagiario",
      active: true,
      team_id: teamByCode.get("PG-202")?.id || null,
      company: "Davinci Board Labs",
      group_code: "PG-202",
      project_ids: [
        projectByCode.get("PG-DASH")?.id,
        projectByCode.get("PG-UI")?.id,
      ].filter(Boolean),
    },
    {
      id: "99999999-9999-4999-8999-999999999992",
      name: "Rui Ferreira",
      email: "rui.ferreira@estagio.pt",
      role: "estagiario",
      active: true,
      team_id: teamByCode.get("PG-303")?.id || null,
      company: "Davinci Board Labs",
      group_code: "PG-303",
      project_ids: [
        projectByCode.get("PG-CICD")?.id,
        projectByCode.get("PG-AI")?.id,
      ].filter(Boolean),
    },
    {
      id: "99999999-9999-4999-8999-999999999993",
      name: "Inês Costa",
      email: "ines.costa@estagio.pt",
      role: "estagiario",
      active: true,
      team_id: teamByCode.get("PG-202")?.id || null,
      company: "Davinci Board Labs",
      group_code: "PG-202",
      project_ids: [
        projectByCode.get("PG-DASH")?.id,
        projectByCode.get("PG-UI")?.id,
        projectByCode.get("PG-API")?.id,
      ].filter(Boolean),
    },
  ];

  const users = await upsertRows("users", usersSeed, "email");
  const userByEmail = new Map(users.map((user) => [user.email, user]));

  const backendTeam = teamByCode.get("PG-101");
  const frontendTeam = teamByCode.get("PG-202");
  const platformTeam = teamByCode.get("PG-303");

  await upsertRows(
    "teams",
    [
      {
        ...backendTeam,
        member_ids: [
          userByEmail.get(adminEmail)?.id,
          userByEmail.get("marta.silva@estagio.pt")?.id,
        ].filter(Boolean),
      },
      {
        ...frontendTeam,
        member_ids: [userByEmail.get("ines.costa@estagio.pt")?.id].filter(
          Boolean,
        ),
      },
      {
        ...platformTeam,
        member_ids: [userByEmail.get("rui.ferreira@estagio.pt")?.id].filter(
          Boolean,
        ),
      },
    ].filter(Boolean),
    "group_code",
  );

  const admin = userByEmail.get(adminEmail);
  const marta = userByEmail.get("marta.silva@estagio.pt");
  const rui = userByEmail.get("rui.ferreira@estagio.pt");
  const ines = userByEmail.get("ines.costa@estagio.pt");

  const activitiesSeed = [
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      user_id: admin.id,
      project_id: projectByCode.get("PG-API")?.id || null,
      project_name: "API de Autenticação",
      title: "Afinar fluxo de login",
      description:
        "Validar token Supabase, estados de erro e redirecionamento.",
      date: formatDate(0),
      start_time: "09:00:00",
      end_time: "10:30:00",
      status: "em-curso",
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
      user_id: marta.id,
      project_id: projectByCode.get("PG-DASH")?.id || null,
      project_name: "Dashboard Moderno",
      title: "Criar cards de métricas",
      description: "Montar cards com horas, tarefas e alertas críticos.",
      date: formatDate(0),
      start_time: "10:45:00",
      end_time: "12:00:00",
      status: "concluido",
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
      user_id: rui.id,
      project_id: projectByCode.get("PG-CICD")?.id || null,
      project_name: "Pipeline CI/CD",
      title: "Corrigir build na Vercel",
      description:
        "Limpar cache e garantir que o deploy não usa artefactos antigos.",
      date: formatDate(1),
      start_time: "11:00:00",
      end_time: "12:15:00",
      status: "concluido",
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4",
      user_id: ines.id,
      project_id: projectByCode.get("PG-UI")?.id || null,
      project_name: "Sistema de Design",
      title: "Refatorar botões e inputs",
      description: "Uniformizar variantes, estados hover e foco acessível.",
      date: formatDate(1),
      start_time: "14:00:00",
      end_time: "15:30:00",
      status: "em-curso",
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5",
      user_id: admin.id,
      project_id: projectByCode.get("PG-AI")?.id || null,
      project_name: "Relatórios Inteligentes",
      title: "Preparar analytics local",
      description: "Gerar fallback sem depender da API externa.",
      date: formatDate(2),
      start_time: "09:30:00",
      end_time: "11:00:00",
      status: "concluido",
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6",
      user_id: marta.id,
      project_id: projectByCode.get("PG-UI")?.id || null,
      project_name: "Sistema de Design",
      title: "Ajustar layout mobile",
      description:
        "Melhorar espaçamento, tipografia e cards em ecrãs pequenos.",
      date: formatDate(2),
      start_time: "13:30:00",
      end_time: "15:00:00",
      status: "pendente",
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7",
      user_id: rui.id,
      project_id: projectByCode.get("PG-API")?.id || null,
      project_name: "API de Autenticação",
      title: "Escrever testes de integração",
      description: "Cobrir login, roles e criação de perfil admin.",
      date: formatDate(3),
      start_time: "10:00:00",
      end_time: "12:30:00",
      status: "em-curso",
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8",
      user_id: ines.id,
      project_id: projectByCode.get("PG-DASH")?.id || null,
      project_name: "Dashboard Moderno",
      title: "Melhorar filtros da lista",
      description: "Adicionar pesquisa rápida e filtro por estado.",
      date: formatDate(3),
      start_time: "15:00:00",
      end_time: "16:15:00",
      status: "concluido",
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9",
      user_id: admin.id,
      project_id: projectByCode.get("PG-CICD")?.id || null,
      project_name: "Pipeline CI/CD",
      title: "Verificar lint e type-check",
      description: "Garantir que o pipeline bloqueia erros antes do deploy.",
      date: formatDate(4),
      start_time: "09:15:00",
      end_time: "10:00:00",
      status: "concluido",
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10",
      user_id: marta.id,
      project_id: projectByCode.get("PG-AI")?.id || null,
      project_name: "Relatórios Inteligentes",
      title: "Criar resumo semanal",
      description: "Redigir insights sobre horas, tarefas e bloqueios.",
      date: formatDate(4),
      start_time: "11:15:00",
      end_time: "12:00:00",
      status: "concluido",
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11",
      user_id: rui.id,
      project_id: projectByCode.get("PG-API")?.id || null,
      project_name: "API de Autenticação",
      title: "Documentar variáveis de ambiente",
      description: "Explicar uso de Supabase, Group API e seed de dados.",
      date: formatDate(5),
      start_time: "14:00:00",
      end_time: "15:00:00",
      status: "pendente",
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa12",
      user_id: ines.id,
      project_id: projectByCode.get("PG-UI")?.id || null,
      project_name: "Sistema de Design",
      title: "Revisar estados vazios",
      description: "Melhorar empty states para listas e dashboards sem dados.",
      date: formatDate(6),
      start_time: "16:00:00",
      end_time: "17:00:00",
      status: "concluido",
    },
  ];

  await upsertRows("activities", activitiesSeed, "id");

  console.log("Seed de programação aplicado com sucesso.");
  console.log(`Admin: ${adminEmail}`);
  console.log(`Equipas: ${teams.length}`);
  console.log(`Projetos: ${projects.length}`);
  console.log(`Utilizadores: ${users.length}`);
  console.log(`Atividades: ${activitiesSeed.length}`);
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to seed programming data: ${message}`);
  process.exit(1);
}
