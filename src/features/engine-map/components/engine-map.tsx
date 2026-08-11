"use client";

import { useState } from "react";
import { ArrowDown, ArrowRight, CheckCircle2, CircleDot, Database, GitBranch, Presentation, ShieldCheck } from "lucide-react";

import { buildEngineMapViewModel } from "@/features/engine-map/lib/build-engine-map-view-model";
import type { ArchitectureLayer, EngineStage, EngineStageId } from "@/features/engine-map/types/engine-map.types";

const viewModel = buildEngineMapViewModel();

const layerLabel: Record<ArchitectureLayer, string> = {
  domain: "Domain logic",
  orchestration: "Orchestration",
  presentation: "Presentation logic",
  "browser-session": "Browser / session",
};

const layerIcon: Record<ArchitectureLayer, typeof Database> = {
  domain: Database,
  orchestration: GitBranch,
  presentation: Presentation,
  "browser-session": ShieldCheck,
};

export function EngineMap() {
  const [selectedStageId, setSelectedStageId] = useState<EngineStageId>("validation");
  const selectedStage = viewModel.stages.find((stage) => stage.id === selectedStageId) ?? viewModel.stages[0];

  return (
    <div className="premium-workspace grid min-w-0 gap-9 premium-enter">
      <section className="border-b border-border pb-5" aria-labelledby="engine-map-overview">
        <p className="premium-kicker">Interactive architecture</p>
        <h2 className="mt-3 text-[clamp(2.25rem,4vw,4.25rem)] font-semibold tracking-tight text-neutral-50" id="engine-map-overview">One analytical engine, many experiences</h2>
        <p className="mt-2 max-w-3xl text-body text-neutral-300">{viewModel.overview}</p>
        <div aria-label="Architecture summary" className="mt-7 flex flex-wrap items-center gap-2 text-small font-semibold text-neutral-200">
          {["Input", "Validate", "Derive", "Calculate", "Evaluate", "Explain", "Present"].map((item, index, items) => (
            <span className="flex items-center gap-2" key={item}>
              <span className="border-b border-border px-3 py-2">{item}</span>
              {index < items.length - 1 ? <ArrowRight aria-hidden="true" className="h-4 w-4 text-primary" /> : null}
            </span>
          ))}
        </div>
      </section>

      <section aria-labelledby="engine-pipeline-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="premium-kicker">Interactive pipeline</p>
            <h2 className="mt-2 text-h2 font-semibold text-neutral-50" id="engine-pipeline-heading">Select an analytical stage</h2>
          </div>
          <p className="text-small text-neutral-400">The active stage updates the technical detail below.</p>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
          <EnginePipeline selectedStageId={selectedStageId} onSelect={setSelectedStageId} />
          <EngineStageDetail stage={selectedStage} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <ScenarioReuse />
        <DomainOwnership />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Provenance />
        <OutputConsumers />
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        <ArchitecturePrinciples />
        <TechnicalDetail />
      </section>
    </div>
  );
}

