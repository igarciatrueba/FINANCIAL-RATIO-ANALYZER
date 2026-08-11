import { AnalysisCommandBar } from "@/features/executive-dashboard/components/analysis-command-bar";
import { DetailedRatioTable } from "@/features/executive-dashboard/components/detailed-ratio-table";
import { DimensionOverview } from "@/features/executive-dashboard/components/dimension-overview";
import { DimensionRadarChart } from "@/features/executive-dashboard/components/dimension-radar-chart";
import { ExecutiveDiagnosis } from "@/features/executive-dashboard/components/executive-diagnosis";
import { ExecutiveInsightCards } from "@/features/executive-dashboard/components/executive-insight-cards";
import { HealthScorePanel } from "@/features/executive-dashboard/components/health-score-panel";
import { HealthTrendChart } from "@/features/executive-dashboard/components/health-trend-chart";
import { KpiSummary } from "@/features/executive-dashboard/components/kpi-summary";
import { ProfitabilityWaterfallChart } from "@/features/executive-dashboard/components/profitability-waterfall-chart";
import { RatioTrendExplorer } from "@/features/executive-dashboard/components/ratio-trend-explorer";
import { ScoreContributionChart } from "@/features/executive-dashboard/components/score-contribution-chart";
import { WorkingCapitalPanel } from "@/features/executive-dashboard/components/working-capital-panel";
import type { ExecutiveDashboardViewModel } from "@/features/executive-dashboard/types/dashboard.types";

type ExecutiveDashboardProps = {
  viewModel: ExecutiveDashboardViewModel;
};

export function ExecutiveDashboard({ viewModel }: ExecutiveDashboardProps) {
  return (
    <div className="premium-workspace grid min-w-0 gap-8 premium-enter">
      <AnalysisCommandBar viewModel={viewModel} />

      <div className="grid min-w-0 gap-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-5">
          <HealthScorePanel viewModel={viewModel} />
        </div>
        <div className="min-w-0 lg:col-span-7">
          <ExecutiveDiagnosis viewModel={viewModel} />
        </div>
      </div>

      <section className="border-y border-border py-8" aria-label="What matters">
        <div className="mb-6 flex items-end justify-between gap-4"><div><p className="premium-kicker">What matters</p><h2 className="mt-2 text-h2 font-semibold tracking-tight text-white">The principal financial signals</h2></div><p className="max-w-sm text-small text-neutral-400">Fixed rules, structured evidence and no generated narrative.</p></div>
        <div className="grid min-w-0 gap-8 xl:grid-cols-2">
          <ExecutiveInsightCards insights={viewModel.principalStrengths} title="Strengths" type="strength" />
          <ExecutiveInsightCards insights={viewModel.principalRisks} title="Risks" type="risk" />
        </div>
      </section>

      <KpiSummary kpis={viewModel.kpis} />

      <div className="grid min-w-0 gap-5 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-7">
          <DimensionOverview dimensions={viewModel.dimensions} />
        </div>
        <div className="grid min-w-0 gap-5 xl:col-span-5">
          <DimensionRadarChart radar={viewModel.dimensionRadar} />
          <HealthTrendChart trend={viewModel.healthTrend} />
        </div>
      </div>

      <RatioTrendExplorer ratioTrend={viewModel.ratioTrend} />

      <div className="grid min-w-0 gap-5 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-7">
          <ProfitabilityWaterfallChart waterfall={viewModel.profitabilityWaterfall} />
        </div>
        <div className="min-w-0 xl:col-span-5">
          <WorkingCapitalPanel workingCapital={viewModel.workingCapital} />
        </div>
      </div>

      <ScoreContributionChart scoreContribution={viewModel.scoreContribution} />

      <DetailedRatioTable ratioTable={viewModel.ratioTable} />
    </div>
  );
}
