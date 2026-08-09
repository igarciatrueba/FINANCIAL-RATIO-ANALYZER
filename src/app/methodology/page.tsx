import { AppShell } from "@/components/layout/app-shell";
import { Methodology } from "@/features/methodology";

export default function MethodologyPage() {
  return (
    <AppShell currentPath="/methodology" title="Methodology" subtitle="Financial formulas, scoring and analytical limitations">
      <Methodology />
    </AppShell>
  );
}
