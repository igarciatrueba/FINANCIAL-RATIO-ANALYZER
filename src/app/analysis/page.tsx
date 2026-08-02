import { AppShell } from "@/components/layout/app-shell";
import { ExecutiveDashboardSessionBoundary } from "@/features/executive-dashboard";

export default function AnalysisPage() {
  return (
    <AppShell currentPath="/analysis" title="Executive Dashboard" subtitle="Financial condition and deterministic insight summary">
      <ExecutiveDashboardSessionBoundary />
    </AppShell>
  );
}
