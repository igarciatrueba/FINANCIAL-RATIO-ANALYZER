import { ChartContainer } from "@/features/executive-dashboard/charts/chart-container";
import { buildDupontFactorTrendOption } from "@/features/dupont-analysis/charts/dupont-chart-options";
import type { DupontFactorTrendViewModel } from "@/features/dupont-analysis/types/dupont.types";

type FactorTrendsProps = {
  trends: DupontFactorTrendViewModel;
};

export function FactorTrends({ trends }: FactorTrendsProps) {
  return (
    <section aria-label="Three-year DuPont factor trends">
      <ChartContainer
        accessibleDescription="Indexed presentation-only trend lines for ROE, margin, asset turnover and leverage across all three reporting periods."
        accessibleName="Three-year DuPont factor trends"
        heightClassName="h-72"
        option={buildDupontFactorTrendOption(trends)}
        summary={
          <div className="grid gap-3">
            <div className="rounded-sm border border-border bg-background/35 p-3">
              <p className="text-caption uppercase text-neutral-400">{trends.indexDisclosure.title}</p>
              <p className="mt-1 text-small font-semibold text-neutral-50">{trends.indexDisclosure.summary}</p>
              <p className="mt-1 text-caption text-neutral-300">{trends.indexDisclosure.detail}</p>
            </div>
            <p className="text-small text-neutral-300">{trends.summary}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {trends.series.map((series) => (
                <div className="border-t border-border pt-2" key={series.id}>
                  <p className="text-caption uppercase text-neutral-400">{series.label}</p>
                  <p className="mt-1 text-caption text-neutral-400">
                    {series.baseYear === null ? "Index base unavailable" : `Index base: ${series.baseYear} = 100`}
                  </p>
                  <p className="mt-1 text-small text-neutral-300">
                    {series.points.map((point) => `${point.year}: ${point.displayValue}`).join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        }
      />
    </section>
  );
}
