"use client";

import { ChartContainer, useReducedMotionPreference } from "@/features/executive-dashboard/charts/chart-container";
import { buildDimensionRadarOption } from "@/features/executive-dashboard/charts/chart-options";
import type { DashboardDimensionRadarViewModel } from "@/features/executive-dashboard/types/dashboard.types";

type DimensionRadarChartProps = {
  radar: DashboardDimensionRadarViewModel;
};

export function DimensionRadarChart({ radar }: DimensionRadarChartProps) {
  const reducedMotion = useReducedMotionPreference();
  const currentAvailable = radar.current.values.filter((value) => value !== null).length;
  const previousAvailable = radar.previous?.values.filter((value) => value !== null).length ?? 0;

  return (
    <section aria-label="Financial dimension radar" role="region">
      <ChartContainer
        accessibleDescription="Current period compared with the previous period across the five score dimensions."
        accessibleName="Financial dimension radar"
        option={buildDimensionRadarOption(radar, reducedMotion)}
        summary={
          <div className="grid gap-2 text-caption text-neutral-300 sm:grid-cols-2">
            <p>
              <span className="font-semibold text-neutral-100">Current period</span> {radar.current.year}: {currentAvailable} of{" "}
              {radar.indicators.length} dimensions available.
            </p>
            {radar.previous ? (
              <p>
                <span className="font-semibold text-neutral-100">Previous period</span> {radar.previous.year}: {previousAvailable} of{" "}
                {radar.indicators.length} dimensions available.
              </p>
            ) : null}
          </div>
        }
      />
    </section>
  );
}
