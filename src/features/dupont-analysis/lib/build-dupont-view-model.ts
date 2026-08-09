import type { DuPontResult, FinancialAnalysisInput, FinancialAnalysisResult, MetricResult } from "@/domain";
import { calculateDupontDriverAttribution, type DupontFactorId } from "@/domain/dupont";
import { formatFinancialValue, valueFromMetric, reasonForUnavailableMetric } from "@/features/executive-dashboard/lib/format-financial-value";
import type {
  DupontAnalysisViewModel,
  DupontAttributionContributionViewModel,
  DupontAttributionReconciliationViewModel,
  DupontAttributionViewModel,
  DupontDirection,
  DupontFactorTrendViewModel,
  DupontFactorViewModel,
} from "@/features/dupont-analysis/types/dupont.types";
import { buildDriverExplanation } from "@/features/dupont-analysis/lib/build-driver-explanation";

const factorOrder = ["netProfitMargin", "assetTurnover", "financialLeverage"] as const;
const attributionTolerance = 1e-12;
const locale = "en-US";

const factorMetadata: Record<DupontFactorId, { label: string; unit: "percentage" | "multiple"; meaning: string }> = {
  netProfitMargin: {
    label: "Net Profit Margin",
    unit: "percentage",
    meaning: "How much revenue becomes net income.",
  },
  assetTurnover: {
    label: "Asset Turnover",
    unit: "multiple",
    meaning: "How efficiently assets generate revenue.",
  },
  financialLeverage: {
    label: "Financial Leverage",
    unit: "multiple",
    meaning: "How much asset base is supported by equity.",
  },
};

function directionForFactor(factorId: DupontFactorId | "roe", change: number | null): DupontDirection {
  if (change === null) {
    return "unavailable";
  }

  if (Math.abs(change) < 0.0005) {
    return "neutral";
  }

  if (factorId === "financialLeverage") {
    return "contextual";
  }

  return change > 0 ? "favourable" : "unfavourable";
}

function directionLabel(direction: DupontDirection, factorId?: DupontFactorId | "roe") {
  if (direction === "unavailable") {
    return "Unavailable";
  }

  if (direction === "neutral") {
    return "Broadly stable";
  }

  if (direction === "contextual") {
    return factorId === "financialLeverage" ? "Contextual leverage movement" : "Contextual";
  }

  return direction === "favourable" ? "Favourable movement" : "Unfavourable movement";
}

function changeValue(current: number | null, previous: number | null) {
  return current === null || previous === null ? null : current - previous;
}

function formatMetric(metric: MetricResult | undefined, unit: "percentage" | "multiple") {
  return formatFinancialValue({
    value: valueFromMetric(metric),
    unit,
    unavailableReason: reasonForUnavailableMetric(metric),
  });
}

function formatChange(value: number | null, unit: "percentage" | "multiple") {
  return formatFinancialValue({
    value,
    unit,
    signed: true,
    unavailableReason: value === null ? "comparison-unavailable" : undefined,
  });
}

function formatPercentagePointValue(value: number | null, signed = false) {
  if (value === null || !Number.isFinite(value)) {
    return {
      display: "Unavailable",
      accessibleText: "Unavailable",
      title: "Unavailable",
      unitLabel: "Percentage points",
      unavailableReason: "comparison-unavailable",
    };
  }

  const prefix = signed && value > 0 ? "+" : "";
  const display = `${prefix}${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value * 100)} pp`;

  return {
    display,
    accessibleText: display,
    title: display,
    unitLabel: "Percentage points",
  };
}

function buildFactor(factorId: DupontFactorId, current: DuPontResult, previous?: DuPontResult): DupontFactorViewModel {
  const metadata = factorMetadata[factorId];
  const rawCurrent = valueFromMetric(current[factorId]);
  const rawPrevious = valueFromMetric(previous?.[factorId]);
  const rawChange = changeValue(rawCurrent, rawPrevious);
  const direction = directionForFactor(factorId, rawChange);

  return {
    id: factorId,
    label: metadata.label,
    current: formatMetric(current[factorId], metadata.unit),
    previous: formatMetric(previous?.[factorId], metadata.unit),
    change: formatChange(rawChange, metadata.unit),
    rawCurrent,
    rawPrevious,
    rawChange,
    unit: metadata.unit === "percentage" ? "Percentage" : "Multiple",
    direction,
    directionLabel: directionLabel(direction, factorId),
    meaning: metadata.meaning,
  };
}

function reconciliationStatus(status: DuPontResult["reconciliationStatus"]) {
  if (status === "reconciled") {
    return "Reconciled";
  }

  if (status === "approximate") {
    return "Approximate";
  }

  return "Unavailable";
}

function contributionDirection(value: number) {
  if (Math.abs(value) < attributionTolerance) {
    return "neutral";
  }

  return value > 0 ? "positive" : "negative";
}

