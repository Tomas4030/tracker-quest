import { AppShell, ProtectedRoute } from "@/components";
import { RegisterPage } from "@/screens";

export default function RegisterRoute() {
  return (
    <ProtectedRoute>
      <AppShell>
        <RegisterPage />
      </AppShell>
    </ProtectedRoute>
  );
}
