import { AppShell } from "@/components/layout/app-shell";
import { AnalysisConfirmation } from "@/features/financial-input/analysis-confirmation";

export default function AnalysisPage() {
  return (
    <AppShell currentPath="/analysis" title="Overview" subtitle="Temporary Phase 4 analysis handoff">
      <AnalysisConfirmation />
    </AppShell>
  );
}
