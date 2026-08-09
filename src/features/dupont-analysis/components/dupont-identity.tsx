import type { DupontAnalysisViewModel } from "@/features/dupont-analysis/types/dupont.types";

type DupontIdentityProps = {
  viewModel: DupontAnalysisViewModel;
};

export function DupontIdentity({ viewModel }: DupontIdentityProps) {
  return (
    <section aria-label="DuPont identity" className="rounded-md border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-caption uppercase text-neutral-400">Three-step identity</p>
          <h2 className="mt-1 text-h3 font-semibold text-neutral-50">ROE decomposition</h2>
        </div>
        <p className="max-w-[520px] text-small text-neutral-300">{viewModel.identity.reconciliationText}</p>
      </div>

      <p className="sr-only">{viewModel.identity.text}</p>
      <div className="mt-5 grid min-w-0 gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch">
        {viewModel.identity.factors.map((factor, index) => (
          <div className="contents" key={factor.id}>
            <article className="min-w-0 rounded-sm border border-border bg-background/35 p-4">
              <p className="text-caption uppercase text-neutral-400">{factor.label}</p>
              <p className="mt-2 font-mono text-h3 font-semibold text-neutral-50">{factor.current.display}</p>
              <p className="mt-1 text-caption text-neutral-400">Prior {factor.previous.display}</p>
              <p className="mt-3 text-small text-neutral-300">{factor.meaning}</p>
              <p className="mt-2 text-caption text-neutral-300">
                {factor.change.display} · {factor.directionLabel}
              </p>
            </article>
            {index < viewModel.identity.factors.length - 1 ? (
              <div className="flex items-center justify-center text-h3 text-neutral-300" aria-hidden="true">
                ×
              </div>
            ) : (
              <div className="flex items-center justify-center text-h3 text-neutral-300" aria-hidden="true">
                =
              </div>
            )}
          </div>
        ))}
        <article className="min-w-0 rounded-sm border border-primary/40 bg-primary/10 p-4">
          <p className="text-caption uppercase text-neutral-300">Return on Equity</p>
          <p className="mt-2 font-mono text-h3 font-semibold text-neutral-50">{viewModel.identity.result.display}</p>
          <p className="mt-3 text-small text-neutral-200">Current ROE produced by the factor product.</p>
        </article>
      </div>
    </section>
  );
}
