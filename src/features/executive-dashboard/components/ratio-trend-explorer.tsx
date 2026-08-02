"use client";

import { useState } from "react";

import type { RatioCategory } from "@/domain";
import { ChartContainer, useReducedMotionPreference } from "@/features/executive-dashboard/charts/chart-container";
import { buildRatioTrendOption } from "@/features/executive-dashboard/charts/chart-options";
import type { DashboardRatioTrendViewModel } from "@/features/executive-dashboard/types/dashboard.types";

type RatioTrendExplorerProps = {
  ratioTrend: DashboardRatioTrendViewModel;
};

export function RatioTrendExplorer({ ratioTrend }: RatioTrendExplorerProps) {
  const reducedMotion = useReducedMotionPreference();
  const [category, setCategory] = useState<RatioCategory>(ratioTrend.defaultCategory);
  const [metricId, setMetricId] = useState(ratioTrend.defaultMetricId);
  const metrics = ratioTrend.metricsByCategory[category];
  const selectedMetric = ratioTrend.metricsById[metricId] ?? metrics[0];

  const selectedMetricId = selectedMetric.metricId;
  return (
    <section aria-label="Selectable ratio trend" role="region">
      <div className="rounded-md border border-border bg-surface p-4 md:p-5">
        <div>
          <p className="text-caption uppercase text-neutral-400">Ratio trend explorer</p>
          <h2 className="mt-1 text-h4 font-semibold text-neutral-50">Selectable ratio trend</h2>
          <p className="mt-1 text-caption text-neutral-400">Choose a category and metric to compare all three reporting periods.</p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-small font-semibold text-neutral-100">
            Ratio category
            <select
              className="min-h-12 rounded-md border border-border bg-background px-3 text-neutral-50"
              onChange={(event) => {
                const nextCategory = event.target.value as RatioCategory;
                setCategory(nextCategory);
                setMetricId(ratioTrend.metricsByCategory[nextCategory][0]?.metricId ?? ratioTrend.defaultMetricId);
              }}
              value={category}
            >
              {ratioTrend.categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-small font-semibold text-neutral-100">
            Ratio metric
            <select
              className="min-h-12 rounded-md border border-border bg-background px-3 text-neutral-50"
              onChange={(event) => setMetricId(event.target.value)}
              value={selectedMetricId}
            >
              {metrics.map((metric) => (
                <option key={metric.metricId} value={metric.metricId}>
                  {metric.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4">
          <ChartContainer
            accessibleDescription={selectedMetric.accessibleDescription}
            accessibleName={`${selectedMetric.label} trend`}
            heightClassName="h-52"
            option={buildRatioTrendOption(selectedMetric, reducedMotion)}
            summary={
              <div className="grid gap-2 text-caption text-neutral-300 sm:grid-cols-2">
                <p>
                  <span className="font-semibold text-neutral-100">Metric unit:</span> {selectedMetric.unit}
                </p>
                <p>
                  <span className="font-semibold text-neutral-100">Direction:</span> {selectedMetric.direction}
                </p>
                <p>
                  <span className="font-semibold text-neutral-100">Current:</span> {selectedMetric.currentValue.display}
                </p>
                <p>
                  <span className="font-semibold text-neutral-100">Previous:</span> {selectedMetric.previousValue.display}
                </p>
                <p className="sm:col-span-2">{selectedMetric.summary}</p>
              </div>
            }
          />
        </div>
      </div>
    </section>
  );
}
