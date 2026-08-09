import { formulaRegistry } from "@/domain/ratios";
import { dimensionOrder, defaultScoringConfig } from "@/domain/scoring";
import { scenarioControlOrder, scenarioPresetList } from "@/domain/scenarios";

import type { EngineConnection, EngineStage } from "@/features/engine-map/types/engine-map.types";

export const engineStages: EngineStage[] = [
  {
    id: "input", label: "Financial input", shortLabel: "Input", layer: "presentation",
    purpose: "Capture company context and three annual financial statements in a browser form.",
    inputs: ["User-entered strings", "Fictional demo data"], outputs: ["FinancialInputFormValues", "FinancialAnalysisInput candidate"],
    rules: ["Numeric strings remain strings until explicit parsing.", "A company identifier is generated locally."],
    unavailableBehavior: "Required fields remain incomplete; empty values are never converted to zero.",
    modules: ["financial-input workflow", "form transform", "numeric parser"], consumers: ["Canonical validation"],
  },
  {
    id: "validation", label: "Canonical validation", shortLabel: "Validate", layer: "domain",
    purpose: "Accept only the strict, supported FinancialAnalysisInput shape.",
    inputs: ["FinancialAnalysisInput candidate", "Scenario-transformed statements"], outputs: ["Canonical FinancialAnalysisInput", "Typed validation issues"],
    rules: ["Exactly three chronological periods.", "Finite values and supported currency.", "Structural and relationship feedback remain explicit."],
    unavailableBehavior: "Invalid input is rejected before analytical calculation.",
    modules: ["domain schemas", "parseFinancialAnalysisInput()"], consumers: ["Analysis orchestration", "Scenario Lab"],
  },
  {
    id: "derivation", label: "Financial derivation", shortLabel: "Derive", layer: "domain",
    purpose: "Apply average-balance conventions and safe arithmetic used by financial metrics.",
    inputs: ["Canonical periods", "Previous-period context"], outputs: ["Derived values", "Average balances", "Safe metric values"],
    rules: ["Oldest period uses documented closing-balance fallback.", "Zero or unsuitable denominators produce unavailable values."],
    unavailableBehavior: "Safe math returns explicit unavailable results rather than NaN or Infinity.",
    modules: ["calculations/averages", "calculations/derived-values", "calculations/safe-math"], consumers: ["Ratio engine", "DuPont"],
  },
  {
    id: "ratios", label: "Ratio engine", shortLabel: "Calculate", layer: "domain",
    purpose: "Calculate registered profitability, liquidity, solvency, efficiency and cash-flow metrics.",
    inputs: ["Canonical periods", "Derived values and safe math"], outputs: ["PeriodRatioResult", "MetricResult by formula"],
    rules: ["Formula registry owns labels, units and availability conditions.", "React components do not calculate ratios."],
    unavailableBehavior: "Each unavailable metric retains a reason and is not represented as zero.",
    modules: ["formula registry", "calculatePeriodRatios()"], consumers: ["Scoring", "Insights", "Dashboard reporting"],
  },
  {
    id: "dupont", label: "DuPont analysis", shortLabel: "DuPont", layer: "domain",
    purpose: "Reconcile ROE with Net Profit Margin × Asset Turnover × Financial Leverage.",
    inputs: ["Canonical periods", "Ratio values", "Previous-period context"], outputs: ["DuPontResult", "Reconciliation status", "Driver attribution inputs"],
    rules: ["Identity uses the Phase 3 calculation.", "Attribution is a separate Phase 7 Shapley analysis."],
    unavailableBehavior: "Identity is unavailable when required factors are unavailable.",
    modules: ["calculateDuPont()", "DuPont driver attribution"], consumers: ["DuPont Analysis", "Insights"],
  },
  {
    id: "scoring", label: "Financial Health Score", shortLabel: "Evaluate", layer: "domain",
    purpose: "Score eligible ratios through validated configurable anchors and coverage rules.",
    inputs: ["Registered ratio results", "Scoring configuration"], outputs: ["Score history", "Dimension scores", "Coverage and drivers"],
    rules: ["Configuration is validated before scoring.", "Unavailable metrics are reweighted, never zero-scored."],
    unavailableBehavior: "Score remains unavailable when coverage requirements are not met.",
    modules: ["scoring config", "calculateScoreHistory()"], consumers: ["Executive Dashboard", "Insights", "Scenario comparison"],
  },
  {
    id: "insights", label: "Deterministic insights", shortLabel: "Explain", layer: "domain",
    purpose: "Generate ordered strengths, risks and observations from ratios, scores and trends.",
    inputs: ["Period analysis", "Score history", "DuPont and metric evidence"], outputs: ["FinancialInsight[]", "Principal insights"],
    rules: ["Fixed rules and evidence only.", "No generative AI or implied recommendations."],
    unavailableBehavior: "Rules do not trigger when required evidence is unavailable.",
    modules: ["generateDeterministicInsights()", "selectPrincipalInsights()"], consumers: ["Executive Dashboard", "Scenario comparison"],
  },
  {
    id: "analysis-result", label: "Analysis result", shortLabel: "Result", layer: "orchestration",
    purpose: "Assemble one complete immutable FinancialAnalysisResult for the selected statements.",
    inputs: ["Ratios", "DuPont", "Scoring", "Insights"], outputs: ["FinancialAnalysisResult"],
    rules: ["Orchestration validates scoring configuration first.", "All three periods are analysed consistently."],
    unavailableBehavior: "Available evidence remains explicit even when a score is unavailable.",
    modules: ["analyseFinancialStatements()"], consumers: ["Dashboard view model", "DuPont view model", "Scenario comparison view model"],
  },
  {
    id: "presentation", label: "Analytical experiences", shortLabel: "Present", layer: "presentation",
    purpose: "Translate domain results into accessible, formatted views without financial recalculation.",
    inputs: ["FinancialAnalysisResult", "Formula registry metadata"], outputs: ["Dashboard", "DuPont Analysis", "Scenario Lab"],
    rules: ["View models are pure.", "Charts and formatting are presentation-only.", "Browser storage is accessed only after mount."],
    unavailableBehavior: "UI displays unavailable states and their context, never fabricated zero values.",
    modules: ["dashboard view models", "DuPont view model", "scenario comparison view model", "shared ChartContainer"], consumers: ["Product users"],
  },
];

export const engineConnections: EngineConnection[] = engineStages.slice(0, -1).map((stage, index) => ({
  from: stage.id,
  to: engineStages[index + 1].id,
}));

export function getEngineMapCounts() {
  return {
    implementedRatios: Object.keys(formulaRegistry).length,
    scoringDimensions: dimensionOrder.length,
    scoredMetrics: Object.values(defaultScoringConfig.metricWeights).reduce((total, weights) => total + Object.keys(weights).length, 0),
    scenarioControls: scenarioControlOrder.length,
    scenarioPresets: scenarioPresetList.length,
  };
}
