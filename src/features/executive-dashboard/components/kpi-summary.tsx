import { ArrowDownRight, ArrowRight, ArrowUpRight, CircleSlash } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DashboardKpiViewModel, DashboardMetricDirection } from "@/features/executive-dashboard/types/dashboard.types";

type KpiSummaryProps = {
  kpis: DashboardKpiViewModel[];
};

export function KpiSummary({ kpis }: KpiSummaryProps) {
  return (
    <section aria-label="KPI summary" className="open-section py-6" role="region">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="premium-kicker">Key operating metrics</p>
          <h2 className="mt-2 text-h3 font-semibold text-neutral-50" id="kpi-summary-heading">
            Current evidence, compared with the prior year
          </h2>
        </div>
        <p className="text-caption text-neutral-400">Current period with prior-period movement</p>
      </div>

      <div className="data-rail mt-6">
        <div className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
          {kpis.map((kpi) => (
            <article
              aria-label={kpi.accessibleStatus}
              className={cn("min-w-0 py-5 transition-colors duration-200 hover:bg-blue-500/6 md:px-5", kpi.emphasized && "bg-blue-500/7")}
              key={kpi.id}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-small font-semibold text-neutral-50">{kpi.label}</h3>
                  <p className="text-caption text-neutral-400">{kpi.unitLabel}</p>
                </div>
                <DirectionBadge direction={kpi.direction} />
              </div>

              <p className="mt-4 font-mono text-[clamp(1.8rem,3vw,2.8rem)] font-semibold leading-none tabular-nums text-neutral-50">
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
