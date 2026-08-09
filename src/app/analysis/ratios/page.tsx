import { AppShell } from "@/components/layout/app-shell";
import { RatioAnalysisSessionBoundary } from "@/features/ratio-analysis";

export default function RatioAnalysisPage() {
  return (
    <AppShell currentPath="/analysis/ratios" title="Ratio Analysis" subtitle="Detailed financial ratio inspection">
      <RatioAnalysisSessionBoundary />
    </AppShell>
  );
}
