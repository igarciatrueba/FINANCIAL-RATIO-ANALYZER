import { ChartContainer } from "@/features/executive-dashboard/charts/chart-container";
import { buildDupontAttributionOption } from "@/features/dupont-analysis/charts/dupont-chart-options";
import type { DupontAttributionViewModel } from "@/features/dupont-analysis/types/dupont.types";

type DriverAttributionChartProps = {
  attribution: DupontAttributionViewModel;
};

export function DriverAttributionChart({ attribution }: DriverAttributionChartProps) {
  return (
    <section aria-label="ROE driver attribution">
      <ChartContainer
        accessibleDescription="Exact Shapley contribution of each DuPont factor to the current versus previous ROE change."
        accessibleName="ROE driver attribution"
        emptyMessage={attribution.status === "unavailable" ? attribution.reason : undefined}
        heightClassName="h-72"
        isEmpty={attribution.status === "unavailable"}
        option={buildDupontAttributionOption(attribution)}
        summary={
          <div className="grid gap-3 text-small text-neutral-300">
            <p>{attribution.summary}</p>
            {attribution.status !== "unavailable" ? (
              <dl className="grid gap-2 sm:grid-cols-4">
                {attribution.contributions.map((contribution) => (
                  <div className="border-t border-border pt-2" key={contribution.factorId}>
                    <dt className="text-caption text-neutral-400">{contribution.label}</dt>
                    <dd className="font-mono text-neutral-50">{contribution.value.display}</dd>
                  </div>
                ))}
                <div className="border-t border-border pt-2">
                  <dt className="text-caption text-neutral-400">Total ROE change</dt>
                  <dd className="font-mono text-neutral-50">{attribution.totalChange.display}</dd>
                </div>
              </dl>
            ) : null}
            <div className="rounded-sm border border-border bg-background/35 p-3">
              <p className="text-caption uppercase text-neutral-400">{attribution.reconciliation.label}</p>
              <p className="mt-1 text-small font-semibold text-neutral-50">{attribution.reconciliation.statusLabel}</p>
              <p className="mt-2 text-caption text-neutral-300">{attribution.reconciliation.equation}</p>
              <dl className="mt-3 grid gap-2 sm:grid-cols-4">
                <div>
                  <dt className="text-caption text-neutral-400">Total attributed change</dt>
                  <dd className="font-mono text-small text-neutral-50">
                    {attribution.reconciliation.totalAttributedChange.display}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption text-neutral-400">Actual ROE change</dt>
                  <dd className="font-mono text-small text-neutral-50">{attribution.reconciliation.actualRoeChange.display}</dd>
                </div>
                <div>
                  <dt className="text-caption text-neutral-400">Difference</dt>
                  <dd className="font-mono text-small text-neutral-50">{attribution.reconciliation.difference.display}</dd>
                </div>
                <div>
                  <dt className="text-caption text-neutral-400">Tolerance</dt>
                  <dd className="font-mono text-small text-neutral-50">{attribution.reconciliation.tolerance.display}</dd>
                </div>
              </dl>
            </div>
          </div>
        }
      />
    </section>
  );
}
