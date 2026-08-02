import {
  classifyFinancialHealthScore,
  dimensionOrder,
  type FinancialAnalysisInput,
  type FinancialAnalysisResult,
  type FinancialPeriod,
  type MetricResult,
  type PeriodAnalysis,
  type RatioCategory,
} from "@/domain";
import { formulaRegistry } from "@/domain/ratios";
import { dimensionLabels, toneForClassification } from "@/features/executive-dashboard/lib/dashboard-metadata";
import {
  formatCoverage,
  formatFinancialValue,
  reasonForUnavailableMetric,
  valueFromMetric,
} from "@/features/executive-dashboard/lib/format-financial-value";
import type {
  DashboardDimensionRadarViewModel,
  DashboardExecutiveSummaryViewModel,
  DashboardHealthTrendViewModel,
  DashboardProfitabilityWaterfallViewModel,
  DashboardRatioTableViewModel,
  DashboardRatioTrendMetricViewModel,
  DashboardRatioTrendViewModel,
  DashboardScoreContributionViewModel,
  DashboardWorkingCapitalViewModel,
  ExecutiveDashboardViewModel,
  FormattedFinancialValue,
} from "@/features/executive-dashboard/types/dashboard.types";

type Unit = "currency" | "percentage" | "multiple" | "days" | "score" | "score-change";
type Direction = "Increased" | "Decreased" | "Unchanged" | "Unavailable";

function metricFromPeriod(period: PeriodAnalysis | undefined, metricId: string): MetricResult | undefined {
  return period?.ratios[metricId];
}

function formatMetric(metric: MetricResult | undefined, unit: Unit, currency: FinancialAnalysisResult["company"]["currency"]) {
  return formatFinancialValue({
    value: valueFromMetric(metric),
    unit,
    currency,
    unavailableReason: reasonForUnavailableMetric(metric) ?? "comparison-unavailable",
  });
}

function formatDelta(
  current: MetricResult | undefined,
  previous: MetricResult | undefined,
  unit: Unit,
  currency: FinancialAnalysisResult["company"]["currency"]
) {
  const currentValue = valueFromMetric(current);
  const previousValue = valueFromMetric(previous);
  return formatFinancialValue({
    value: currentValue === null || previousValue === null ? null : currentValue - previousValue,
    unit: unit === "score" ? "score-change" : unit,
    currency,
    unavailableReason: "comparison-unavailable",
    signed: true,
  });
}

function directionForValues(current: number | null, previous: number | null): Direction {
  if (current === null || previous === null) {
    return "Unavailable";
  }
  if (Math.abs(current - previous) < 1e-9) {
    return "Unchanged";
  }
  return current > previous ? "Increased" : "Decreased";
}

function dimensionScore(period: PeriodAnalysis | undefined, dimension: RatioCategory) {
  return period?.score?.dimensions.find((item) => item.dimension === dimension)?.score ?? null;
}

function scoreDisplay(score: number | null) {
  return score === null ? "Unavailable" : formatFinancialValue({ value: score, unit: "score" }).display;
}

function formattedUnavailable(): FormattedFinancialValue {
  return formatFinancialValue({ value: null, unit: "multiple", unavailableReason: "comparison-unavailable" });
}

