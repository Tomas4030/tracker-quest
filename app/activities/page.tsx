import { AppShell, ProtectedRoute } from "@/components";
import { ActivitiesPage } from "@/screens";

export default function ActivitiesRoute() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ActivitiesPage />
      </AppShell>
    </ProtectedRoute>
  );
}
