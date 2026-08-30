import { BarChart3, BookOpen, Braces, Database, Gauge, GitBranch, Lightbulb, PanelsTopLeft, ShieldCheck, SlidersHorizontal, Waypoints } from "lucide-react";

import type { EngineStage } from "@/features/engine-map/types/engine-map.types";

const icons = {
  input: Database,
  validation: ShieldCheck,
  derivation: Braces,
  ratios: Gauge,
  dupont: GitBranch,
  scoring: BarChart3,
  insights: Lightbulb,
  "analysis-result": Waypoints,
  dashboard: PanelsTopLeft,
  "ratio-analysis": Gauge,
  "dupont-analysis": GitBranch,
  "scenario-lab": SlidersHorizontal,
  methodology: BookOpen,
};

type EngineMapNodeProps = {
  stage: EngineStage;
  active: boolean;
  connected: boolean;
  dimmed?: boolean;
  onSelect: (stage: EngineStage) => void;
  compact?: boolean;
};

export function EngineMapNode({ stage, active, connected, dimmed = false, onSelect, compact = false }: EngineMapNodeProps) {
  const Icon = icons[stage.id];
  return (
    <button
      aria-pressed={active}
      aria-label={`${stage.label}. ${stage.purpose}`}
      className="architecture-node"
      data-accent={stage.accent}
      data-connected={connected || undefined}
      data-dimmed={dimmed || undefined}
      data-active={active || undefined}
      onClick={() => onSelect(stage)}
      onFocus={() => onSelect(stage)}
      type="button"
    >
      <span className="architecture-node-icon" aria-hidden="true"><Icon className="h-4 w-4" /></span>
      <span className="min-w-0 text-left">
        <span className="architecture-node-layer">{stage.layer === "core" ? "Analytical engine" : stage.kind === "surface" ? "Product surface" : stage.layer}</span>
        <span className={compact ? "architecture-node-title architecture-node-title-compact" : "architecture-node-title"}>{stage.label}</span>
        {!compact ? <span className="architecture-node-description">{stage.shortLabel === "Model" ? "Safe derived financial values" : stage.purpose}</span> : null}
      </span>
    </button>
  );
}
