import { AppShell, ProtectedRoute } from "@/components";
import { AdminOverviewPage } from "@/screens";

export default function AdminOverviewRoute() {
  return (
    <ProtectedRoute>
      <AppShell>
        <AdminOverviewPage />
      </AppShell>
    </ProtectedRoute>
  );
}
