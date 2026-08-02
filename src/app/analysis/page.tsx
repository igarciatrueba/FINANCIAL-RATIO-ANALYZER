import { AppShell } from "@/components/layout/app-shell";
import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export default function AnalysisPage() {
  return (
    <AppShell currentPath="/analysis" title="Overview" subtitle="Executive dashboard foundation">
      <RoutePlaceholder
        eyebrow="Phase 6 destination"
        title="Executive Dashboard"
        description="This route is prepared for the Financial Health Score, KPI summary, dimension scores, trends and principal strengths and risks."
      />
    </AppShell>
  );
}
