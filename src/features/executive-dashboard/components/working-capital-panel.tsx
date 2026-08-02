import type { DashboardWorkingCapitalViewModel } from "@/features/executive-dashboard/types/dashboard.types";

type WorkingCapitalPanelProps = {
  workingCapital: DashboardWorkingCapitalViewModel;
};

export function WorkingCapitalPanel({ workingCapital }: WorkingCapitalPanelProps) {
  return (
    <section aria-label="Working capital cycle" className="rounded-md border border-border bg-surface p-5 md:p-6" role="region">
      <div>
        <p className="text-caption uppercase text-neutral-400">Working capital cycle</p>
        <h2 className="mt-1 text-h4 font-semibold text-neutral-50">DSO, DIO, DPO and CCC</h2>
        <p className="mt-2 text-small text-neutral-400">{workingCapital.explanation}</p>
      </div>

      <p className="mt-5 rounded-sm border border-border bg-background/35 p-3 font-mono text-small font-semibold tabular-nums text-neutral-50">
        {workingCapital.equation}
      </p>

      <div className="mt-5 grid gap-3">
        {workingCapital.metrics.map((metric) => (
          <div className="grid gap-3 rounded-sm border border-border bg-background/35 p-4 md:grid-cols-[180px_minmax(0,1fr)_180px]" key={metric.metricId}>
            <div>
              <h3 className="text-small font-semibold text-neutral-50">{metric.label}</h3>
              <p className="mt-1 text-caption text-neutral-400">Previous {metric.previousValue.display}</p>
            </div>
            <div className="self-center">
              <div className="h-2 rounded-sm bg-neutral-800" aria-hidden="true">
                {metric.relativePosition === null ? (
                  <div className="h-2 rounded-sm border border-dashed border-neutral-600" />
                ) : (
                  <div className="h-2 rounded-sm bg-information" style={{ width: `${metric.relativePosition}%` }} />
                )}
              </div>
            </div>
            <div className="md:text-right">
              <p className="font-mono text-h4 font-semibold tabular-nums text-neutral-50">{metric.currentValue.display}</p>
              <p className="text-caption text-neutral-400">
                {metric.direction}; change {metric.change.display}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
