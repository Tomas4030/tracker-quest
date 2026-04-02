import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminEmail = process.env.ADMIN_EMAIL || "admin@estagio.pt";
const adminPassword = process.env.ADMIN_PASSWORD;
const adminName = process.env.ADMIN_NAME || "Administrador";

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

async function resolveOrCreateAuthUser() {
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
      "Admin user seems to exist but could not be retrieved from listUsers.",
    );
  }

  return existing;
}

async function ensureAdminProfile(authUser) {
  const { error } = await supabase.from("users").upsert(
    {
      id: authUser.id,
      name: adminName,
      email: adminEmail,
      role: "admin",
      active: true,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw error;
  }
}

try {
  const user = await resolveOrCreateAuthUser();
  await ensureAdminProfile(user);
  console.log(`Admin ready: ${adminEmail}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to create admin: ${message}`);
  process.exit(1);
}
