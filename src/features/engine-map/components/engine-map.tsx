"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, CircleDot, Info } from "lucide-react";

import { EngineMapConnectors, engineMapDesktopPoints } from "@/features/engine-map/components/engine-map-connectors";
import { EngineMapDetailPanel } from "@/features/engine-map/components/engine-map-detail-panel";
import { EngineMapNode } from "@/features/engine-map/components/engine-map-node";
import { buildEngineMapViewModel } from "@/features/engine-map/lib/build-engine-map-view-model";
import { getActiveConnectionIds, getActiveRouteStageIds } from "@/features/engine-map/lib/get-active-route";
import type { EngineStage, EngineStageId } from "@/features/engine-map/types/engine-map.types";

const viewModel = buildEngineMapViewModel();

export function EngineMap() {
  const [selectedStageId, setSelectedStageId] = useState<EngineStageId | null>(null);
  const selectedStage = viewModel.stages.find((stage) => stage.id === selectedStageId);
  const activeStageIds = useMemo(() => selectedStageId ? getActiveRouteStageIds(viewModel.connections, selectedStageId) : new Set<EngineStageId>(), [selectedStageId]);
  const activeConnectionIds = useMemo(() => getActiveConnectionIds(viewModel.connections, activeStageIds), [activeStageIds]);

  return (
    <div className="premium-workspace premium-ambient grid min-w-0 gap-10 premium-enter">
      <section className="engine-map-hero" aria-labelledby="engine-map-overview">
        <p className="premium-kicker">Engine Map</p>
        <h2 className="mt-3 max-w-4xl text-[clamp(2.35rem,5vw,4.9rem)] font-semibold leading-[1.02] tracking-tight text-neutral-50" id="engine-map-overview">See how financial data becomes financial intelligence.</h2>
        <p className="mt-5 max-w-3xl text-body leading-7 text-neutral-300">{viewModel.overview}</p>
        <div className="engine-map-layer-legend mt-7" aria-label="Architecture layers">
          {viewModel.layers.map((layer) => <span key={layer.id}><i aria-hidden="true" data-layer={layer.id} />{layer.label}</span>)}
        </div>
      </section>

      <section aria-labelledby="engine-map-canvas-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="premium-kicker">Interactive architecture</p>
            <h2 className="mt-2 text-h2 font-semibold text-neutral-50" id="engine-map-canvas-heading">Follow a connected route</h2>
          </div>
          <p className="max-w-md text-small leading-6 text-neutral-400">Select a node to illuminate its upstream inputs, downstream consumers and its exact role in the system.</p>
        </div>
        <div className="mt-5">
          <EngineMapGraph activeConnectionIds={activeConnectionIds} activeStageIds={activeStageIds} onSelect={(stage) => setSelectedStageId(stage.id)} selectedStageId={selectedStageId} />
          {selectedStage ? <EngineMapDetailPanel onDismiss={() => setSelectedStageId(null)} stage={selectedStage} /> : <p className="architecture-selection-prompt" role="status">Select an architecture node to inspect its inputs, outputs and system guarantees.</p>}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.14fr)_minmax(0,.86fr)]">
        <ScenarioReuse />
        <ArchitecturePrinciples />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Provenance />
        <TechnicalDetail />
      </section>
    </div>
  );
}

function EngineMapGraph({ activeConnectionIds, activeStageIds, onSelect, selectedStageId }: { activeConnectionIds: Set<string>; activeStageIds: Set<EngineStageId>; onSelect: (stage: EngineStage) => void; selectedStageId: EngineStageId | null }) {
  return (
    <div className="architecture-map-shell" aria-describedby="architecture-map-summary">
      <div className="architecture-map-desktop">
        <EngineMapConnectors activeConnectionIds={activeConnectionIds} connections={viewModel.connections} />
        {viewModel.layers.map((layer) => <p className="architecture-map-layer-label" data-layer={layer.id} key={layer.id}>{layer.label}</p>)}
        {viewModel.stages.map((stage) => {
          const point = engineMapDesktopPoints[stage.id];
          const active = stage.id === selectedStageId;
          const connected = activeStageIds.has(stage.id);
          return <div className="architecture-map-position" key={stage.id} style={{ "--map-x": `${point.x}%`, "--map-y": `${point.y}%` } as React.CSSProperties}><EngineMapNode active={active} connected={connected} dimmed={Boolean(selectedStageId) && !connected} onSelect={onSelect} stage={stage} /></div>;
        })}
      </div>
      <p className="architecture-map-summary" id="architecture-map-summary">Architecture flow: Financial input passes strict canonical validation, a shared financial model powers ratios, DuPont, scoring and insights, orchestration assembles one result, then focused product experiences present it.</p>
    </div>
  );
}

