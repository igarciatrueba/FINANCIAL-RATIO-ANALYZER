import { engineConnections, engineStages, getEngineMapCounts } from "@/features/engine-map/lib/engine-map-metadata";
import type { EngineMapViewModel } from "@/features/engine-map/types/engine-map.types";

export function buildEngineMapViewModel(): EngineMapViewModel {
  return {
    overview: "Financial statements are validated once, normalised into a canonical model, computed by deterministic domain engines and assembled into focused analytical experiences without duplicating financial methodology.",
    layers: [
      { id: "input", label: "Financial data", description: "Statements and company context" },
      { id: "validation", label: "Integrity gateway", description: "Strict canonical validation" },
      { id: "core", label: "Analytical core", description: "Deterministic financial engines" },
      { id: "orchestration", label: "Result orchestration", description: "One complete analysis result" },
      { id: "product", label: "Product experiences", description: "Focused views for real questions" },
    ],
    stages: engineStages,
    connections: engineConnections,
    counts: getEngineMapCounts(),
    landing: {
      coreStageIds: ["ratios", "dupont", "scoring", "insights"],
      outputStageIds: ["dashboard", "ratio-analysis", "dupont-analysis", "scenario-lab"],
    },
    scenarioReuse: {
      steps: ["Base Case", "Complete assumptions", "applyScenario()", "Canonical validation", "Same analysis engine", "Scenario comparison"],
      statement: "Scenario Lab transforms statements, then revalidates and reuses ratios, DuPont, scoring and insights from the same analysis engine.",
    },
    provenance: [
      { output: "Financial Health Score", trace: ["Dimension scores", "Metric scores", "Registered ratios", "Canonical statements"] },
      { output: "ROE driver attribution", trace: ["Current and prior DuPont factors", "Canonical financial statements"] },
      { output: "Scenario comparison", trace: ["Scenario Case statements", "Complete assumptions", "Base Case"] },
      { output: "Deterministic insight", trace: ["Ratio, score and trend evidence", "FinancialAnalysisResult"] },
    ],
    principles: [
      "Deterministic financial logic with explicit unavailable states.",
      "Canonical validation before analysis and after scenario transformation.",
      "No duplicate financial formulas in React components.",
      "Immutable Base Case and statement-based scenarios.",
      "Reusable analysis pipeline with presentation-only charts and view models.",
      "Transparent scoring methodology and no generative AI in analytical outputs.",
    ],
  };
}
