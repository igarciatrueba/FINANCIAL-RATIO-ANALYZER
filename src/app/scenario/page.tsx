import { AppShell } from "@/components/layout/app-shell";
import { ScenarioSessionBoundary } from "@/features/scenario-lab/components/scenario-session-boundary";

export default function ScenarioPage() {
  return (
    <AppShell currentPath="/scenario" title="Scenario Lab" subtitle="Base case vs transformed scenario">
      <ScenarioSessionBoundary />
    </AppShell>
  );
}
