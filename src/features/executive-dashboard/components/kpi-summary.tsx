import { ArrowDownRight, ArrowRight, ArrowUpRight, CircleSlash } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DashboardKpiViewModel, DashboardMetricDirection } from "@/features/executive-dashboard/types/dashboard.types";

type KpiSummaryProps = {
  kpis: DashboardKpiViewModel[];
};

export function KpiSummary({ kpis }: KpiSummaryProps) {
  return (
    <section aria-label="KPI summary" className="rounded-md border border-border bg-surface p-4 md:p-5" role="region">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-caption uppercase text-neutral-400">KPI summary</p>
          <h2 className="mt-1 text-h4 font-semibold text-neutral-50" id="kpi-summary-heading">
            Core financial indicators
          </h2>
        </div>
        <p className="text-caption text-neutral-400">Current period with prior-period movement</p>
      </div>

      <div className="mt-4 overflow-hidden rounded-sm border border-border">
        <div className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
          {kpis.map((kpi) => (
            <article
              aria-label={kpi.accessibleStatus}
              className={cn("min-w-0 bg-background/25 p-3", kpi.emphasized && "bg-surface-elevated")}
              key={kpi.id}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-small font-semibold text-neutral-50">{kpi.label}</h3>
                  <p className="text-caption text-neutral-400">{kpi.unitLabel}</p>
                </div>
                <DirectionBadge direction={kpi.direction} />
              </div>

              <p className="mt-3 font-mono text-h4 font-semibold leading-none tabular-nums text-neutral-50">
                <span title={kpi.currentValue.title}>{kpi.currentValue.display}</span>
              </p>
              <dl className="mt-3 grid gap-1.5 text-caption">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-neutral-400">Prior</dt>
                  <dd className="font-mono tabular-nums text-neutral-200">
                    {kpi.previousValue ? <span title={kpi.previousValue.title}>{kpi.previousValue.display}</span> : "Unavailable"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-neutral-400">Movement</dt>
                  <dd className="font-mono tabular-nums text-neutral-200">{kpi.movementDisplay}</dd>
                </div>
              </dl>
              <p className="mt-3 line-clamp-2 text-caption leading-snug text-neutral-400">{kpi.interpretation}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function DirectionBadge({ direction }: { direction: DashboardMetricDirection }) {
  const Icon =
    direction === "favourable"
      ? ArrowUpRight
      : direction === "unfavourable"
        ? ArrowDownRight
        : direction === "neutral"
          ? ArrowRight
          : CircleSlash;
  const label =
    direction === "favourable"
      ? "Favourable"
      : direction === "unfavourable"
        ? "Unfavourable"
        : direction === "neutral"
          ? "Neutral"
          : "Unavailable";

  return (
    <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-surface px-2 py-0.5 text-caption font-semibold text-neutral-200">
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