function buildAttribution(current: DuPontResult, previous?: DuPontResult): DupontAttributionViewModel {
  if (!previous) {
    return {
      status: "unavailable",
      reason: "A previous period is required for ROE driver attribution.",
      tolerance: attributionTolerance,
      primaryDriver: null,
      contributions: [],
      reconciliation: {
        label: "Attribution reconciliation",
        equation: "Margin contribution + Asset Turnover contribution + Financial Leverage contribution = current ROE - previous ROE",
        status: "unavailable",
        statusLabel: "Unavailable",
        totalAttributedChange: formatPercentagePointValue(null),
        actualRoeChange: formatPercentagePointValue(null),
        difference: formatPercentagePointValue(null),
        tolerance: formatPercentagePointValue(attributionTolerance),
        toleranceRaw: attributionTolerance,
      },
      summary: "ROE driver attribution is unavailable without a prior comparison period.",
    };
  }

  const attribution = calculateDupontDriverAttribution(previous, current, attributionTolerance);

  if (attribution.status === "unavailable") {
    return {
      status: "unavailable",
      reason: attribution.reason,
      tolerance: attribution.tolerance,
      primaryDriver: null,
      contributions: [],
      reconciliation: {
        label: "Attribution reconciliation",
        equation: "Margin contribution + Asset Turnover contribution + Financial Leverage contribution = current ROE - previous ROE",
        status: "unavailable",
        statusLabel: "Unavailable",
        totalAttributedChange: formatPercentagePointValue(null),
        actualRoeChange: formatPercentagePointValue(null),
        difference: formatPercentagePointValue(null),
        tolerance: formatPercentagePointValue(attribution.tolerance),
        toleranceRaw: attribution.tolerance,
      },
      summary: attribution.reason,
    };
  }

  const contributions: DupontAttributionContributionViewModel[] = attribution.contributions.map((contribution) => ({
    factorId: contribution.factorId,
    label: factorMetadata[contribution.factorId].label,
    value: formatPercentagePointValue(contribution.value, true),
    rawValue: contribution.value,
    direction: contributionDirection(contribution.value),
  }));
  const primaryDriver = attribution.primaryDriver
    ? contributions.find((contribution) => contribution.factorId === attribution.primaryDriver?.factorId) ?? null
    : null;
  const totalAttributedChange = contributions.reduce((sum, contribution) => sum + contribution.rawValue, 0);
  const status: DupontAttributionReconciliationViewModel["status"] = attribution.status === "failed" ? "failed" : "reconciled";
  const statusLabel: DupontAttributionReconciliationViewModel["statusLabel"] = attribution.status === "failed" ? "Failed" : "Reconciled";
  const reconciliation: DupontAttributionReconciliationViewModel = {
    label: "Attribution reconciliation" as const,
    equation: "Margin contribution + Asset Turnover contribution + Financial Leverage contribution = current ROE - previous ROE",
    status,
    statusLabel,
    totalAttributedChange: formatPercentagePointValue(totalAttributedChange, true),
    actualRoeChange: formatPercentagePointValue(attribution.totalChange, true),
    difference: formatPercentagePointValue(attribution.reconciliationDifference),
    tolerance: formatPercentagePointValue(attribution.tolerance),
    toleranceRaw: attribution.tolerance,
  };

  if (attribution.status === "failed") {
    return {
      status: "failed",
      reason: attribution.reason,
      totalChange: formatPercentagePointValue(attribution.totalChange, true),
      totalChangeRaw: attribution.totalChange,
      reconciliationDifference: attribution.reconciliationDifference,
      tolerance: attribution.tolerance,
      primaryDriver,
      contributions,
      reconciliation,
      summary: attribution.reason,
    };
  }

  return {
    status: "available",
    totalChange: formatPercentagePointValue(attribution.totalChange, true),
    totalChangeRaw: attribution.totalChange,
    reconciliationDifference: attribution.reconciliationDifference,
    tolerance: attribution.tolerance,
    primaryDriver,
    contributions,
    reconciliation,
    summary: primaryDriver
      ? `${primaryDriver.label} has the largest contribution to the ROE change.`
      : "ROE change is balanced across the DuPont factors.",
  };
}

function trendBase(points: Array<{ year: number; rawValue: number | null }>) {
  return points.find((point) => point.rawValue !== null && point.rawValue !== 0) ?? null;
}

function indexedTrendValue(value: number | null, base: number | null) {
  if (value === null || base === null || base === 0) {
    return null;
  }

  return (value / base) * 100;
}

function indexDisclosure(series: DupontFactorTrendViewModel["series"]) {
  const baseYears = Array.from(new Set(series.map((item) => item.baseYear).filter((year) => year !== null)));
  const sharedBaseYear = baseYears.length === 1 ? baseYears[0] : null;

  return {
    title: "Indexed trend" as const,
    summary: "Base: first available year = 100" as const,
    detail:
      sharedBaseYear !== null
        ? `Base year: ${sharedBaseYear} = 100`
        : "Each series is indexed independently from its first available non-zero value; zero or unavailable base values remain unavailable.",
  };
}

