import type { DupontAnalysisViewModel } from "@/features/dupont-analysis/types/dupont.types";

type DupontMethodologyProps = {
  methodology: DupontAnalysisViewModel["methodology"];
};

export function DupontMethodology({ methodology }: DupontMethodologyProps) {
  return (
    <section aria-label="DuPont methodology" className="rounded-md border border-border bg-surface p-5">
      <details className="group">
        <summary
          className="cursor-pointer text-h4 font-semibold text-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          role="button"
        >
          Formula and methodology
        </summary>
        <div className="mt-4 grid gap-4 text-small leading-6 text-neutral-300">
          <p className="font-technical text-neutral-50">{methodology.identity}</p>
          <ul className="grid gap-2">
            {methodology.factorDefinitions.map((definition) => (
              <li key={definition}>{definition}</li>
            ))}
          </ul>
          <p>{methodology.averageBalanceConvention}</p>
          <p>{methodology.attributionMethod}</p>
          <p>{methodology.tolerance}</p>
          <p>{methodology.unavailableConditions}</p>
          <p className="border-t border-border pt-3 text-caption text-neutral-400">{methodology.disclaimer}</p>
        </div>
      </details>
    </section>
  );
}
