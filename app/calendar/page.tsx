import { AppShell, ProtectedRoute } from "@/components";
import { CalendarPage } from "@/screens";

export default function CalendarRoute() {
  return (
    <ProtectedRoute>
      <AppShell>
        <CalendarPage />
      </AppShell>
    </ProtectedRoute>
  );
}
