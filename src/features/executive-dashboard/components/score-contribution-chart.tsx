"use client";

import { ChartContainer, useReducedMotionPreference } from "@/features/executive-dashboard/charts/chart-container";
import { buildScoreContributionOption } from "@/features/executive-dashboard/charts/chart-options";
import type { DashboardScoreContributionViewModel } from "@/features/executive-dashboard/types/dashboard.types";

type ScoreContributionChartProps = {
  scoreContribution: DashboardScoreContributionViewModel;
};

export function ScoreContributionChart({ scoreContribution }: ScoreContributionChartProps) {
  const reducedMotion = useReducedMotionPreference();

  return (
    <section aria-label="Score contribution by dimension" role="region">
      <ChartContainer
        accessibleDescription="Dimension-level contribution to the current Financial Health Score."
        accessibleName="Score contribution by dimension"
        heightClassName="h-64"
        option={buildScoreContributionOption(scoreContribution, reducedMotion)}
        summary={
          <p className="text-caption text-neutral-300">
            Dimension score contribution to the total Financial Health Score:{" "}
            <span className="font-mono font-semibold text-neutral-50">{scoreContribution.totalDisplay}</span>. This is separate from the
            profitability waterfall, which reconciles supplied income-statement values.
          </p>
        }
      />
    </section>
  );
}