function EnginePipeline({ onSelect, selectedStageId }: { onSelect: (stageId: EngineStageId) => void; selectedStageId: EngineStageId }) {
  const selectedConnections = new Set(viewModel.connections.filter((connection) => connection.from === selectedStageId || connection.to === selectedStageId).flatMap((connection) => [connection.from, connection.to]));
  return (
    <div className="engine-map-canvas premium-panel overflow-hidden rounded-lg p-4 md:p-6">
      <ol aria-label="Financial analysis pipeline" className="engine-map-flow grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {viewModel.stages.map((stage, index) => {
          const active = stage.id === selectedStageId;
          const connected = selectedConnections.has(stage.id);
          const Icon = layerIcon[stage.layer];
          return (
            <li className="min-w-0" key={stage.id}>
              <button
                aria-pressed={active}
                className={`engine-map-node flex min-h-24 w-full items-start gap-3 border p-3 text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${active ? "is-active border-primary bg-primary/10 text-neutral-50 shadow-[0_0_22px_rgb(37_99_235/0.14)]" : connected ? "is-connected border-blue-400/45 bg-blue-500/5 text-neutral-200" : "border-border bg-background/35 text-neutral-300 hover:border-blue-400/40 hover:bg-blue-500/5"}`}
                onClick={() => onSelect(stage.id)}
                onMouseEnter={() => onSelect(stage.id)}
                type="button"
              >
                <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-caption uppercase text-neutral-400">{index + 1}. {layerLabel[stage.layer]}</span>
                  <span className="mt-1 block text-small font-semibold">{stage.label}</span>
                </span>
              </button>
              {index < viewModel.stages.length - 1 ? <ArrowDown aria-hidden="true" className="mx-auto my-1 h-4 w-4 text-neutral-500 sm:hidden" /> : null}
            </li>
          );
        })}
      </ol>
      <p className="mt-5 border-t border-border pt-3 text-caption text-neutral-400">Connections: input flows through validation, deterministic domain logic and orchestration before presentation-only consumers. Select a node to trace its immediate path.</p>
    </div>
  );
}

function EngineStageDetail({ stage }: { stage: EngineStage }) {
  const Icon = layerIcon[stage.layer];
  return (
    <aside aria-live="polite" aria-label="Selected engine stage detail" className="border border-border bg-surface-elevated p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-caption uppercase text-neutral-400">{layerLabel[stage.layer]}</p><h3 className="mt-1 text-h4 font-semibold text-neutral-50">{stage.label}</h3></div>
        <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
      </div>
      <p className="mt-3 text-small text-neutral-200">{stage.purpose}</p>
      <DetailList label="Inputs" values={stage.inputs} />
      <DetailList label="Outputs" values={stage.outputs} />
      <DetailList label="Important rules" values={stage.rules} />
      <p className="mt-3 border-t border-border pt-3 text-caption text-neutral-400"><span className="font-semibold text-neutral-200">Unavailable behavior:</span> {stage.unavailableBehavior}</p>
      <p className="mt-2 text-caption text-neutral-400"><span className="font-semibold text-neutral-200">Downstream:</span> {stage.consumers.join(", ")}</p>
    </aside>
  );
}

function DetailList({ label, values }: { label: string; values: string[] }) {
  return <div className="mt-3"><p className="text-caption uppercase text-neutral-400">{label}</p><ul className="mt-1 grid gap-1 text-caption text-neutral-200">{values.map((value) => <li key={value}>• {value}</li>)}</ul></div>;
}