function buildTrends(periods: FinancialAnalysisResult["periods"]): DupontFactorTrendViewModel {
  const years = periods.map((period) => period.year);
  type TrendSeriesInput = Omit<DupontFactorTrendViewModel["series"][number], "baseYear" | "baseValue" | "indexedPoints">;
  const seriesInputs: TrendSeriesInput[] = [
    {
      id: "roe",
      label: "Return on Equity",
      unit: "percentage",
      points: periods.map((period) => ({
        year: period.year,
        rawValue: valueFromMetric(period.dupont.roe),
        displayValue: formatMetric(period.dupont.roe, "percentage").display,
      })),
    },
    ...factorOrder.map((factorId) => ({
      id: factorId,
      label: factorMetadata[factorId].label,
      unit: factorMetadata[factorId].unit,
      points: periods.map((period) => ({
        year: period.year,
        rawValue: valueFromMetric(period.dupont[factorId]),
        displayValue: formatMetric(period.dupont[factorId], factorMetadata[factorId].unit).display,
      })),
    })),
  ];
  const series: DupontFactorTrendViewModel["series"] = seriesInputs.map((item) => {
    const base = trendBase(item.points);

    return {
      ...item,
      baseYear: base?.year ?? null,
      baseValue: base?.rawValue ?? null,
      indexedPoints: item.points.map((point) => ({
        year: point.year,
        indexedValue: indexedTrendValue(point.rawValue, base?.rawValue ?? null),
      })),
    };
  });

  return {
    years,
    series,
    indexDisclosure: indexDisclosure(series),
    summary: `Three-year DuPont trends compare ROE, margin, asset efficiency and leverage across ${years.join(", ")}.`,
  };
}

export function buildDupontAnalysisViewModel(
  input: FinancialAnalysisInput,
  analysis: FinancialAnalysisResult
): DupontAnalysisViewModel {
  const current = analysis.currentPeriod.dupont;
  const previous = analysis.previousPeriod?.dupont;
  const currentRoeRaw = valueFromMetric(current.roe);
  const previousRoeRaw = valueFromMetric(previous?.roe);
  const roeChangeRaw = changeValue(currentRoeRaw, previousRoeRaw);
  const overviewDirection = directionForFactor("roe", roeChangeRaw);
  const factors = factorOrder.map((factorId) => buildFactor(factorId, current, previous));
  const attribution = buildAttribution(current, previous);
  const periodDisplay = previous ? `${current.year} vs ${previous.year}` : `${current.year}`;
  const reconciliation = reconciliationStatus(current.reconciliationStatus);
  const baseViewModel = {
    company: {
      name: analysis.company.name,
      industry: analysis.company.industry,
      currency: analysis.company.currency,
    },
    period: {
      currentYear: current.year,
      comparisonYear: previous?.year ?? null,
      display: periodDisplay,
    },
    routes: {
      dashboard: "/analysis" as const,
      editInput: "/input" as const,
      methodology: "/methodology" as const,
    },
    availability: {
      label: reconciliation,
      description:
        reconciliation === "Reconciled"
          ? "The current DuPont identity reconciles using unrounded domain values."
          : "At least one DuPont component is unavailable or approximate.",
    },
    overview: {
      currentRoe: formatMetric(current.roe, "percentage"),
      previousRoe: formatMetric(previous?.roe, "percentage"),
      change: formatChange(roeChangeRaw, "percentage"),
      rawChange: roeChangeRaw,
      direction: overviewDirection,
      directionLabel: directionLabel(overviewDirection, "roe"),
      reconciliationStatus: reconciliation,
    },
    identity: {
      text: "ROE = Net Profit Margin × Asset Turnover × Financial Leverage",
      factors,
      result: formatMetric(current.roe, "percentage"),
      reconciliationText:
        reconciliation === "Reconciled"
          ? "The factor product reconciles to reported ROE within tolerance."
          : "The factor product cannot be fully reconciled from the available components.",
    },
    factorComparison: factors,
    attribution,
    trends: buildTrends(analysis.periods),
    leverageContext: "",
    methodology: {
      identity: "ROE = Net Profit Margin × Asset Turnover × Financial Leverage",
      factorDefinitions: [
        "Net Profit Margin = Net Income / Revenue.",
        "Asset Turnover = Revenue / Average Total Assets.",
        "Financial Leverage = Average Total Assets / Average Equity.",
      ],
      averageBalanceConvention:
        "Asset turnover and financial leverage use average balances; the oldest period uses current closing balances as the fallback.",
      attributionMethod:
        "ROE-change attribution uses an exact Shapley decomposition across all six factor substitution orders.",
      tolerance: `Contribution reconciliation tolerance is ${attributionTolerance}.`,
      unavailableConditions:
        "Attribution is unavailable when ROE or any DuPont factor is unavailable for either comparison period, or when contributions do not reconcile within tolerance.",
      disclaimer:
        "This DuPont analysis is an educational decomposition of supplied financial statements, not a credit rating, audit opinion, investment recommendation or professional judgement.",
    },
  } satisfies Omit<DupontAnalysisViewModel, "explanation">;
  const explanation = buildDriverExplanation(baseViewModel);

  return {
    ...baseViewModel,
    explanation: {
      headline: explanation.headline,
      text: explanation.text,
      operatingContext: explanation.operatingContext,
    },
    leverageContext: explanation.leverageContext,
  };
}
