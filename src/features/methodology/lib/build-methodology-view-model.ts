import { formulaRegistry } from "@/domain/ratios";
import { defaultScoringConfig, dimensionOrder, SCORE_DISCLAIMER } from "@/domain/scoring";
import { scenarioControlOrder, scenarioPropagationRules } from "@/domain/scenarios";
import { scenarioPresetList } from "@/domain/scenarios";
import { dimensionLabels } from "@/features/executive-dashboard/lib/dashboard-metadata";

const direction: Record<string, string> = {
  "debt-to-equity": "Lower leverage generally reduces balance-sheet pressure.",
  "debt-to-assets": "Lower debt relative to assets generally reduces leverage.",
  "days-sales-outstanding": "Lower collection days are generally favourable.",
  "days-inventory-outstanding": "Lower inventory days are generally favourable.",
  "days-payables-outstanding": "Interpret alongside supplier terms and cash conversion cycle.",
  "cash-conversion-cycle": "Lower days generally indicate less cash tied up in operations.",
  "financial-leverage": "Higher leverage may amplify either strong or weak operating performance.",
};

export function buildMethodologyViewModel() {
  const formulas = Object.values(formulaRegistry).map((formula) => ({
    ...formula,
    direction: direction[formula.id] ?? "Higher values are generally favourable when the underlying financial context is suitable.",
  }));
  return {
    disclaimer: SCORE_DISCLAIMER,
    formulas,
    formulaCount: formulas.length,
    dimensions: dimensionOrder.map((dimension) => ({
      id: dimension,
      label: dimensionLabels[dimension],
      weight: defaultScoringConfig.dimensionWeights[dimension],
      metrics: Object.entries(defaultScoringConfig.metricWeights[dimension]).map(([metricId, weight]) => ({
        label: formulaRegistry[metricId as keyof typeof formulaRegistry].name,
        weight: weight ?? 0,
        threshold: defaultScoringConfig.thresholds[metricId],
      })),
    })),
    scenario: {
      controls: scenarioControlOrder.map((id) => scenarioPropagationRules.find((rule) => rule.controlId === id)?.controlId ?? id),
      presetNames: scenarioPresetList.map((preset) => preset.name),
      rules: scenarioPropagationRules,
    },
  };
}