function ScenarioReuse() {
  return (
    <section aria-labelledby="scenario-reuse-heading" className="scenario-reuse-map border border-border bg-surface p-4 md:p-5">
      <p className="text-caption uppercase text-neutral-400">Scenario reuse</p>
      <h2 className="mt-1 text-h4 font-semibold text-neutral-50" id="scenario-reuse-heading">Scenario Lab shares the analytical engine</h2>
      <div className="mt-4 grid gap-2">
        {viewModel.scenarioReuse.steps.map((step, index) => (
          <div className={`scenario-reuse-step flex items-center gap-3 border p-3 text-small ${step === "Same analysis engine" ? "border-primary bg-primary/10 font-semibold text-neutral-50" : "border-border bg-background/35 text-neutral-200"}`} key={step}>
            <span className="font-mono text-caption text-neutral-400">{index + 1}</span><span>{step}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 border-l-2 border-primary pl-3 text-small font-semibold text-neutral-100">{viewModel.scenarioReuse.statement}</p>
    </section>
  );
}

function DomainOwnership() {
  const layers: ArchitectureLayer[] = ["domain", "orchestration", "presentation", "browser-session"];
  return <section aria-labelledby="ownership-heading" className="border border-border bg-surface p-4 md:p-5"><p className="text-caption uppercase text-neutral-400">Ownership</p><h2 className="mt-1 text-h4 font-semibold text-neutral-50" id="ownership-heading">Domain logic stays outside React</h2><div className="mt-4 grid gap-3">{layers.map((layer) => { const Icon = layerIcon[layer]; return <div className="flex gap-3 border-b border-border pb-3 last:border-0 last:pb-0" key={layer}><Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><p className="text-small font-semibold text-neutral-50">{layerLabel[layer]}</p><p className="mt-1 text-caption text-neutral-300">{viewModel.stages.filter((stage) => stage.layer === layer).map((stage) => stage.shortLabel).join(" · ") || "Session recovery and storage boundaries"}</p></div></div>; })}</div></section>;
}

function Provenance() { return <section aria-labelledby="provenance-heading" className="border border-border bg-surface p-4 md:p-5"><p className="text-caption uppercase text-neutral-400">Traceability</p><h2 className="mt-1 text-h4 font-semibold text-neutral-50" id="provenance-heading">Follow outputs back to evidence</h2><div className="mt-4 grid gap-3">{viewModel.provenance.map((item) => <div className="border-l-2 border-primary/70 pl-3" key={item.output}><p className="text-small font-semibold text-neutral-50">{item.output}</p><p className="mt-1 text-caption text-neutral-300">{item.trace.join(" ← ")}</p></div>)}</div></section>; }

function OutputConsumers() { return <section aria-labelledby="consumers-heading" className="border border-border bg-surface p-4 md:p-5"><p className="text-caption uppercase text-neutral-400">Consumers</p><h2 className="mt-1 text-h4 font-semibold text-neutral-50" id="consumers-heading">One result, focused experiences</h2><div className="mt-4 grid gap-3 sm:grid-cols-3">{["Executive Dashboard", "DuPont Analysis", "Scenario Lab"].map((item) => <div className="border border-border bg-background/35 p-3" key={item}><CircleDot aria-hidden="true" className="h-4 w-4 text-primary" /><p className="mt-2 text-small font-semibold text-neutral-50">{item}</p><p className="mt-1 text-caption text-neutral-400">Presentation and view-model logic only.</p></div>)}</div></section>; }

function ArchitecturePrinciples() { return <section aria-labelledby="principles-heading" className="border border-border bg-surface p-4 md:p-5"><p className="text-caption uppercase text-neutral-400">Architecture principles</p><h2 className="mt-1 text-h4 font-semibold text-neutral-50" id="principles-heading">Constraints embodied by the implementation</h2><ul className="mt-4 grid gap-3 text-small text-neutral-200">{viewModel.principles.map((principle) => <li className="flex gap-2" key={principle}><CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{principle}</li>)}</ul></section>; }

function TechnicalDetail() { return <details className="border border-border bg-surface p-4 md:p-5"><summary className="cursor-pointer text-h4 font-semibold text-neutral-50">Technical architecture detail</summary><p className="mt-2 text-small text-neutral-300">Module names are secondary evidence for reviewers, not a second financial-methodology source.</p><div className="mt-4 grid gap-3">{viewModel.stages.map((stage) => <div className="border-b border-border pb-3 last:border-0" key={stage.id}><p className="text-small font-semibold text-neutral-50">{stage.label}</p><p className="mt-1 font-mono text-caption text-neutral-400">{stage.modules.join(" · ")}</p></div>)}</div><div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-caption text-neutral-300"><Count label="Implemented ratios" value={viewModel.counts.implementedRatios} /><Count label="Scoring dimensions" value={viewModel.counts.scoringDimensions} /><Count label="Configured scored metrics" value={viewModel.counts.scoredMetrics} /><Count label="Scenario controls" value={viewModel.counts.scenarioControls} /><Count label="Scenario presets" value={viewModel.counts.scenarioPresets} /></div></details>; }
function Count({ label, value }: { label: string; value: number }) { return <p><span className="font-mono text-body font-semibold tabular-nums text-neutral-50">{value}</span><span className="ml-2">{label}</span></p>; }
