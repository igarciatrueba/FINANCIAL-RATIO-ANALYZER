import type { DupontAnalysisViewModel } from "@/features/dupont-analysis/types/dupont.types";

type FactorComparisonProps = {
  factors: DupontAnalysisViewModel["factorComparison"];
};

export function FactorComparison({ factors }: FactorComparisonProps) {
  return (
    <section aria-label="DuPont factor comparison" className="rounded-md border border-border bg-surface p-5">
      <p className="text-caption uppercase text-neutral-400">Current versus previous</p>
      <h2 className="mt-1 text-h4 font-semibold text-neutral-50">Three-factor comparison</h2>
      <div className="mt-4 grid gap-3">
        {factors.map((factor) => (
          <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center" key={factor.id}>
            <div>
              <p className="font-semibold text-neutral-50">{factor.label}</p>
              <p className="text-caption text-neutral-400">{factor.meaning}</p>
            </div>
            <div>
              <p className="text-caption text-neutral-400">Current</p>
              <p className="font-mono text-small text-neutral-50">{factor.current.display}</p>
            </div>
            <div>
              <p className="text-caption text-neutral-400">Previous</p>
              <p className="font-mono text-small text-neutral-50">{factor.previous.display}</p>
            </div>
            <div>
              <p className="text-caption text-neutral-400">Movement</p>
              <p className="font-mono text-small text-neutral-50">{factor.change.display}</p>
              <p className="text-caption text-neutral-300">{factor.directionLabel}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
