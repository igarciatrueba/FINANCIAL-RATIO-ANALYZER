import {
  analyseFinancialStatements,
  applyScenario,
  dimensionOrder,
  parseFinancialAnalysisInput,
  scenarioPresetList,
  scenarioPropagationRules,
  type FinancialAnalysisInput,
  type FinancialAnalysisResult,
  type MetricResult,
  type RatioCategory,
  type ScenarioAssumptions,
  type ScenarioPresetId,
  type ScenarioTransformationMetadata,
} from "@/domain";
import { formulaRegistry } from "@/domain/ratios";
import { dimensionLabels } from "@/features/executive-dashboard/lib/dashboard-metadata";
import {
  formatCoverage,
  formatFinancialValue,
  reasonForUnavailableMetric,
  valueFromMetric,
} from "@/features/executive-dashboard/lib/format-financial-value";
import { buildInsightViewModel } from "@/features/executive-dashboard/lib/build-insight-view-model";
import type { FormattedFinancialValue } from "@/features/executive-dashboard/types/dashboard.types";
import type {
  ScenarioComparisonViewModel,
  ScenarioDimensionComparison,
  ScenarioMetricComparison,
  ScenarioPipelineResult,
} from "@/features/scenario-lab/types/scenario.types";

type BuildScenarioComparisonInput = {
  baseInput: FinancialAnalysisInput;
  baseAnalysis: FinancialAnalysisResult;
  scenarioInput: FinancialAnalysisInput;
  scenarioAnalysis: FinancialAnalysisResult;
  assumptions: ScenarioAssumptions;
  metadata: ScenarioTransformationMetadata;
  selectedPresetId: ScenarioPresetId | "custom" | null;
};

const keyMetricIds = [
  "financial-health-score",
  "net-margin",
  "ebit-margin",
  "return-on-equity",
  "current-ratio",
  "debt-to-equity",
  "interest-coverage",
  "free-cash-flow",
  "cash-conversion-cycle",
] as const;

const lowerIsFavourable = new Set(["debt-to-equity", "cash-conversion-cycle"]);

const scenarioMethodologyLabels = {
  revenueGrowthPercent: {
    sourceLabel: "Latest-period Revenue",
    affectedValues: "Cost of Goods Sold, EBIT and Net Income",
  },
  ebitMarginPercent: {
    sourceLabel: "Latest-period EBIT",
    affectedValues: "EBIT",
  },
  totalDebtChangePercent: {
    sourceLabel: "Latest-period Total Debt",
    affectedValues: "Total Debt",
  },
  currentAssetsChangePercent: {
    sourceLabel: "Latest-period Current Assets",
    affectedValues: "Current Assets",
  },
  inventoryChangePercent: {
    sourceLabel: "Latest-period Inventory",
    affectedValues: "Inventory and Average Inventory",
  },
  interestExpenseChangePercent: {
    sourceLabel: "Latest-period Interest Expense",
    affectedValues: "Interest Expense and Net Income",
  },
} satisfies Record<keyof ScenarioAssumptions, { sourceLabel: string; affectedValues: string }>;

const dupontFactors = [
  {
    key: "netProfitMargin",
    label: "Net Profit Margin",
    unit: "percentage",
    meaning: "Profit retained from each unit of revenue.",
  },
  {
    key: "assetTurnover",
    label: "Asset Turnover",
    unit: "multiple",
    meaning: "Revenue generated per unit of asset base.",
  },
  {
    key: "financialLeverage",
    label: "Financial Leverage",
    unit: "multiple",
    meaning: "Asset base supported by each unit of equity.",
  },
  {
    key: "roe",
    label: "Return on Equity",
    unit: "percentage",
    meaning: "Net income generated per unit of average equity.",
  },
] as const;

function metricValue(metric: MetricResult | undefined) {
  return valueFromMetric(metric);
}

function directionForChange(metricId: string, change: number | null) {
  if (change === null || !Number.isFinite(change)) {
    return "unavailable" as const;
  }
  if (Math.abs(change) < 1e-9) {
    return "neutral" as const;
  }
  const improved = lowerIsFavourable.has(metricId) ? change < 0 : change > 0;
  return improved ? ("favourable" as const) : ("unfavourable" as const);
}

function formatMetricValue(metric: MetricResult | undefined, unit: "currency" | "percentage" | "multiple" | "days", currency: FinancialAnalysisResult["company"]["currency"]) {
  return formatFinancialValue({
    value: metricValue(metric),
    unit,
    currency,
    unavailableReason: reasonForUnavailableMetric(metric),
  });
}

