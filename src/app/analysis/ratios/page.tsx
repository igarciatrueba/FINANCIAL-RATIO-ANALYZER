import { AppShell } from "@/components/layout/app-shell";
import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export default function RatioAnalysisPage() {
  return (
    <AppShell currentPath="/analysis/ratios" title="Ratio Analysis" subtitle="Detailed ratio review foundation">
      <RoutePlaceholder
        eyebrow="Phase 6 destination"
        title="Detailed Ratios"
        description="This route is reserved for grouped ratio results, formulas, availability states and period comparisons."
      />
    </AppShell>
  );
}
