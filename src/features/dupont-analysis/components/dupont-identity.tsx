import type { CSSProperties } from "react";

import type { DupontAnalysisViewModel } from "@/features/dupont-analysis/types/dupont.types";

type DupontIdentityProps = {
  viewModel: DupontAnalysisViewModel;
};

export function DupontIdentity({ viewModel }: DupontIdentityProps) {
  return (
    <section aria-label="DuPont identity" className="border-y border-border py-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="premium-kicker">Three-step identity</p>
          <h2 className="mt-2 text-h2 font-semibold tracking-tight text-neutral-50">ROE decomposition</h2>
        </div>
        <p className="max-w-[520px] text-small text-neutral-300">{viewModel.identity.reconciliationText}</p>
      </div>

      <p className="sr-only">{viewModel.identity.text}</p>
      <div className="dupont-network mt-7 grid min-w-0 gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch">
        {viewModel.identity.factors.map((factor, index) => (
          <div className="contents premium-dupont-reveal" key={factor.id} style={{ "--dupont-delay": `${index * 100}ms` } as CSSProperties}>
            <article className="dupont-factor min-w-0 border-t border-border py-5 outline-none lg:border-y lg:px-4" tabIndex={0}>
              <p className="premium-kicker">{factor.label}</p>
              <p className="mt-3 font-mono text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-none text-neutral-50">{factor.current.display}</p>
              <p className="mt-1 text-caption text-neutral-400">Prior {factor.previous.display}</p>
              <p className="mt-3 text-small text-neutral-300">{factor.meaning}</p>
              <p className="mt-2 text-caption text-neutral-300">
                {factor.change.display} · {factor.directionLabel}
              </p>
            </article>
            {index < viewModel.identity.factors.length - 1 ? (
              <div className="premium-dupont-reveal flex items-center justify-center text-h2 text-blue-300" aria-hidden="true" style={{ "--dupont-delay": `${index * 100 + 60}ms` } as CSSProperties}>
                ×
              </div>
            ) : (
              <div className="premium-dupont-reveal flex items-center justify-center text-h2 text-blue-300" aria-hidden="true" style={{ "--dupont-delay": `${index * 100 + 60}ms` } as CSSProperties}>
                =
              </div>
            )}
          </div>
        ))}
        <article className="crystal-surface premium-dupont-reveal min-w-0 rounded-md p-5" style={{ "--dupont-delay": "360ms" } as CSSProperties}>
          <p className="premium-kicker">Return on Equity</p>
          <p className="mt-3 font-mono text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-none text-neutral-50">{viewModel.identity.result.display}</p>
          <p className="mt-3 text-small text-neutral-200">Current ROE produced by the factor product.</p>
        </article>
      </div>
    </section>
  );
}