function formatDeltaValue(
  value: number | null,
  unit: "currency" | "percentage" | "multiple" | "days" | "score-change",
  currency: FinancialAnalysisResult["company"]["currency"]
) {
  return formatFinancialValue({
    value,
    unit,
    currency,
    signed: true,
    unavailableReason: "comparison-unavailable",
  });
}

function formatPercentChange(base: number | null, scenario: number | null): FormattedFinancialValue {
  if (base === null || scenario === null || base === 0) {
    return formatFinancialValue({ value: null, unit: "percentage", unavailableReason: "comparison-unavailable" });
  }

  return formatFinancialValue({
    value: (scenario - base) / Math.abs(base),
    unit: "percentage",
    signed: true,
  });
}

function scoreMetric(result: FinancialAnalysisResult): MetricResult {
  return result.score.total === null ? { status: "unavailable", reason: "missing-input" } : { status: "available", value: result.score.total };
}

function metricFor(result: FinancialAnalysisResult, metricId: string): MetricResult | undefined {
  return metricId === "financial-health-score" ? scoreMetric(result) : result.currentPeriod.ratios[metricId];
}

function unitForMetric(metricId: string) {
  return metricId === "financial-health-score" ? "score-change" : formulaRegistry[metricId as keyof typeof formulaRegistry]?.unit;
}

function displayUnitForMetric(metricId: string) {
  return metricId === "financial-health-score" ? "score" : formulaRegistry[metricId as keyof typeof formulaRegistry]?.unit;
}

function labelForMetric(metricId: string) {
  return metricId === "financial-health-score" ? "Financial Health Score" : formulaRegistry[metricId as keyof typeof formulaRegistry]?.name ?? "Unlabelled metric";
}

function interpretationForMetric(metricId: string) {
  return metricId === "financial-health-score"
    ? "Composite score recalculated from the Scenario Case."
    : formulaRegistry[metricId as keyof typeof formulaRegistry]?.interpretation ?? "Scenario metric recalculated from transformed statements.";
}

function buildMetricComparison(
  metricId: string,
  baseAnalysis: FinancialAnalysisResult,
  scenarioAnalysis: FinancialAnalysisResult
): ScenarioMetricComparison {
  const currency = baseAnalysis.company.currency;
  const baseMetric = metricFor(baseAnalysis, metricId);
  const scenarioMetric = metricFor(scenarioAnalysis, metricId);
  const baseValue = metricValue(baseMetric);
  const scenarioValue = metricValue(scenarioMetric);
  const change = baseValue === null || scenarioValue === null ? null : scenarioValue - baseValue;
  const unit = displayUnitForMetric(metricId);
  const deltaUnit = unitForMetric(metricId);

  return {
    label: labelForMetric(metricId),
    baseValue:
      metricId === "financial-health-score"
        ? formatFinancialValue({ value: baseValue, unit: "score", unavailableReason: reasonForUnavailableMetric(baseMetric) })
        : formatMetricValue(baseMetric, unit as "currency" | "percentage" | "multiple" | "days", currency),
    scenarioValue:
      metricId === "financial-health-score"
        ? formatFinancialValue({ value: scenarioValue, unit: "score", unavailableReason: reasonForUnavailableMetric(scenarioMetric) })
        : formatMetricValue(scenarioMetric, unit as "currency" | "percentage" | "multiple" | "days", currency),
    absoluteChange: formatDeltaValue(change, deltaUnit as "currency" | "percentage" | "multiple" | "days" | "score-change", currency),
    percentageChange: formatPercentChange(baseValue, scenarioValue),
    direction: directionForChange(metricId, change),
    unitLabel: metricId === "financial-health-score" ? "Score" : unit ?? "Unavailable",
    availability: scenarioValue === null ? "Unavailable" : "Available",
    interpretation: interpretationForMetric(metricId),
  };
}

function dimensionScore(result: FinancialAnalysisResult, category: RatioCategory) {
  return result.currentPeriod.score?.dimensions.find((dimension) => dimension.dimension === category)?.score ?? null;
}

function buildDimensionComparison(
  baseAnalysis: FinancialAnalysisResult,
  scenarioAnalysis: FinancialAnalysisResult
): ScenarioDimensionComparison[] {
  return dimensionOrder.map((category) => {
    const baseScore = dimensionScore(baseAnalysis, category);
    const scenarioScore = dimensionScore(scenarioAnalysis, category);
    const change = baseScore === null || scenarioScore === null ? null : scenarioScore - baseScore;

    return {
      label: dimensionLabels[category],
      baseScore: formatFinancialValue({ value: baseScore, unit: "score", unavailableReason: "score-unavailable" }),
      scenarioScore: formatFinancialValue({ value: scenarioScore, unit: "score", unavailableReason: "score-unavailable" }),
      delta: formatDeltaValue(change, "score-change", baseAnalysis.company.currency),
      direction: directionForChange(category, change),
      category,
    };
  });
}

