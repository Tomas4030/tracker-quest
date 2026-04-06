import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type CreateAdminUserBody = {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  active?: boolean;
  teamId?: string | null;
  projectIds?: string[];
  company?: string;
  groupCode?: string;
};

function normalizeEnv(value: string | undefined): string {
  return value?.trim() || "";
}

function isUuid(value?: string | null): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isMissingColumnError(message: string, column: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("could not find") &&
    normalized.includes(`'${column.toLowerCase()}'`) &&
    normalized.includes("column")
  );
}

export async function POST(request: Request) {
  const supabaseUrl = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = normalizeEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        error: "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL.",
      },
      { status: 500 },
    );
  }

  const body = (await request.json()) as CreateAdminUserBody;
  const name = body.name?.trim();
  const email = body.email?.trim();
  const password = body.password?.trim();
  const role = body.role ?? "estagiario";

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Missing name, email or password." },
      { status: 400 },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (created.error || !created.data.user) {
    return NextResponse.json(
      { error: created.error?.message || "Failed to create auth user." },
      { status: 400 },
    );
  }

  const authUser = created.data.user;
  const teamId = isUuid(body.teamId) ? body.teamId : null;

  const profile = {
    id: authUser.id,
    name,
    email,
    role,
    active: body.active ?? true,
    team_id: teamId,
    project_ids: body.projectIds || [],
    company: body.company || null,
    group_code: body.groupCode || null,
  };

  const attempt = async (withoutProjectIds: boolean) => {
    const nextProfile = withoutProjectIds
      ? (() => {
          const { project_ids, ...rest } = profile;
          void project_ids;
          return rest;
        })()
      : profile;

    return supabase
      .from("users")
      .upsert(nextProfile, { onConflict: "id" })
      .select("*")
      .single();
  };

  let { data: savedProfile, error: profileError } = await attempt(false);

  if (
    profileError &&
    isMissingColumnError(profileError.message, "project_ids")
  ) {
    const retry = await attempt(true);
    savedProfile = retry.data;
    profileError = retry.error;
  }

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json(savedProfile, { status: 201 });
}
