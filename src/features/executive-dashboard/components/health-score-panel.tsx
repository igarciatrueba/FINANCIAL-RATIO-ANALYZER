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
      className="crystal-surface premium-score-shift relative overflow-hidden rounded-lg p-6 md:p-8"
      role="region"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="premium-kicker">Financial Health</p>
            <h2 className="mt-2 text-h2 font-semibold tracking-tight text-neutral-50" id="health-score-heading">
              How healthy is this company?
            </h2>
          </div>
          <Badge variant={badgeTone[viewModel.score.tone]}>{viewModel.score.classification}</Badge>
        </div>

        <div aria-label={viewModel.score.accessibleLabel} className="grid gap-4" role="img">
          <div className="analytical-surface py-6">
            <p className="flex items-center gap-2 text-caption uppercase text-neutral-400">
              <BarChart3 aria-hidden="true" className="h-3.5 w-3.5" />
              Current period score
            </p>
            <span className={cn("mt-3 block font-mono text-[clamp(4.5rem,10vw,7.25rem)] font-semibold leading-none tracking-tight tabular-nums", toneClasses[viewModel.score.tone])}>
              {viewModel.score.displayValue}
            </span>
            {viewModel.score.total === null ? null : <span className="pb-1 text-small text-neutral-400">/ 100</span>}
          </div>
        </div>

        <dl className="grid gap-x-5 gap-y-4 border-t border-border pt-5 sm:grid-cols-2 xl:grid-cols-3">
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
    <div className="border-l border-border pl-3 first:border-l-0 first:pl-0">
      <dt className="flex items-center gap-2 text-caption uppercase text-neutral-400">
        <Icon aria-hidden="true" className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd className="mt-1 font-mono text-small font-semibold tabular-nums text-neutral-50">{value}</dd>
    </div>
  );
}
