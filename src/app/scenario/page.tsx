import { AppShell } from "@/components/layout/app-shell";
import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export default function ScenarioPage() {
  return (
    <AppShell currentPath="/scenario" title="Scenario Lab" subtitle="Assumption-control foundation">
      <RoutePlaceholder
        eyebrow="Phase 8 destination"
        title="Scenario Lab"
        description="This route is prepared for base-case preservation, scenario controls, preset scenarios and comparison output."
      />
    </AppShell>
  );
}