function presetLabel(selectedPresetId: ScenarioPresetId | "custom" | null) {
  if (selectedPresetId === null) {
    return "Base Case";
  }
  if (selectedPresetId === "custom") {
    return "Custom";
  }
  return scenarioPresetList.find((preset) => preset.id === selectedPresetId)?.name ?? "Custom";
}

function buildInsightComparison(baseAnalysis: FinancialAnalysisResult, scenarioAnalysis: FinancialAnalysisResult) {
  const baseInsights = new Map(baseAnalysis.insights.map((insight) => [insight.id, insight]));
  const scenarioInsights = new Map(scenarioAnalysis.insights.map((insight) => [insight.id, insight]));
  const currency = scenarioAnalysis.company.currency;
  const newInsights = scenarioAnalysis.insights.filter((insight) => !baseInsights.has(insight.id));
  const resolvedInsights = baseAnalysis.insights.filter((insight) => !scenarioInsights.has(insight.id));
  const persistentRisks = scenarioAnalysis.insights.filter((insight) => insight.category === "risk" && baseInsights.has(insight.id));

  return {
    newStrengths: newInsights.filter((insight) => insight.category === "strength").map((insight) => buildInsightViewModel(insight, currency)),
    resolvedStrengths: resolvedInsights.filter((insight) => insight.category === "strength").map((insight) => buildInsightViewModel(insight, currency)),
    newRisks: newInsights.filter((insight) => insight.category === "risk").map((insight) => buildInsightViewModel(insight, currency)),
    resolvedRisks: resolvedInsights.filter((insight) => insight.category === "risk").map((insight) => buildInsightViewModel(insight, currency)),
    persistentRisks: persistentRisks.slice(0, 3).map((insight) => buildInsightViewModel(insight, currency)),
    scenarioStrengths: scenarioAnalysis.principalInsights.strengths.map((insight) => buildInsightViewModel(insight, currency)),
    scenarioRisks: scenarioAnalysis.principalInsights.risks.map((insight) => buildInsightViewModel(insight, currency)),
  };
}

function buildDupontComparison(baseAnalysis: FinancialAnalysisResult, scenarioAnalysis: FinancialAnalysisResult) {
  const factors = dupontFactors.map((factor) => {
    const baseMetric = baseAnalysis.currentPeriod.dupont[factor.key];
    const scenarioMetric = scenarioAnalysis.currentPeriod.dupont[factor.key];
    const baseValue = metricValue(baseMetric);
    const scenarioValue = metricValue(scenarioMetric);
    const change = baseValue === null || scenarioValue === null ? null : scenarioValue - baseValue;

    return {
      label: factor.label,
      baseValue: formatMetricValue(baseMetric, factor.unit, baseAnalysis.company.currency),
      scenarioValue: formatMetricValue(scenarioMetric, factor.unit, baseAnalysis.company.currency),
      delta: formatDeltaValue(change, factor.unit, baseAnalysis.company.currency),
      direction: factor.key === "financialLeverage" ? ("contextual" as const) : directionForChange(factor.key, change),
      meaning: factor.meaning,
    };
  });

  const roe = factors.find((factor) => factor.label === "Return on Equity");
  return {
    factors,
    summary: roe ? `Scenario ROE movement is ${roe.delta.display}; leverage is interpreted contextually, not automatically as favourable.` : "DuPont comparison unavailable.",
  };
}

function buildHeadline(baseAnalysis: FinancialAnalysisResult, scenarioAnalysis: FinancialAnalysisResult) {
  const baseScore = baseAnalysis.score.total;
  const scenarioScore = scenarioAnalysis.score.total;
  if (baseScore === null || scenarioScore === null) {
    return "Scenario score is unavailable under this transformation.";
  }

  const delta = scenarioScore - baseScore;
  const movement = Math.abs(delta) < 1e-9 ? "does not change" : delta > 0 ? "improves" : "deteriorates";
  const formatted = formatDeltaValue(delta, "score-change", baseAnalysis.company.currency).display;
  return `Under this transformation, the Scenario Case ${movement} the Health Score by ${formatted}.`;
}

export function runScenarioPipeline(baseInput: FinancialAnalysisInput, assumptions: ScenarioAssumptions): ScenarioPipelineResult {
  const transformed = applyScenario(baseInput, assumptions);

  if (transformed.status === "error") {
    return { status: "transformation-error", issues: transformed.issues };
  }

  const canonical = parseFinancialAnalysisInput(transformed.input);
  if (!canonical.success) {
    return {
      status: "canonical-validation-error",
      issues: canonical.validation.issues.map((issue) => issue.message),
    };
  }

  try {
    return {
      status: "success",
      input: canonical.data,
      analysis: analyseFinancialStatements(canonical.data),
      metadata: transformed.metadata,
    };
  } catch {
    return {
      status: "analysis-error",
      message: "The Scenario Case could not be analysed safely.",
    };
  }
}

