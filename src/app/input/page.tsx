import { AppShell } from "@/components/layout/app-shell";
import { FinancialInputWorkflow } from "@/features/financial-input/workflow";

export default function InputPage() {
  return (
    <AppShell currentPath="/input" title="Financial Input" subtitle="Guided statement workflow and canonical validation">
      <FinancialInputWorkflow />
    </AppShell>
  );
}
