import { AppShell } from "@/components/layout/app-shell";
import { DupontSessionBoundary } from "@/features/dupont-analysis";

export default function DupontAnalysisPage() {
  return (
    <AppShell currentPath="/analysis/dupont" title="DuPont Analysis" subtitle="ROE driver decomposition">
      <DupontSessionBoundary />
    </AppShell>
  );
}
