export type EngineStageId =
  | "input"
  | "validation"
  | "derivation"
  | "ratios"
  | "dupont"
  | "scoring"
  | "insights"
  | "analysis-result"
  | "dashboard"
  | "ratio-analysis"
  | "dupont-analysis"
  | "scenario-lab"
  | "methodology";

export type ArchitectureLayer = "input" | "validation" | "core" | "orchestration" | "product";
export type EngineStageKind = "data" | "gateway" | "engine" | "orchestrator" | "surface";
export type EngineAccent = "blue" | "violet" | "cyan" | "green" | "slate";

export type EngineStage = {
  id: EngineStageId;
  label: string;
  shortLabel: string;
  layer: ArchitectureLayer;
  kind: EngineStageKind;
  accent: EngineAccent;
  purpose: string;
  inputs: string[];
  outputs: string[];
  rules: string[];
  unavailableBehavior: string;
  modules: string[];
  consumers: string[];
  route?: string;
  routeLabel?: string;
};

export type EngineConnection = {
  id: string;
  from: EngineStageId;
  to: EngineStageId;
  label?: string;
};

export type EngineMapViewModel = {
  overview: string;
  layers: Array<{ id: ArchitectureLayer; label: string; description: string }>;
  stages: EngineStage[];
  connections: EngineConnection[];
  counts: {
    implementedRatios: number;
    scoringDimensions: number;
    scoredMetrics: number;
    scenarioControls: number;
    scenarioPresets: number;
  };
  landing: {
    coreStageIds: EngineStageId[];
    outputStageIds: EngineStageId[];
  };
  scenarioReuse: {
    steps: string[];
    statement: string;
  };
  provenance: Array<{ output: string; trace: string[] }>;
  principles: string[];
};