function ScenarioReuse() {
  return <section aria-labelledby="scenario-reuse-heading" className="architecture-secondary-panel"><p className="premium-kicker">Scenario route</p><h2 className="mt-2 text-h4 font-semibold text-neutral-50" id="scenario-reuse-heading">Scenario Lab re-enters the same validated engine</h2><div className="architecture-scenario-route mt-5">{viewModel.scenarioReuse.steps.map((step, index) => <div key={step}><span className="font-mono text-caption text-blue-300">{String(index + 1).padStart(2, "0")}</span><span>{step}</span>{index < viewModel.scenarioReuse.steps.length - 1 ? <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /> : null}</div>)}</div><p className="mt-5 border-l border-information/65 pl-4 text-small leading-6 text-neutral-200">{viewModel.scenarioReuse.statement}</p></section>;
}

function ArchitecturePrinciples() {
  return <section aria-labelledby="principles-heading" className="architecture-secondary-panel"><p className="premium-kicker">Built-in constraints</p><h2 className="mt-2 text-h4 font-semibold text-neutral-50" id="principles-heading">Architecture keeps the financial boundary visible</h2><ul className="mt-5 grid gap-3 text-small leading-6 text-neutral-200">{viewModel.principles.map((principle) => <li className="flex gap-2.5" key={principle}><CheckCircle2 aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-information" />{principle}</li>)}</ul></section>;
}

function Provenance() {
  return <section aria-labelledby="provenance-heading" className="architecture-secondary-panel"><p className="premium-kicker">Traceability</p><h2 className="mt-2 text-h4 font-semibold text-neutral-50" id="provenance-heading">Every output keeps an evidence path</h2><div className="mt-5 grid gap-4">{viewModel.provenance.map((item) => <div className="architecture-provenance-row" key={item.output}><CircleDot aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-information" /><div><p className="text-small font-semibold text-neutral-50">{item.output}</p><p className="mt-1 text-caption leading-5 text-neutral-400">{item.trace.join("  ←  ")}</p></div></div>)}</div></section>;
}

function TechnicalDetail() {
  return <details className="architecture-technical-detail"><summary><span><span className="premium-kicker">Implementation evidence</span><span className="mt-2 block text-h4 font-semibold text-neutral-50">Technical architecture detail</span></span><Info aria-hidden="true" className="h-4 w-4 text-information" /></summary><p className="mt-4 text-small leading-6 text-neutral-300">Module names are evidence for reviewers, not a second financial-methodology source.</p><div className="mt-5 grid gap-3">{viewModel.stages.map((stage) => <div className="border-b border-border pb-3 last:border-0" key={stage.id}><p className="text-small font-semibold text-neutral-50">{stage.label}</p><p className="mt-1 font-mono text-caption leading-5 text-neutral-400">{stage.modules.join(" · ")}</p></div>)}</div><div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-caption text-neutral-300"><Count label="Implemented ratios" value={viewModel.counts.implementedRatios} /><Count label="Scoring dimensions" value={viewModel.counts.scoringDimensions} /><Count label="Configured metrics" value={viewModel.counts.scoredMetrics} /><Count label="Scenario controls" value={viewModel.counts.scenarioControls} /><Count label="Scenario presets" value={viewModel.counts.scenarioPresets} /></div></details>;
}

function Count({ label, value }: { label: string; value: number }) { return <p><span className="font-mono text-body font-semibold tabular-nums text-neutral-50">{value}</span><span className="ml-2">{label}</span></p>; }
