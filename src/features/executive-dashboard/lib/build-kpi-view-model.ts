import type { CurrencyCode, FinancialAnalysisResult, MetricResult, RatioDefinition } from "@/domain";
import type { DashboardKpiViewModel, DashboardMetricDirection } from "@/features/executive-dashboard/types/dashboard.types";
import {
  formatFinancialValue,
  reasonForUnavailableMetric,
  valueFromMetric,
} from "@/features/executive-dashboard/lib/format-financial-value";

type KpiConfig = {
  id: string;
  metricId: string;
  label: string;
  unit: RatioDefinition["unit"] | "score";
  higherIsFavourable: boolean;
  interpretation: string;
  emphasized?: boolean;
};

const kpiConfig: KpiConfig[] = [
  {
    id: "financial-health-score",
    metricId: "financial-health-score",
    label: "Financial Health Score",
    unit: "score",
    higherIsFavourable: true,
    interpretation: "Composite view across the five score dimensions.",
    emphasized: true,
  },
  {
    id: "return-on-equity",
    metricId: "return-on-equity",
    label: "Return on Equity",
    unit: "percentage",
    higherIsFavourable: true,
    interpretation: "Shows profit generated for each unit of equity.",
  },
  {
    id: "current-ratio",
    metricId: "current-ratio",
    label: "Current Ratio",
    unit: "multiple",
    higherIsFavourable: true,
    interpretation: "Shows current assets available against current liabilities.",
  },
  {
    id: "debt-to-equity",
    metricId: "debt-to-equity",
    label: "Debt-to-Equity",
    unit: "multiple",
    higherIsFavourable: false,
    interpretation: "Lower leverage generally reduces balance-sheet pressure.",
  },
  {
    id: "free-cash-flow",
    metricId: "free-cash-flow",
    label: "Free Cash Flow",
    unit: "currency",
    higherIsFavourable: true,
    interpretation: "Cash left after capital expenditure.",
  },
  {
    id: "net-margin",
    metricId: "net-margin",
    label: "Net Margin",
    unit: "percentage",
    higherIsFavourable: true,
    interpretation: "Shows revenue retained as net income.",
  },
];

function metricForPeriod(result: FinancialAnalysisResult, metricId: string, period: "current" | "previous"): MetricResult | undefined {
  if (metricId === "financial-health-score") {
    const score = period === "current" ? result.score.total : result.previousPeriod?.score?.total;
    return score === null || score === undefined
      ? { status: "unavailable", reason: "missing-input" }
      : { status: "available", value: score };
  }

  return period === "current" ? result.currentPeriod.ratios[metricId] : result.previousPeriod?.ratios[metricId];
}

function directionForChange(change: number | null, higherIsFavourable: boolean): DashboardMetricDirection {
  if (change === null || !Number.isFinite(change)) {
    return "unavailable";
  }
  if (Math.abs(change) < 1e-9) {
    return "neutral";
  }
  const improved = higherIsFavourable ? change > 0 : change < 0;
  return improved ? "favourable" : "unfavourable";
}

function directionText(direction: DashboardMetricDirection) {
  switch (direction) {
    case "favourable":
      return "favourable movement";
    case "unfavourable":
      return "unfavourable movement";
    case "neutral":
      return "neutral movement";
    case "unavailable":
      return "movement unavailable";
  }
}

export function buildKpiViewModels(result: FinancialAnalysisResult): DashboardKpiViewModel[] {
  const currency: CurrencyCode = result.company.currency;

  return kpiConfig.map((config) => {
    const currentMetric = metricForPeriod(result, config.metricId, "current");
    const previousMetric = metricForPeriod(result, config.metricId, "previous");
    const currentValue = valueFromMetric(currentMetric);
    const previousValue = valueFromMetric(previousMetric);
    const change = currentValue === null || previousValue === null ? null : currentValue - previousValue;
    const currentFormatted = formatFinancialValue({
      value: currentValue,
      unit: config.unit,
      currency,
      unavailableReason: reasonForUnavailableMetric(currentMetric),
    });
    const previousFormatted =
      previousMetric === undefined
        ? null
        : formatFinancialValue({
            value: previousValue,
            unit: config.unit,
            currency,
            unavailableReason: reasonForUnavailableMetric(previousMetric),
          });
    const movement = formatFinancialValue({
      value: change,
      unit: config.unit === "score" ? "score-change" : config.unit,
      currency,
      unavailableReason: "comparison-unavailable",
      signed: true,
    });
    const direction = directionForChange(change, config.higherIsFavourable);

    return {
      id: config.id,
      metricId: config.metricId,
      label: config.label,
      currentValue: currentFormatted,
      previousValue: previousFormatted,
      movementDisplay: movement.display,
      movementAccessibleText: movement.accessibleText,
      direction,
      accessibleStatus: `${config.label}: ${currentFormatted.accessibleText}; ${directionText(direction)}.`,
      interpretation: config.interpretation,
      unitLabel: currentFormatted.unitLabel,
      emphasized: Boolean(config.emphasized),
    };
  });
}