function periodByYear(input: FinancialAnalysisInput | undefined, year: number): FinancialPeriod | undefined {
  return input?.periods.find((period) => period.year === year);
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function buildDimensionRadarViewModel(result: FinancialAnalysisResult): DashboardDimensionRadarViewModel {
  return {
    indicators: dimensionOrder.map((dimension) => ({
      id: dimension,
      label: dimensionLabels[dimension],
      max: 100,
    })),
    current: {
      year: result.currentPeriod.year,
      values: dimensionOrder.map((dimension) => dimensionScore(result.currentPeriod, dimension)),
      displayValues: dimensionOrder.map((dimension) => scoreDisplay(dimensionScore(result.currentPeriod, dimension))),
    },
    previous: result.previousPeriod
      ? {
          year: result.previousPeriod.year,
          values: dimensionOrder.map((dimension) => dimensionScore(result.previousPeriod, dimension)),
          displayValues: dimensionOrder.map((dimension) => scoreDisplay(dimensionScore(result.previousPeriod, dimension))),
        }
      : null,
  };
}

export function buildHealthTrendViewModel(result: FinancialAnalysisResult): DashboardHealthTrendViewModel {
  return {
    points: result.scoreHistory.map((period) => ({
      year: period.year,
      value: period.score.total,
      displayValue: scoreDisplay(period.score.total),
      classification: period.score.classification,
    })),
    summary: `The three-year Financial Health Score trend is ${result.score.trend}.`,
  };
}

export function buildRatioTrendViewModel(result: FinancialAnalysisResult): DashboardRatioTrendViewModel {
  const categories = dimensionOrder.map((dimension) => ({ id: dimension, label: dimensionLabels[dimension] }));
  const metricsByCategory: Record<RatioCategory, DashboardRatioTrendMetricViewModel[]> = {
    profitability: [],
    liquidity: [],
    solvency: [],
    efficiency: [],
    "cash-flow": [],
  };
  const metricsById: Record<string, DashboardRatioTrendMetricViewModel> = {};

  for (const definition of Object.values(formulaRegistry)) {
    const points = result.periods.map((period) => {
      const metric = metricFromPeriod(period, definition.id);
      const value = valueFromMetric(metric);
      return {
        year: period.year,
        value,
        displayValue: formatMetric(metric, definition.unit, result.company.currency).display,
        availability: value === null ? ("Unavailable" as const) : ("Available" as const),
        unavailableReason: reasonForUnavailableMetric(metric),
      };
    });
    const current = metricFromPeriod(result.currentPeriod, definition.id);
    const previous = metricFromPeriod(result.previousPeriod, definition.id);
    const currentValue = valueFromMetric(current);
    const previousValue = valueFromMetric(previous);
    const direction = directionForValues(currentValue, previousValue);
    const metric: DashboardRatioTrendMetricViewModel = {
      metricId: definition.id,
      label: definition.name,
      category: definition.category,
      unit: definition.unit,
      currentValue: formatMetric(current, definition.unit, result.company.currency),
      previousValue: previous ? formatMetric(previous, definition.unit, result.company.currency) : formattedUnavailable(),
      change: formatDelta(current, previous, definition.unit, result.company.currency),
      direction,
      summary: `${definition.name} ${direction.toLowerCase()} versus the previous period.`,
      accessibleDescription: `${definition.name} trend over ${points.length} reporting periods. Unit: ${definition.unit}.`,
      points,
    };
    metricsByCategory[definition.category].push(metric);
    metricsById[definition.id] = metric;
  }

  return {
    categories,
    defaultCategory: "profitability",
    defaultMetricId: metricsByCategory.profitability[0]?.metricId ?? Object.keys(metricsById)[0],
    metricsByCategory,
    metricsById,
  };
}

export function buildRatioTableViewModel(result: FinancialAnalysisResult): DashboardRatioTableViewModel {
  const groups = dimensionOrder.map((category) => ({
    category,
    label: dimensionLabels[category],
    rows: Object.values(formulaRegistry)
      .filter((definition) => definition.category === category)
      .map((definition) => {
        const current = metricFromPeriod(result.currentPeriod, definition.id);
        const previous = metricFromPeriod(result.previousPeriod, definition.id);
        const currentValue = valueFromMetric(current);
        const previousValue = valueFromMetric(previous);

        return {
          label: definition.name,
          currentValue: formatMetric(current, definition.unit, result.company.currency),
          previousValue: previous ? formatMetric(previous, definition.unit, result.company.currency) : formattedUnavailable(),
          change: formatDelta(current, previous, definition.unit, result.company.currency),
          direction: directionForValues(currentValue, previousValue),
          unit: definition.unit,
          availability: currentValue === null ? ("Unavailable" as const) : ("Available" as const),
          unavailableReason: reasonForUnavailableMetric(current),
          formula: definition.formulaLabel,
          interpretation: definition.interpretation,
          description: definition.description,
        };
      }),
  }));

  return { groups };
}

function waterfallValue(value: number | null, currency: FinancialAnalysisResult["company"]["currency"]) {
  return formatFinancialValue({ value, unit: "currency", currency, unavailableReason: "source-input-unavailable" });
}

export function buildProfitabilityWaterfallViewModel(
  result: FinancialAnalysisResult,
  sourceInput?: FinancialAnalysisInput
): DashboardProfitabilityWaterfallViewModel {
  const period = periodByYear(sourceInput, result.currentPeriod.year);
  const grossProfit = valueFromMetric(metricFromPeriod(result.currentPeriod, "gross-profit"));

  if (!period || grossProfit === null) {
    return {
      status: "unavailable",
      summary: "Profitability waterfall unavailable because the dashboard view model was not supplied source statement values.",
      reconciliationNote: "No profitability bridge is shown without defensible source statement values.",
      steps: [],
    };
  }

  const { revenue, costOfGoodsSold, ebit, interestExpense, netIncome } = period.incomeStatement;
  const maybeExtended = period.incomeStatement as typeof period.incomeStatement & {
    operatingExpenses?: number;
    taxExpense?: number;
  };
  const operatingExpenses = maybeExtended.operatingExpenses;
  const taxExpense = maybeExtended.taxExpense;
  const hasFullBridge =
    finiteNumber(operatingExpenses) &&
    finiteNumber(taxExpense) &&
    Math.abs(grossProfit - operatingExpenses - ebit) < 1e-9 &&
    Math.abs(ebit - interestExpense - taxExpense - netIncome) < 1e-9;

  // Partial bridge logic: revenue, COGS, gross profit, EBIT and net income are canonical.
  // Missing intermediate detail is shown only as explicitly labelled residual bridge values.
  const operatingBridge = ebit - grossProfit;
  const belowEbitBridge = netIncome - ebit;

  if (hasFullBridge) {
    return {
      status: "full",
      summary: "Full profitability bridge is available from supplied statement detail.",
      reconciliationNote:
        "Revenue minus Cost of Goods Sold reconciles to Gross Profit; supplied operating expenses reconcile to EBIT; supplied interest and taxes reconcile to Net Income.",
      steps: [
        { label: "Revenue", rawValue: revenue, value: waterfallValue(revenue, result.company.currency), kind: "positive" },
        {
          label: "Cost of Goods Sold",
          rawValue: -costOfGoodsSold,
          value: waterfallValue(-costOfGoodsSold, result.company.currency),
          kind: "negative",
        },
        { label: "Gross Profit", rawValue: grossProfit, value: waterfallValue(grossProfit, result.company.currency), kind: "subtotal" },
        {
          label: "Operating expenses",
          rawValue: -operatingExpenses,
          value: waterfallValue(-operatingExpenses, result.company.currency),
          kind: "negative",
        },
        { label: "EBIT", rawValue: ebit, value: waterfallValue(ebit, result.company.currency), kind: "subtotal" },
        {
          label: "Interest expense",
          rawValue: -interestExpense,
          value: waterfallValue(-interestExpense, result.company.currency),
          kind: "negative",
        },
        {
          label: "Taxes",
          rawValue: -taxExpense,
          value: waterfallValue(-taxExpense, result.company.currency),
          kind: "negative",
        },
        { label: "Net Income", rawValue: netIncome, value: waterfallValue(netIncome, result.company.currency), kind: "total" },
      ],
    };
  }

  return {
    status: "partial",
    summary: "Partial profitability bridge is shown using only supplied canonical statement totals.",
    reconciliationNote:
      "Revenue minus Cost of Goods Sold reconciles to Gross Profit. The bridge from Gross Profit to EBIT and EBIT to Net Income is labelled as unspecified because operating expenses, taxes and other below-EBIT detail are not independently supplied.",
    steps: [
      { label: "Revenue", rawValue: revenue, value: waterfallValue(revenue, result.company.currency), kind: "positive" },
      {
        label: "Cost of Goods Sold",
        rawValue: -costOfGoodsSold,
        value: waterfallValue(-costOfGoodsSold, result.company.currency),
        kind: "negative",
      },
      { label: "Gross Profit", rawValue: grossProfit, value: waterfallValue(grossProfit, result.company.currency), kind: "subtotal" },
      {
        label: "Unspecified operating bridge",
        rawValue: operatingBridge,
        value: waterfallValue(operatingBridge, result.company.currency),
        kind: "bridge",
      },
      { label: "EBIT", rawValue: ebit, value: waterfallValue(ebit, result.company.currency), kind: "subtotal" },
      {
        label: "Unspecified below-EBIT bridge",
        rawValue: belowEbitBridge,
        value: waterfallValue(belowEbitBridge, result.company.currency),
        kind: "bridge",
      },
      { label: "Net Income", rawValue: netIncome, value: waterfallValue(netIncome, result.company.currency), kind: "total" },
    ],
  };
}

export function buildWorkingCapitalViewModel(result: FinancialAnalysisResult): DashboardWorkingCapitalViewModel {
  const metricIds = [
    "days-sales-outstanding",
    "days-inventory-outstanding",
    "days-payables-outstanding",
    "cash-conversion-cycle",
  ];
  const currentValues = metricIds.map((metricId) => valueFromMetric(metricFromPeriod(result.currentPeriod, metricId)));
  const maxValue = Math.max(0, ...currentValues.filter((value): value is number => value !== null));

  return {
    equation: "DSO + DIO - DPO = CCC",
    explanation: "Cash Conversion Cycle combines collection days, inventory days and payable days.",
    metrics: metricIds.map((metricId) => {
      const definition = formulaRegistry[metricId as keyof typeof formulaRegistry];
      const current = metricFromPeriod(result.currentPeriod, metricId);
      const previous = metricFromPeriod(result.previousPeriod, metricId);
      const value = valueFromMetric(current);
      const previousValue = valueFromMetric(previous);

      return {
        metricId,
        label: definition.name,
        currentValue: formatMetric(current, "days", result.company.currency),
        previousValue: previous ? formatMetric(previous, "days", result.company.currency) : formattedUnavailable(),
        change: formatDelta(current, previous, "days", result.company.currency),
        direction: directionForValues(value, previousValue),
        relativePosition: value === null || maxValue <= 0 ? null : Math.min(100, (value / maxValue) * 100),
      };
    }),
  };
}

export function buildScoreContributionViewModel(result: FinancialAnalysisResult): DashboardScoreContributionViewModel {
  return {
    dimensions: dimensionOrder.map((dimension) => {
      const dimensionScoreValue = dimensionScore(result.currentPeriod, dimension);
      const contribution = result.score.metricScores
        .filter((metricScore) => metricScore.dimension === dimension && metricScore.score !== null)
        .reduce((total, metricScore) => total + (metricScore.score ?? 0) * metricScore.totalEffectiveWeight, 0);
      const contributionValue = dimensionScoreValue === null ? null : contribution;

      return {
        id: dimension,
        label: dimensionLabels[dimension],
        score: dimensionScoreValue,
        contribution: contributionValue,
        displayContribution: formatFinancialValue({
          value: contributionValue,
          unit: "score-change",
          unavailableReason: "score-unavailable",
        }).display,
        tone: toneForClassification(classifyFinancialHealthScore(dimensionScoreValue)),
      };
    }),
    totalDisplay: scoreDisplay(result.score.total),
  };
}

export function buildExecutiveSummaryViewModel(
  result: FinancialAnalysisResult,
  diagnosis: ExecutiveDashboardViewModel["diagnosis"]
): DashboardExecutiveSummaryViewModel {
  return {
    overallCondition: diagnosis.summary,
    keyImprovement: result.principalInsights.strengths[0]?.title ?? "No principal improvement signal was generated.",
    primaryConcern: result.principalInsights.risks[0]?.title ?? "No principal risk signal was generated.",
    coverage: `${formatCoverage(result.coverage.coveragePercentage)} analytical coverage`,
  };
}
