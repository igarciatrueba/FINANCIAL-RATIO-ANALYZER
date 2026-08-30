"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";

import { EngineMapNode } from "@/features/engine-map/components/engine-map-node";
import { buildEngineMapViewModel } from "@/features/engine-map/lib/build-engine-map-view-model";
import { getActiveRouteStageIds } from "@/features/engine-map/lib/get-active-route";
import type { EngineStage, EngineStageId } from "@/features/engine-map/types/engine-map.types";

const viewModel = buildEngineMapViewModel();

export function LandingEngineMapPreview() {
  const [selectedStageId, setSelectedStageId] = useState<EngineStageId>("analysis-result");
  const activeStageIds = useMemo(() => getActiveRouteStageIds(viewModel.connections, selectedStageId), [selectedStageId]);
  const byId = (id: EngineStageId) => viewModel.stages.find((stage) => stage.id === id)!;
  const select = (stage: EngineStage) => setSelectedStageId(stage.id);
  const selectedStage = byId(selectedStageId);

  return (
    <section className="landing-engine-preview" aria-labelledby="landing-engine-heading">
      <div className="max-w-3xl"><p className="premium-kicker">Engine Map</p><h2 className="mt-3 text-h1 font-semibold leading-tight" id="landing-engine-heading">One engine. Many financial insights.</h2><p className="landing-description mt-5 text-body text-neutral-400">Normalised financial data moves through deterministic engines, then becomes focused views for the questions a finance team actually needs to answer.</p></div>
      <div className="landing-engine-stage mt-10">
        <div className="landing-engine-rail" aria-label="Condensed financial architecture preview">
          <div className="landing-engine-column"><p className="landing-engine-label">Financial data</p><EngineMapNode active={selectedStageId === "input"} compact connected={activeStageIds.has("input")} dimmed={!activeStageIds.has("input")} onSelect={select} stage={byId("input")} /></div>
          <div className="landing-engine-arrow" aria-hidden="true"><ArrowRight /></div>
          <div className="landing-engine-column"><p className="landing-engine-label">Integrity</p><EngineMapNode active={selectedStageId === "validation"} compact connected={activeStageIds.has("validation")} dimmed={!activeStageIds.has("validation")} onSelect={select} stage={byId("validation")} /><div className="mt-2"><EngineMapNode active={selectedStageId === "derivation"} compact connected={activeStageIds.has("derivation")} dimmed={!activeStageIds.has("derivation")} onSelect={select} stage={byId("derivation")} /></div></div>
          <div className="landing-engine-arrow" aria-hidden="true"><ArrowRight /></div>
          <div className="landing-engine-column landing-engine-core"><p className="landing-engine-label">Analytical core</p><div className="grid grid-cols-2 gap-2">{viewModel.landing.coreStageIds.map((id) => <EngineMapNode active={selectedStageId === id} compact connected={activeStageIds.has(id)} dimmed={!activeStageIds.has(id)} key={id} onSelect={select} stage={byId(id)} />)}</div></div>
          <div className="landing-engine-arrow" aria-hidden="true"><ArrowRight /></div>
          <div className="landing-engine-column"><p className="landing-engine-label">Orchestration</p><EngineMapNode active={selectedStageId === "analysis-result"} compact connected={activeStageIds.has("analysis-result")} dimmed={!activeStageIds.has("analysis-result")} onSelect={select} stage={byId("analysis-result")} /></div>
          <div className="landing-engine-arrow" aria-hidden="true"><ArrowRight /></div>
          <div className="landing-engine-column landing-engine-outputs"><p className="landing-engine-label">Experiences</p><div className="grid grid-cols-2 gap-2">{viewModel.landing.outputStageIds.map((id) => <EngineMapNode active={selectedStageId === id} compact connected={activeStageIds.has(id)} dimmed={!activeStageIds.has(id)} key={id} onSelect={select} stage={byId(id)} />)}</div></div>
        </div>
        <p className="landing-description mt-5 max-w-2xl text-small leading-6 text-neutral-300"><span className="font-semibold text-blue-200">{selectedStage.label}:</span> {selectedStage.purpose}</p>
      </div>
      <Link className="mt-8 inline-flex items-center gap-2 text-small font-semibold text-blue-200 hover:text-white" href="/engine-map">Explore the engine <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
    </section>
  );
}
