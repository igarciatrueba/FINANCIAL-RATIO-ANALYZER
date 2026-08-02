"use client";

import { ChartContainer, useReducedMotionPreference } from "@/features/executive-dashboard/charts/chart-container";
import { buildProfitabilityWaterfallOption } from "@/features/executive-dashboard/charts/chart-options";
import type { DashboardProfitabilityWaterfallViewModel } from "@/features/executive-dashboard/types/dashboard.types";

type ProfitabilityWaterfallChartProps = {
  waterfall: DashboardProfitabilityWaterfallViewModel;
};

export function ProfitabilityWaterfallChart({ waterfall }: ProfitabilityWaterfallChartProps) {
  const reducedMotion = useReducedMotionPreference();
  const isEmpty = waterfall.status === "unavailable" || waterfall.steps.length === 0;

  return (
    <section aria-label="Profitability waterfall" role="region">
      <ChartContainer
        accessibleDescription="Revenue-to-profit bridge using only supplied and defensible statement values."
        accessibleName="Profitability waterfall"
        emptyMessage={waterfall.reconciliationNote}
        heightClassName="h-72"
        isEmpty={isEmpty}
        option={buildProfitabilityWaterfallOption(waterfall, reducedMotion)}
        summary={
          <div className="grid gap-3 text-caption text-neutral-300">
            <p>
              <span className="font-semibold text-neutral-100">Status:</span> {waterfall.status}
            </p>
            <p>{waterfall.summary}</p>
            <p>{waterfall.reconciliationNote}</p>
            {waterfall.steps.length > 0 ? (
              <ol className="grid gap-1 sm:grid-cols-2">
                {waterfall.steps.map((step) => (
                  <li className="font-mono tabular-nums" key={step.label}>
                    {step.label}: {step.value.display}
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        }
      />
    </section>
  );
}
