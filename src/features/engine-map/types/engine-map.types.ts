export type EngineStageId =
  | "input"
  | "validation"
  | "derivation"
  | "ratios"
  | "dupont"
  | "scoring"
  | "insights"
  | "analysis-result"
  | "presentation";

export type ArchitectureLayer = "domain" | "orchestration" | "presentation" | "browser-session";

export type EngineStage = {
  id: EngineStageId;
  label: string;
  shortLabel: string;
  layer: ArchitectureLayer;
  purpose: string;
  inputs: string[];
  outputs: string[];
  rules: string[];
  unavailableBehavior: string;
  modules: string[];
  consumers: string[];
};

export type EngineConnection = {
  from: EngineStageId;
  to: EngineStageId;
  label?: string;
};

export type EngineMapViewModel = {
  overview: string;
  stages: EngineStage[];
  connections: EngineConnection[];
  counts: {
    implementedRatios: number;
    scoringDimensions: number;
    scoredMetrics: number;
    scenarioControls: number;
    scenarioPresets: number;
  };
  scenarioReuse: {
    steps: string[];
    statement: string;
  };
  provenance: Array<{ output: string; trace: string[] }>;
  principles: string[];
};
