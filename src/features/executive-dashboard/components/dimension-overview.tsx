import { BadgeCheck, CircleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DashboardDimensionViewModel } from "@/features/executive-dashboard/types/dashboard.types";

type DimensionOverviewProps = {
  dimensions: DashboardDimensionViewModel[];
};

export function DimensionOverview({ dimensions }: DimensionOverviewProps) {
  return (
    <section
      aria-label="Financial dimensions"
      className="rounded-md border border-border bg-surface p-5 md:p-6"
      role="region"
    >
      <div>
        <p className="text-caption uppercase text-neutral-400">Financial dimensions</p>
        <h2 className="mt-1 text-h4 font-semibold text-neutral-50" id="financial-dimensions-heading">
          Score composition
        </h2>
      </div>

      <div className="mt-5 grid gap-3">
        {dimensions.map((dimension) => (
          <article
            aria-label={dimension.accessibleLabel}
            className="grid gap-3 rounded-sm border border-border bg-background/35 p-4 lg:grid-cols-[160px_minmax(0,1fr)_220px]"
            key={dimension.id}
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-small font-semibold text-neutral-50">{dimension.label}</h3>
                {dimension.isStrongest ? (
                  <Badge className="gap-1" variant="success">
                    <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5" />
                    Strongest
                  </Badge>
                ) : null}
                {dimension.isWeakest ? (
                  <Badge className="gap-1" variant="warning">
                    <CircleAlert aria-hidden="true" className="h-3.5 w-3.5" />
                    Weakest
                  </Badge>
                ) : null}
              </div>
              <p className="mt-2 font-mono text-h4 font-semibold tabular-nums text-neutral-50">{dimension.displayScore}</p>
            </div>

            <div className="min-w-0 self-center">
              <div className="h-2 rounded-sm bg-neutral-800" aria-hidden="true">
                {dimension.relativePosition === null ? (
                  <div className="h-2 rounded-sm border border-dashed border-neutral-600 bg-neutral-800/40" />
                ) : (
                  <div
                    className={cn(
                      "h-2 rounded-sm",
                      dimension.tone === "strong" && "bg-success",
                      dimension.tone === "healthy" && "bg-information",
                      dimension.tone === "moderate" && "bg-warning",
                      dimension.tone === "weak" && "bg-warning",
                      dimension.tone === "critical" && "bg-danger",
                      dimension.tone === "unavailable" && "bg-neutral-600"
                    )}
                    style={{ width: `${dimension.relativePosition}%` }}
                  />
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-neutral-400">
                <span>{dimension.status}</span>
                <span>{dimension.coverageDisplay}</span>
              </div>
            </div>

            <dl className="grid gap-2 text-caption sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <dt className="text-neutral-400">Strongest metric</dt>
                <dd className="mt-1 font-semibold text-neutral-200">{dimension.strongestMetricLabel}</dd>
              </div>
              <div>
                <dt className="text-neutral-400">Weakest metric</dt>
                <dd className="mt-1 font-semibold text-neutral-200">{dimension.weakestMetricLabel}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
