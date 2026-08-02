import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ExecutiveDashboardViewModel, DashboardStatusTone } from "@/features/executive-dashboard/types/dashboard.types";

const toneClasses: Record<DashboardStatusTone, string> = {
  strong: "text-success",
  healthy: "text-information",
  moderate: "text-warning",
  weak: "text-warning",
  critical: "text-danger",
  unavailable: "text-neutral-300",
};

const badgeTone: Record<DashboardStatusTone, "success" | "info" | "warning" | "danger" | "default"> = {
  strong: "success",
  healthy: "info",
  moderate: "warning",
  weak: "warning",
  critical: "danger",
  unavailable: "default",
};

type HealthScorePanelProps = {
  viewModel: ExecutiveDashboardViewModel;
};

export function HealthScorePanel({ viewModel }: HealthScorePanelProps) {
  return (
    <section
      aria-labelledby="health-score-heading"
      className="rounded-md border border-border bg-surface-elevated p-5 md:p-6"
      role="region"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-caption uppercase text-neutral-400">Executive Health Score</p>
            <h2 className="mt-1 text-h3 font-semibold text-neutral-50" id="health-score-heading">
              Financial condition
            </h2>
          </div>
          <Badge variant={badgeTone[viewModel.score.tone]}>{viewModel.score.classification}</Badge>
        </div>

        <div aria-label={viewModel.score.accessibleLabel} className="grid gap-4" role="img">
          <div className="bg-background/35 p-4">
            <p className="flex items-center gap-2 text-caption uppercase text-neutral-400">
              <BarChart3 aria-hidden="true" className="h-3.5 w-3.5" />
              Current period score
            </p>
            <span className={cn("mt-3 block font-mono text-display font-semibold leading-none tabular-nums", toneClasses[viewModel.score.tone])}>
              {viewModel.score.displayValue}
            </span>
            {viewModel.score.total === null ? null : <span className="pb-1 text-small text-neutral-400">/ 100</span>}
          </div>
        </div>

        <dl className="grid gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-2 xl:grid-cols-3">
          <ScoreFact label="Previous score" value={viewModel.score.previousDisplayValue} />
          <ScoreFact label="Score delta" value={viewModel.score.changeDisplay} trend={viewModel.score.trend} />
          <ScoreFact label="Analytical coverage" value={viewModel.score.coverageDisplay} />
          <ScoreFact label="Trend" value={viewModel.score.trend} trend={viewModel.score.trend} />
          <ScoreFact label="Strongest dimension" value={viewModel.score.strongestDimension} />
          <ScoreFact label="Weakest dimension" value={viewModel.score.weakestDimension} />
        </dl>
      </div>
    </section>
  );
}

function ScoreFact({ label, value, trend }: { label: string; value: string; trend?: string }) {
  const Icon = trend === "improving" ? ArrowUpRight : trend === "deteriorating" ? ArrowDownRight : trend ? ArrowRight : Activity;
  return (
    <div className="bg-background/50 p-3">
      <dt className="flex items-center gap-2 text-caption uppercase text-neutral-400">
        <Icon aria-hidden="true" className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd className="mt-1 font-mono text-small font-semibold tabular-nums text-neutral-50">{value}</dd>
    </div>
  );
}
