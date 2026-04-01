import { AppShell, ProtectedRoute } from "@/components";
import { AdminReportPage } from "@/screens";

export default function AdminReportRoute() {
  return (
    <ProtectedRoute>
      <AppShell>
        <AdminReportPage />
      </AppShell>
    </ProtectedRoute>
  );
}
