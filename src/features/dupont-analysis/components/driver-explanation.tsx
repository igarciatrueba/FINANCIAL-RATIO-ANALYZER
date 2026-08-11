import type { DupontAnalysisViewModel } from "@/features/dupont-analysis/types/dupont.types";

type DriverExplanationProps = {
  viewModel: DupontAnalysisViewModel;
};

export function DriverExplanation({ viewModel }: DriverExplanationProps) {
  const primary = viewModel.attribution.status === "unavailable" ? null : viewModel.attribution.primaryDriver;
  return (
    <section aria-label="Deterministic DuPont explanation" className="premium-panel rounded-lg p-6">
      <p className="premium-kicker">Primary driver</p>
      <h2 className="mt-3 text-h2 font-semibold tracking-tight text-neutral-50">{viewModel.explanation.headline}</h2>
      <p className="mt-3 text-small leading-6 text-neutral-300">{viewModel.explanation.text}</p>
      {primary ? <div className="mt-5 border-y border-primary/35 bg-primary/5 py-4"><p className="premium-kicker">Primary Shapley driver</p><p className="mt-2 text-h3 font-semibold text-neutral-50">{primary.label}</p><p className="mt-1 font-mono text-h4 font-semibold tabular-nums text-blue-200">{primary.value.display} contribution to ROE change</p></div> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="border-t border-border pt-3">
          <p className="text-caption uppercase text-neutral-400">Operating read</p>
          <p className="mt-1 text-small text-neutral-100">{viewModel.explanation.operatingContext}</p>
        </div>
        <div className="border-t border-border pt-3">
          <p className="text-caption uppercase text-neutral-400">Leverage context</p>
          <p className="mt-1 text-small text-neutral-100">{viewModel.leverageContext}</p>
        </div>
      </div>
    </section>
  );
}
