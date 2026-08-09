import { engineConnections, engineStages, getEngineMapCounts } from "@/features/engine-map/lib/engine-map-metadata";
import type { EngineMapViewModel } from "@/features/engine-map/types/engine-map.types";

export function buildEngineMapViewModel(): EngineMapViewModel {
  return {
    overview: "Financial statements are validated once, transformed through deterministic domain logic, and exposed to multiple analytical experiences without duplicating financial methodology.",
    stages: engineStages,
    connections: engineConnections,
    counts: getEngineMapCounts(),
    scenarioReuse: {
      steps: ["Base Case", "ScenarioAssumptions", "applyScenario()", "Transformed financial statements", "Canonical validation", "Same analysis engine", "Scenario comparison"],
      statement: "Scenario Lab transforms statements, not analytical outputs. Ratios, DuPont, scoring and insights are reused from the same analysis engine.",
    },
    provenance: [
      { output: "Financial Health Score", trace: ["Dimension scores", "Metric scores", "Registered ratios", "Canonical statements"] },
      { output: "ROE driver attribution", trace: ["Current and prior DuPont factors", "Canonical financial statements"] },
      { output: "Scenario score", trace: ["Scenario Case statements", "applyScenario()", "Base Case + assumptions"] },
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
