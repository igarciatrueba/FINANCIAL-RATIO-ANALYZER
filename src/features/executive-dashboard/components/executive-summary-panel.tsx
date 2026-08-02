import { AlertTriangle, CheckCircle2, Gauge, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { DashboardExecutiveSummaryViewModel } from "@/features/executive-dashboard/types/dashboard.types";

type ExecutiveSummaryPanelProps = {
  summary: DashboardExecutiveSummaryViewModel;
};

export function ExecutiveSummaryPanel({ summary }: ExecutiveSummaryPanelProps) {
  return (
    <section aria-label="Executive summary" className="rounded-md border border-border bg-surface p-5 md:p-6" role="region">
      <div>
        <p className="text-caption uppercase text-neutral-400">Executive summary</p>
        <h2 className="mt-1 text-h4 font-semibold text-neutral-50">30-second readout</h2>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryItem icon={Gauge} label="Overall condition" text={summary.overallCondition} />
        <SummaryItem icon={CheckCircle2} label="Key improvement" text={summary.keyImprovement} />
        <SummaryItem icon={AlertTriangle} label="Primary concern" text={summary.primaryConcern} />
        <SummaryItem icon={ShieldCheck} label="Coverage" text={summary.coverage} />
      </div>
    </section>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  text,
}: {
  icon: LucideIcon;
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-sm border border-border bg-background/35 p-4">
      <div className="flex items-center gap-2 text-caption uppercase text-neutral-400">
        <Icon aria-hidden="true" className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-3 text-small leading-relaxed text-neutral-100">{text}</p>
    </div>
  );
}
