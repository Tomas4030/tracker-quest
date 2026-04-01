import { AppShell, ProtectedRoute } from "@/components";
import { DashboardPage } from "@/screens";

export default function DashboardRoute() {
  return (
    <ProtectedRoute>
      <AppShell>
        <DashboardPage />
      </AppShell>
    </ProtectedRoute>
  );
}
