import { AppShell } from "@/components/layout/app-shell";
import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export default function InputPage() {
  return (
    <AppShell currentPath="/input" title="Financial Input" subtitle="Guided statement workflow foundation">
      <RoutePlaceholder
        eyebrow="Phase 4 destination"
        title="Financial Input"
        description="This route is prepared for company context, three annual periods, statement sections and validation review."
      />
    </AppShell>
  );
}
