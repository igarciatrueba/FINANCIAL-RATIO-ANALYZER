import { formulaRegistry } from "@/domain/ratios";
import { dimensionOrder, defaultScoringConfig } from "@/domain/scoring";
import { scenarioControlOrder, scenarioPresetList } from "@/domain/scenarios";

import type { EngineConnection, EngineStage } from "@/features/engine-map/types/engine-map.types";

export const engineStages: EngineStage[] = [
  {
    id: "input", label: "Financial input", shortLabel: "Input", layer: "input", kind: "data", accent: "blue",
    purpose: "Captures company context and three annual financial statements in a browser form.",
    inputs: ["User-entered strings", "Fictional demo data"], outputs: ["FinancialAnalysisInput candidate"],
    rules: ["Numeric strings remain strings until explicit parsing.", "A company identifier is generated locally."],
    unavailableBehavior: "Required fields remain incomplete; empty values are never converted to zero.",
    modules: ["financial-input workflow", "form transform", "numeric parser"], consumers: ["Canonical validation"], route: "/input", routeLabel: "Open Financial Input",
  },
  {
    id: "validation", label: "Canonical validation", shortLabel: "Validate", layer: "validation", kind: "gateway", accent: "green",
    purpose: "Accepts only the strict, supported FinancialAnalysisInput shape before any analytical calculation.",
    inputs: ["FinancialAnalysisInput candidate", "Scenario-transformed statements"], outputs: ["Canonical FinancialAnalysisInput", "Typed validation issues"],
    rules: ["Exactly three chronological periods.", "Finite values and supported currency.", "Invalid input stops the analytical pipeline."],
    unavailableBehavior: "Invalid input is rejected before analysis.",
    modules: ["domain schemas", "parseFinancialAnalysisInput()"], consumers: ["Financial derivation", "Scenario Lab"],
  },
  {
    id: "derivation", label: "Canonical financial model", shortLabel: "Model", layer: "core", kind: "engine", accent: "blue",
    purpose: "Applies documented average-balance conventions and safe arithmetic to canonical statements.",
    inputs: ["Canonical periods", "Previous-period context"], outputs: ["Derived values", "Average balances", "Safe metric values"],
    rules: ["Oldest period uses documented closing-balance fallback.", "Unsuitable denominators remain explicitly unavailable."],
    unavailableBehavior: "Safe math returns unavailable results rather than NaN or Infinity.",
    modules: ["calculations/averages", "calculations/derived-values", "calculations/safe-math"], consumers: ["Ratio engine", "DuPont analysis"],
  },
  {
    id: "ratios", label: "Ratio engine", shortLabel: "Ratios", layer: "core", kind: "engine", accent: "blue",
    purpose: "Calculates registered profitability, liquidity, solvency, efficiency and cash-flow metrics.",
    inputs: ["Canonical periods", "Derived values and safe math"], outputs: ["PeriodRatioResult", "MetricResult by formula"],
    rules: ["Formula registry owns labels, units and availability conditions.", "React components do not calculate ratios."],
    unavailableBehavior: "Each unavailable metric retains a reason and is not represented as zero.",
    modules: ["formula registry", "calculatePeriodRatios()"], consumers: ["Financial Health Score", "Deterministic insights", "Analysis result"],
  },
  {
    id: "dupont", label: "DuPont engine", shortLabel: "DuPont", layer: "core", kind: "engine", accent: "violet",
    purpose: "Reconciles ROE with Net Profit Margin × Asset Turnover × Financial Leverage.",
    inputs: ["Canonical periods", "Ratio values", "Previous-period context"], outputs: ["DuPontResult", "Identity status", "Driver attribution inputs"],
    rules: ["Identity uses the Phase 3 calculation.", "Attribution is a separate Phase 7 Shapley analysis."],
    unavailableBehavior: "The identity is unavailable when required factors are unavailable.",
    modules: ["calculateDuPont()", "DuPont driver attribution"], consumers: ["DuPont Analysis", "Deterministic insights", "Analysis result"],
  },
  {
    id: "scoring", label: "Scoring engine", shortLabel: "Score", layer: "core", kind: "engine", accent: "cyan",
    purpose: "Scores eligible ratios through validated configurable anchors and coverage rules.",
    inputs: ["Registered ratio results", "Scoring configuration"], outputs: ["Score history", "Dimension scores", "Coverage and drivers"],
    rules: ["Configuration is validated before scoring.", "Unavailable metrics are reweighted, never zero-scored."],
    unavailableBehavior: "Score remains unavailable when coverage requirements are not met.",
    modules: ["scoring config", "calculateScoreHistory()"], consumers: ["Executive Dashboard", "Deterministic insights", "Analysis result"],
  },
  {
    id: "insights", label: "Insights engine", shortLabel: "Insights", layer: "core", kind: "engine", accent: "green",
    purpose: "Generates ordered strengths, risks and observations from ratios, scores and trends.",
    inputs: ["Period analysis", "Score history", "DuPont and metric evidence"], outputs: ["FinancialInsight[]", "Principal insights"],
    rules: ["Fixed rules and evidence only.", "No generative AI or implied recommendations."],
    unavailableBehavior: "Rules do not trigger when required evidence is unavailable.",
    modules: ["generateDeterministicInsights()", "selectPrincipalInsights()"], consumers: ["Executive Dashboard", "Scenario comparison", "Analysis result"],
  },
  {
    id: "analysis-result", label: "Analysis orchestration", shortLabel: "Orchestrate", layer: "orchestration", kind: "orchestrator", accent: "cyan",
    purpose: "Assembles one complete immutable FinancialAnalysisResult from the real financial engines.",
    inputs: ["Ratios", "DuPont", "Scoring", "Insights"], outputs: ["FinancialAnalysisResult"],
    rules: ["All three periods are analysed consistently.", "Available evidence remains explicit even when a score is unavailable."],
    unavailableBehavior: "No partial dashboard is presented after analysis failure.",
    modules: ["analyseFinancialStatements()"], consumers: ["Dashboard, ratio, DuPont and scenario view models"],
  },
  {
    id: "dashboard", label: "Executive Dashboard", shortLabel: "Dashboard", layer: "product", kind: "surface", accent: "blue",
    purpose: "Presents the executive financial condition, KPIs, dimensions and deterministic evidence.",
    inputs: ["FinancialAnalysisResult", "Dashboard view model"], outputs: ["Executive financial overview"],
    rules: ["Formatting and charts are presentation-only.", "Score, evidence and coverage retain their source context."],
    unavailableBehavior: "Safe states explain absent, invalid or failed analysis without a fabricated score.",
    modules: ["executive-dashboard feature", "shared ChartContainer"], consumers: ["Product users"], route: "/analysis", routeLabel: "Open Executive Dashboard",
  },
  {
    id: "ratio-analysis", label: "Ratio Analysis", shortLabel: "Ratio view", layer: "product", kind: "surface", accent: "blue",
    purpose: "Lets users inspect registered ratio history, formulas, units and availability.",
    inputs: ["FinancialAnalysisResult", "Formula registry"], outputs: ["Ratio trend and detailed ratio table"],
    rules: ["Registry metadata is the display source.", "Unavailable is never formatted as zero."],
    unavailableBehavior: "Unavailable values remain explicit with their context.",
    modules: ["ratio-analysis feature", "ratio view model"], consumers: ["Product users"], route: "/analysis/ratios", routeLabel: "Open Ratio Analysis",
  },
  {
    id: "dupont-analysis", label: "DuPont Analysis", shortLabel: "DuPont view", layer: "product", kind: "surface", accent: "violet",
    purpose: "Explains ROE factors and their order-independent contribution to change.",
    inputs: ["FinancialAnalysisResult", "DuPont view model"], outputs: ["ROE identity and Shapley attribution"],
    rules: ["Identity and attribution reconciliation remain separate.", "Contribution is shown in percentage points."],
    unavailableBehavior: "Unavailable factors and attribution stay unavailable, never zero.",
    modules: ["dupont-analysis feature", "buildDupontAnalysisViewModel()"], consumers: ["Product users"], route: "/analysis/dupont", routeLabel: "Open DuPont Analysis",
  },
  {
    id: "scenario-lab", label: "Scenario Lab", shortLabel: "Scenario", layer: "product", kind: "surface", accent: "cyan",
    purpose: "Transforms complete statement assumptions, revalidates them and reuses the same analysis engine.",
    inputs: ["Canonical Base Case", "Complete ScenarioAssumptions", "FinancialAnalysisResult"], outputs: ["Scenario comparison"],
    rules: ["The Base Case is immutable.", "Scenarios transform statements, not analytical outputs."],
    unavailableBehavior: "Invalid assumptions or transformed input stop the scenario comparison.",
    modules: ["applyScenario()", "scenario comparison view model"], consumers: ["Product users"], route: "/scenario", routeLabel: "Open Scenario Lab",
  },
  {
    id: "methodology", label: "Methodology", shortLabel: "Methodology", layer: "product", kind: "surface", accent: "green",
    purpose: "Makes formulas, scoring coverage, scenario limits and educational boundaries inspectable.",
    inputs: ["Formula registry", "Scoring configuration", "Methodology metadata"], outputs: ["Readable financial-methodology disclosure"],
    rules: ["Documentation follows the canonical engine.", "Educational disclaimer remains visible."],
    unavailableBehavior: "Methodology is reference content and never fabricates analytical output.",
    modules: ["methodology feature", "formula and scoring documentation"], consumers: ["Product users"], route: "/methodology", routeLabel: "Open Methodology",
  },
];

