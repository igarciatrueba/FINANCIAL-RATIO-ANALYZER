import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

import type { DupontAnalysisViewModel } from "@/features/dupont-analysis/types/dupont.types";

type RoeOverviewProps = {
  viewModel: DupontAnalysisViewModel;
};

function DirectionIcon({ direction }: { direction: DupontAnalysisViewModel["overview"]["direction"] }) {
  if (direction === "favourable") {
    return <ArrowUpRight aria-hidden="true" className="h-5 w-5 text-success" />;
  }

  if (direction === "unfavourable") {
    return <ArrowDownRight aria-hidden="true" className="h-5 w-5 text-danger" />;
  }

  return <ArrowRight aria-hidden="true" className="h-5 w-5 text-neutral-400" />;
}

export function RoeOverview({ viewModel }: RoeOverviewProps) {
  return (
    <section aria-label="Return on Equity overview" className="premium-panel rounded-lg p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="premium-kicker">Current ROE</p>
          <h2 className="mt-2 text-h2 font-semibold tracking-tight text-neutral-50">Return on Equity: what actually drives ROE?</h2>
          <p className="mt-5 font-mono text-[clamp(4rem,10vw,7rem)] font-semibold leading-none tracking-tight text-blue-200">
            {viewModel.overview.currentRoe.display}
          </p>
          <p className="mt-2 text-small text-neutral-300">Return on Equity for {viewModel.period.currentYear}</p>
        </div>
        <div className="border-l border-border pl-4">
          <p className="text-caption uppercase text-neutral-400">Identity reconciliation</p>
          <p className="mt-1 text-small font-semibold text-neutral-50">{viewModel.overview.reconciliationStatus}</p>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="border-t border-border pt-3">
          <dt className="text-caption text-neutral-400">Previous ROE</dt>
          <dd className="mt-1 font-mono text-small text-neutral-50">{viewModel.overview.previousRoe.display}</dd>
        </div>
        <div className="border-t border-border pt-3">
          <dt className="text-caption text-neutral-400">Change</dt>
          <dd className="mt-1 flex items-center gap-2 font-mono text-small text-neutral-50">
            <DirectionIcon direction={viewModel.overview.direction} />
            {viewModel.overview.change.display}
          </dd>
        </div>
        <div className="border-t border-border pt-3">
          <dt className="text-caption text-neutral-400">Direction</dt>
          <dd className="mt-1 text-small text-neutral-50">{viewModel.overview.directionLabel}</dd>
        </div>
      </dl>
    </section>
  );
}
