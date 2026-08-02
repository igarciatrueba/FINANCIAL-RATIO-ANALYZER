"use client";

import { ChartContainer, useReducedMotionPreference } from "@/features/executive-dashboard/charts/chart-container";
import { buildHealthTrendOption } from "@/features/executive-dashboard/charts/chart-options";
import type { DashboardHealthTrendViewModel } from "@/features/executive-dashboard/types/dashboard.types";

type HealthTrendChartProps = {
  trend: DashboardHealthTrendViewModel;
};

export function HealthTrendChart({ trend }: HealthTrendChartProps) {
  const reducedMotion = useReducedMotionPreference();

  return (
    <section aria-label="Financial health trend" role="region">
      <ChartContainer
        accessibleDescription="Financial Health Score across the three supplied annual periods."
        accessibleName="Financial health trend"
        heightClassName="h-52"
        option={buildHealthTrendOption(trend, reducedMotion)}
        summary={
          <div className="grid gap-2">
            <p className="text-caption text-neutral-300">{trend.summary}</p>
            <ol className="grid gap-1.5 text-caption text-neutral-300 sm:grid-cols-3">
              {trend.points.map((point) => (
                <li className="flex items-center justify-between gap-3 bg-background/30 px-2 py-1.5" key={point.year}>
                  <span>{point.year}</span>
                  <span className="font-mono font-semibold tabular-nums text-neutral-50">
                    {point.displayValue} · {point.classification}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        }
      />
    </section>
  );
}