export const engineConnections: EngineConnection[] = [
  { id: "input-validation", from: "input", to: "validation" },
  { id: "validation-model", from: "validation", to: "derivation" },
  { id: "model-ratios", from: "derivation", to: "ratios" },
  { id: "model-dupont", from: "derivation", to: "dupont" },
  { id: "ratios-scoring", from: "ratios", to: "scoring" },
  { id: "ratios-insights", from: "ratios", to: "insights" },
  { id: "dupont-insights", from: "dupont", to: "insights" },
  { id: "scoring-insights", from: "scoring", to: "insights" },
  { id: "ratios-result", from: "ratios", to: "analysis-result" },
  { id: "dupont-result", from: "dupont", to: "analysis-result" },
  { id: "scoring-result", from: "scoring", to: "analysis-result" },
  { id: "insights-result", from: "insights", to: "analysis-result" },
  { id: "result-dashboard", from: "analysis-result", to: "dashboard" },
  { id: "result-ratios", from: "analysis-result", to: "ratio-analysis" },
  { id: "result-dupont", from: "analysis-result", to: "dupont-analysis" },
  { id: "validation-scenario", from: "validation", to: "scenario-lab", label: "revalidate" },
  { id: "result-scenario", from: "analysis-result", to: "scenario-lab" },
  { id: "validation-methodology", from: "validation", to: "methodology" },
  { id: "ratios-methodology", from: "ratios", to: "methodology" },
  { id: "scoring-methodology", from: "scoring", to: "methodology" },
];

export function getEngineMapCounts() {
  return {
    implementedRatios: Object.keys(formulaRegistry).length,
    scoringDimensions: dimensionOrder.length,
    scoredMetrics: Object.values(defaultScoringConfig.metricWeights).reduce((total, weights) => total + Object.keys(weights).length, 0),
    scenarioControls: scenarioControlOrder.length,
    scenarioPresets: scenarioPresetList.length,
  };
}