export function buildScenarioComparisonViewModel(input: BuildScenarioComparisonInput): ScenarioComparisonViewModel {
  const { baseAnalysis, scenarioAnalysis, metadata } = input;
  const baseScore = baseAnalysis.score.total;
  const scenarioScore = scenarioAnalysis.score.total;
  const scoreDelta = baseScore === null || scenarioScore === null ? null : scenarioScore - baseScore;
  const dimensions = buildDimensionComparison(baseAnalysis, scenarioAnalysis);

  return {
    company: {
      name: baseAnalysis.company.name,
      industry: baseAnalysis.company.industry,
      currency: baseAnalysis.company.currency,
    },
    period: {
      latestYear: baseAnalysis.currentPeriod.year,
      comparisonLabel: "Base Case → Scenario Case",
    },
    selectedPresetId: input.selectedPresetId,
    selectedPresetLabel: presetLabel(input.selectedPresetId),
    assumptions: input.assumptions,
    score: {
      base: {
        raw: baseScore,
        display: formatFinancialValue({ value: baseScore, unit: "score", unavailableReason: "score-unavailable" }).display,
        classification: baseAnalysis.score.classification,
        coverageDisplay: formatCoverage(baseAnalysis.coverage.coveragePercentage),
      },
      scenario: {
        raw: scenarioScore,
        display: formatFinancialValue({ value: scenarioScore, unit: "score", unavailableReason: "score-unavailable" }).display,
        classification: scenarioAnalysis.score.classification,
        coverageDisplay: formatCoverage(scenarioAnalysis.coverage.coveragePercentage),
      },
      delta: formatDeltaValue(scoreDelta, "score-change", baseAnalysis.company.currency),
      direction: directionForChange("financial-health-score", scoreDelta),
      coverageDelta: formatDeltaValue(
        scenarioAnalysis.coverage.coveragePercentage - baseAnalysis.coverage.coveragePercentage,
        "score-change",
        baseAnalysis.company.currency
      ),
      headline: buildHeadline(baseAnalysis, scenarioAnalysis),
    },
    dimensions,
    dimensionChart: {
      categories: dimensions.map((dimension) => dimension.label),
      baseValues: dimensionOrder.map((dimension) => dimensionScore(baseAnalysis, dimension)),
      scenarioValues: dimensionOrder.map((dimension) => dimensionScore(scenarioAnalysis, dimension)),
      summary: "Dimension comparison shows Base Case versus Scenario Case scores across the five Health Score dimensions.",
    },
    keyMetrics: keyMetricIds.map((metricId) => buildMetricComparison(metricId, baseAnalysis, scenarioAnalysis)),
    insightComparison: buildInsightComparison(baseAnalysis, scenarioAnalysis),
    dupont: buildDupontComparison(baseAnalysis, scenarioAnalysis),
    changedFields: metadata.changedFields.map((field) => ({
      label: field.label,
      baseValue: formatFinancialValue({ value: field.baseValue, unit: "currency", currency: baseAnalysis.company.currency }),
      scenarioValue: formatFinancialValue({ value: field.scenarioValue, unit: "currency", currency: baseAnalysis.company.currency }),
      change: formatDeltaValue(field.scenarioValue - field.baseValue, "currency", baseAnalysis.company.currency),
      path: field.path,
    })),
    methodology: {
      summary: "Scenarios are educational what-if transformations of the latest reporting period. They are not forecasts or probability-weighted outcomes.",
      propagationRules: scenarioPropagationRules.map((rule) => ({
        label: rule.controlId.replace(/([A-Z])/g, " $1").replace("Percent", "").trim(),
        sourceLabel: scenarioMethodologyLabels[rule.controlId].sourceLabel,
        transformation: rule.transformation,
        affectedValues: scenarioMethodologyLabels[rule.controlId].affectedValues,
        balancingAssumption: rule.balancingAssumption,
        limitation: rule.limitation,
      })),
      limitations: [
        "No full accounting-equation balancing is invented.",
        "No scenario-specific ratio, score, insight or DuPont engine exists.",
        "Only the latest reporting period is transformed.",
        "EBIT-margin targets are operating sensitivities, not complete income-statement forecasts; taxes, financing schedules and Net Income reconciliation are not modeled.",
      ],
    },
  };
}
