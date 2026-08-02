import { AppShell } from "@/components/layout/app-shell";
import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export default function MethodologyPage() {
  return (
    <AppShell currentPath="/methodology" title="Methodology" subtitle="Formula and scoring documentation foundation">
      <RoutePlaceholder
        eyebrow="Phase 10 destination"
        title="Methodology"
        description="This route is reserved for formulas, scoring policy, thresholds, assumptions, limitations and the educational disclaimer."
      />
    </AppShell>
  );
}
