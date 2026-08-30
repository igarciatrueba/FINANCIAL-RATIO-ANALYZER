import { DriverAttributionChart } from "@/features/dupont-analysis/components/driver-attribution-chart";
import { DriverExplanation } from "@/features/dupont-analysis/components/driver-explanation";
import { DupontContextBar } from "@/features/dupont-analysis/components/dupont-context-bar";
import { DupontIdentity } from "@/features/dupont-analysis/components/dupont-identity";
import { DupontMethodology } from "@/features/dupont-analysis/components/dupont-methodology";
import { FactorComparison } from "@/features/dupont-analysis/components/factor-comparison";
import { FactorTrends } from "@/features/dupont-analysis/components/factor-trends";
import { RoeOverview } from "@/features/dupont-analysis/components/roe-overview";
import type { DupontAnalysisViewModel } from "@/features/dupont-analysis/types/dupont.types";

type DupontAnalysisProps = {
  viewModel: DupontAnalysisViewModel;
};

export function DupontAnalysis({ viewModel }: DupontAnalysisProps) {
  return (
    <div className="premium-workspace premium-ambient grid min-w-0 gap-8 premium-enter">
      <DupontContextBar viewModel={viewModel} />

      <div className="grid min-w-0 gap-5 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-5">
          <RoeOverview viewModel={viewModel} />
        </div>
        <div className="min-w-0 lg:col-span-7">
          <DriverExplanation viewModel={viewModel} />
        </div>
      </div>

      <DupontIdentity viewModel={viewModel} />

      <div className="grid min-w-0 gap-5 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-5">
          <FactorComparison factors={viewModel.factorComparison} />
        </div>
        <div className="min-w-0 xl:col-span-7">
          <DriverAttributionChart attribution={viewModel.attribution} />
        </div>
      </div>

      <FactorTrends trends={viewModel.trends} />
      <DupontMethodology methodology={viewModel.methodology} />
    </div>
  );
}
