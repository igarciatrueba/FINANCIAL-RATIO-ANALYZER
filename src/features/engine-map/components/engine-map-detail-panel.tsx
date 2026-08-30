import Link from "next/link";
import { ArrowRight, Boxes, X } from "lucide-react";

import type { EngineStage } from "@/features/engine-map/types/engine-map.types";

export function EngineMapDetailPanel({ onDismiss, stage }: { onDismiss: () => void; stage: EngineStage }) {
  return (
    <aside aria-live="polite" aria-label="Selected architecture detail" className="architecture-context-panel" data-accent={stage.accent}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="premium-kicker">Selected {stage.kind === "surface" ? "experience" : "component"}</p>
          <h3 className="mt-2 text-h3 font-semibold text-neutral-50">{stage.label}</h3>
        </div>
        <div className="flex items-center gap-2"><Boxes aria-hidden="true" className="h-5 w-5 shrink-0 text-information" /><button aria-label="Close selected architecture detail" className="architecture-detail-close" onClick={onDismiss} type="button"><X aria-hidden="true" className="h-4 w-4" /></button></div>
      </div>
      <p className="mt-3 text-small leading-6 text-neutral-200">{stage.purpose}</p>
      <div className="mt-5 grid gap-4 border-y border-border py-4 sm:grid-cols-2">
        <DetailList label="Receives" values={stage.inputs} />
        <DetailList label="Produces" values={stage.outputs} />
      </div>
      <div className="mt-4">
        <p className="text-caption font-semibold uppercase tracking-[0.11em] text-neutral-500">System guarantees</p>
        <ul className="mt-2 grid gap-1.5 text-caption leading-5 text-neutral-300">{stage.rules.map((rule) => <li key={rule}>• {rule}</li>)}</ul>
      </div>
      <p className="mt-4 border-l border-information/60 pl-3 text-caption leading-5 text-neutral-400"><span className="font-semibold text-neutral-200">Unavailable state:</span> {stage.unavailableBehavior}</p>
      {stage.route && stage.routeLabel ? <Link className="mt-5 inline-flex items-center gap-2 text-small font-semibold text-blue-200 hover:text-white" href={stage.route}>{stage.routeLabel}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link> : null}
    </aside>
  );
}

function DetailList({ label, values }: { label: string; values: string[] }) {
  return <div><p className="text-caption font-semibold uppercase tracking-[0.11em] text-neutral-500">{label}</p><ul className="mt-1.5 grid gap-1 text-caption leading-5 text-neutral-200">{values.map((value) => <li key={value}>{value}</li>)}</ul></div>;
}
