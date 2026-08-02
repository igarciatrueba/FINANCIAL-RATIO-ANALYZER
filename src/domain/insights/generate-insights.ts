import type {
  AnalyticalCoverage,
  CompanyProfile,
  FinancialHealthScore,
  FinancialInsight,
  InsightEvidence,
  InsightSeverity,
  MetricResult,
  PeriodAnalysis,
  PeriodScoreResult,
  TrendDirection,
} from "@/domain/types";

export type InsightContext = {
  company: CompanyProfile;
  periods: PeriodAnalysis[];
  currentPeriod: PeriodAnalysis;
  previousPeriod?: PeriodAnalysis;
  scoreHistory: PeriodScoreResult[];
  score: FinancialHealthScore;
  coverage: AnalyticalCoverage;
};

type InsightRuleResult = Omit<FinancialInsight, "id"> | null;

type InsightRule = {
  id: string;
  order: number;
  evaluate: (context: InsightContext) => InsightRuleResult;
};

const severityRank: Record<InsightSeverity, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function availableValue(metric: MetricResult | undefined): number | null {
  return metric?.status === "available" && Number.isFinite(metric.value) ? metric.value : null;
}

function metric(period: PeriodAnalysis | undefined, metricId: string): MetricResult | undefined {
  return period?.ratios[metricId];
}

function value(period: PeriodAnalysis | undefined, metricId: string): number | null {
  return availableValue(metric(period, metricId));
}

function latest(context: InsightContext, metricId: string): number | null {
  return value(context.currentPeriod, metricId);
}

function metricEvidence(period: PeriodAnalysis, metricId: string): InsightEvidence {
  return {
    type: "metric",
    metricId,
    year: period.year,
    value: metric(period, metricId) ?? { status: "unavailable", reason: "missing-input" },
  };
}

function changeEvidence(from: PeriodAnalysis, to: PeriodAnalysis, metricId: string): InsightEvidence {
  const fromValue = value(from, metricId);
  const toValue = value(to, metricId);
  return {
    type: "change",
    metricId,
    fromYear: from.year,
    toYear: to.year,
    change:
      fromValue === null || toValue === null
        ? { status: "unavailable", reason: "missing-input" }
        : { status: "available", value: toValue - fromValue },
  };
}

function threeValues(context: InsightContext, metricId: string): [number, number, number] | null {
  if (context.periods.length < 3) {
    return null;
  }
  const values = context.periods.map((period) => value(period, metricId));
  if (values.some((item) => item === null)) {
    return null;
  }
  return values as [number, number, number];
}

function makeInsight(
  ruleId: string,
  title: string,
  explanation: string,
  category: FinancialInsight["category"],
  severity: FinancialInsight["severity"],
  priority: number,
  trend: TrendDirection,
  supportingMetricIds: string[],
  evidence: InsightEvidence[],
  affectedYear: number
): InsightRuleResult {
  return {
    ruleId,
    title,
    explanation,
    category,
    severity,
    affectedYear,
    trend,
    priority,
    supportingMetricIds,
    evidence,
  };
}

const rules: InsightRule[] = [
  {
    id: "improving-margins",
    order: 1,
    evaluate(context) {
      const values = threeValues(context, "ebit-margin");
      if (!values) return null;
      const [first, second, third] = values;
      if (third > 0 && ((second > first && third > second) || third - second >= 0.02)) {
        return makeInsight(
          "improving-margins",
          "EBIT margin is improving",
          "EBIT margin improved in the latest period, indicating stronger operating profitability.",
          "strength",
          "medium",
          75,
          "improving",
          ["ebit-margin"],
          [changeEvidence(context.periods[1], context.periods[2], "ebit-margin")],
          context.currentPeriod.year
        );
      }
      return null;
    },
  },
  {
    id: "declining-margins",
    order: 2,
    evaluate(context) {
      const values = threeValues(context, "ebit-margin");
      if (!values) return null;
      const [first, second, third] = values;
      if ((second < first && third < second) || second - third >= 0.02) {
        return makeInsight(
          "declining-margins",
          "EBIT margin is declining",
          "EBIT margin weakened in the latest period, indicating pressure on operating profitability.",
          "risk",
          "high",
          95,
          "deteriorating",
          ["ebit-margin"],
          [changeEvidence(context.periods[1], context.periods[2], "ebit-margin")],
          context.currentPeriod.year
        );
      }
      return null;
    },
  },
  {
    id: "strong-liquidity",
    order: 3,
    evaluate(context) {
      const currentRatio = latest(context, "current-ratio");
      const quickRatio = latest(context, "quick-ratio");
      const ocfRatio = latest(context, "operating-cash-flow-ratio");
      if (currentRatio === null || quickRatio === null || ocfRatio === null) return null;
      if (currentRatio >= 1.5 && quickRatio >= 1 && ocfRatio >= 0.5) {
        return makeInsight(
          "strong-liquidity",
          "Liquidity coverage is strong",
          "Current, quick and operating-cash-flow ratios indicate solid short-term coverage.",
          "strength",
          "medium",
          70,
          "stable",
          ["current-ratio", "quick-ratio", "operating-cash-flow-ratio"],
          [
            metricEvidence(context.currentPeriod, "current-ratio"),
            metricEvidence(context.currentPeriod, "quick-ratio"),
            metricEvidence(context.currentPeriod, "operating-cash-flow-ratio"),
          ],
          context.currentPeriod.year
        );
      }
      return null;
    },
  },
  {
    id: "weak-liquidity",
    order: 4,
    evaluate(context) {
      const checks = [
        ["current-ratio", 1],
        ["quick-ratio", 0.8],
        ["operating-cash-flow-ratio", 0],
      ] as const;
      const triggered = checks.filter(([metricId, threshold]) => {
        const metricValue = latest(context, metricId);
        return metricValue !== null && metricValue < threshold;
      });
      if (triggered.length === 0) return null;
      return makeInsight(
        "weak-liquidity",
        "Liquidity indicators are weak",
        "One or more latest-period liquidity metrics are below the configured analytical threshold.",
        "risk",
        "high",
        100,
        "deteriorating",
        triggered.map(([metricId]) => metricId),
        triggered.map(([metricId]) => metricEvidence(context.currentPeriod, metricId)),
        context.currentPeriod.year
      );
    },
  },
  {
    id: "increasing-leverage",
    order: 5,
    evaluate(context) {
      const values = threeValues(context, "debt-to-equity");
      if (!values) return null;
      const [first, second, third] = values;
      if ((second > first && third > second) || third - second >= 0.25) {
        return makeInsight(
          "increasing-leverage",
          "Debt-to-equity is increasing",
          "Debt-to-equity increased in the latest period, indicating rising financial leverage.",
          "risk",
          "high",
          92,
          "deteriorating",
          ["debt-to-equity"],
          [changeEvidence(context.periods[1], context.periods[2], "debt-to-equity")],
          context.currentPeriod.year
        );
      }
      return null;
    },
  },
  {
    id: "decreasing-leverage",
    order: 6,
    evaluate(context) {
      const values = threeValues(context, "debt-to-equity");
      if (!values) return null;
      const [first, second, third] = values;
      if ((second < first && third < second) || second - third >= 0.25) {
        return makeInsight(
          "decreasing-leverage",
          "Debt-to-equity is decreasing",
          "Debt-to-equity declined in the latest period, indicating lower financial leverage.",
          "strength",
          "medium",
          68,
          "improving",
          ["debt-to-equity"],
          [changeEvidence(context.periods[1], context.periods[2], "debt-to-equity")],
          context.currentPeriod.year
        );
      }
      return null;
    },
  },
  {
    id: "strong-interest-coverage",
    order: 7,
    evaluate(context) {
      const coverage = latest(context, "interest-coverage");
      if (coverage !== null && coverage >= 5) {
        return makeInsight(
          "strong-interest-coverage",
          "Interest coverage is strong",
          "Latest-period EBIT provides strong coverage of interest expense.",
          "strength",
          "medium",
          65,
          "stable",
          ["interest-coverage"],
          [metricEvidence(context.currentPeriod, "interest-coverage")],
          context.currentPeriod.year
        );
      }
      return null;
    },
  },
  {
    id: "weak-interest-coverage",
    order: 8,
    evaluate(context) {
      const coverage = latest(context, "interest-coverage");
      if (coverage !== null && coverage < 2) {
        return makeInsight(
          "weak-interest-coverage",
          "Interest coverage is weak",
          "Latest-period interest coverage is below the configured risk threshold.",
          "risk",
          "high",
          98,
          "deteriorating",
          ["interest-coverage"],
          [metricEvidence(context.currentPeriod, "interest-coverage")],
          context.currentPeriod.year
        );
      }
      return null;
    },
  },
  {
    id: "deteriorating-working-capital-efficiency",
    order: 9,
    evaluate(context) {
      const values = threeValues(context, "cash-conversion-cycle");
      if (!values) return null;
      const [first, second, third] = values;
      if ((second > first && third > second) || third - second >= 15) {
        const supportingMetricIds = ["cash-conversion-cycle", "days-sales-outstanding", "days-inventory-outstanding", "days-payables-outstanding"].filter(
          (metricId) => metric(context.currentPeriod, metricId)?.status === "available"
        );
        return makeInsight(
          "deteriorating-working-capital-efficiency",
          "Working-capital cycle is deteriorating",
          "The cash conversion cycle increased, indicating slower working-capital recovery.",
          "risk",
          "medium",
          85,
          "deteriorating",
          supportingMetricIds,
          supportingMetricIds.map((metricId) => metricEvidence(context.currentPeriod, metricId)),
          context.currentPeriod.year
        );
      }
      return null;
    },
  },
  {
    id: "negative-free-cash-flow",
    order: 10,
    evaluate(context) {
      const fcf = latest(context, "free-cash-flow");
      if (fcf !== null && fcf < 0) {
        const previousFcf = value(context.previousPeriod, "free-cash-flow");
        return makeInsight(
          "negative-free-cash-flow",
          "Free cash flow is negative",
          previousFcf !== null && previousFcf < 0
            ? "Free cash flow remained negative, limiting discretionary cash generation after reinvestment."
            : "Free cash flow is negative in the latest period after capital expenditure.",
          "risk",
          "high",
          100,
          "deteriorating",
          ["free-cash-flow"],
          [metricEvidence(context.currentPeriod, "free-cash-flow")],
          context.currentPeriod.year
        );
      }
      return null;
    },
  },
  {
    id: "earnings-unsupported-by-operating-cash-flow",
    order: 11,
    evaluate(context) {
      const ratio = latest(context, "operating-cash-flow-to-net-income");
      if (ratio !== null && ratio > 0 && ratio < 0.8) {
        return makeInsight(
          "earnings-unsupported-by-operating-cash-flow",
          "Earnings are weakly supported by operating cash flow",
          "Operating cash flow is low relative to net income, reducing confidence in earnings quality.",
          "risk",
          "high",
          96,
          "deteriorating",
          ["operating-cash-flow-to-net-income"],
          [metricEvidence(context.currentPeriod, "operating-cash-flow-to-net-income")],
          context.currentPeriod.year
        );
      }
      return null;
    },
  },
  {
    id: "roe-driven-by-leverage",
    order: 12,
    evaluate(context) {
      const roe = latest(context, "return-on-equity");
      const roa = latest(context, "return-on-assets");
      const leverage = availableValue(context.currentPeriod.dupont.financialLeverage);
      if (roe !== null && roa !== null && leverage !== null && roe > 0 && leverage >= 3 && roa <= 0.06) {
        return makeInsight(
          "roe-driven-by-leverage",
          "ROE is materially supported by leverage",
          "Positive ROE coincides with high financial leverage and modest ROA, indicating leverage dependency.",
          "risk",
          "medium",
          82,
          "mixed",
          ["return-on-equity", "return-on-assets"],
          [metricEvidence(context.currentPeriod, "return-on-equity"), metricEvidence(context.currentPeriod, "return-on-assets")],
          context.currentPeriod.year
        );
      }
      return null;
    },
  },
  {
    id: "improving-health-score",
    order: 13,
    evaluate(context) {
      if (context.score.changeFromPreviousPeriod !== null && context.score.changeFromPreviousPeriod >= 5) {
        return makeInsight(
          "improving-health-score",
          "Financial Health Score improved",
          "The current score improved by at least five points from the previous period.",
          "strength",
          "medium",
          80,
          "improving",
          ["financial-health-score"],
          [{ type: "metric", metricId: "financial-health-score", year: context.currentPeriod.year, value: { status: "available", value: context.score.changeFromPreviousPeriod } }],
          context.currentPeriod.year
        );
      }
      return null;
    },
  },
  {
    id: "deteriorating-health-score",
    order: 14,
    evaluate(context) {
      if (context.score.changeFromPreviousPeriod !== null && context.score.changeFromPreviousPeriod <= -5) {
        return makeInsight(
          "deteriorating-health-score",
          "Financial Health Score deteriorated",
          "The current score declined by at least five points from the previous period.",
          "risk",
          "high",
          94,
          "deteriorating",
          ["financial-health-score"],
          [{ type: "metric", metricId: "financial-health-score", year: context.currentPeriod.year, value: { status: "available", value: context.score.changeFromPreviousPeriod } }],
          context.currentPeriod.year
        );
      }
      return null;
    },
  },
  {
    id: "persistent-profitability",
    order: 15,
    evaluate(context) {
      const netMargins = threeValues(context, "net-margin");
      const ebitMargins = threeValues(context, "ebit-margin");
      if (netMargins && ebitMargins && netMargins.every((item) => item > 0) && ebitMargins.every((item) => item > 0)) {
        return makeInsight(
          "persistent-profitability",
          "Profitability remains positive",
          "Net margin and EBIT margin are positive across all three reporting periods.",
          "strength",
          "low",
          55,
          "stable",
          ["net-margin", "ebit-margin"],
          [metricEvidence(context.currentPeriod, "net-margin"), metricEvidence(context.currentPeriod, "ebit-margin")],
          context.currentPeriod.year
        );
      }
      return null;
    },
  },
  {
    id: "margin-cash-divergence",
    order: 16,
    evaluate(context) {
      if (!context.previousPeriod) return null;
      const ebitNow = latest(context, "ebit-margin");
      const ebitPrevious = value(context.previousPeriod, "ebit-margin");
      const ocfNow = latest(context, "operating-cash-flow-margin");
      const ocfPrevious = value(context.previousPeriod, "operating-cash-flow-margin");
      if (ebitNow === null || ebitPrevious === null || ocfNow === null || ocfPrevious === null) return null;
      if (ebitNow - ebitPrevious > 0 && ocfNow - ocfPrevious <= -0.03) {
        return makeInsight(
          "margin-cash-divergence",
          "Margin improvement is not matched by cash conversion",
          "EBIT margin improved while operating cash flow margin declined materially.",
          "risk",
          "medium",
          88,
          "mixed",
          ["ebit-margin", "operating-cash-flow-margin"],
          [changeEvidence(context.previousPeriod, context.currentPeriod, "ebit-margin"), changeEvidence(context.previousPeriod, context.currentPeriod, "operating-cash-flow-margin")],
          context.currentPeriod.year
        );
      }
      return null;
    },
  },
  {
    id: "balance-sheet-deleveraging",
    order: 17,
    evaluate(context) {
      const debtToAssets = threeValues(context, "debt-to-assets");
      const equityRatio = threeValues(context, "equity-ratio");
      if (!debtToAssets || !equityRatio) return null;
      if (debtToAssets[1] < debtToAssets[0] && debtToAssets[2] < debtToAssets[1] && equityRatio[1] > equityRatio[0] && equityRatio[2] > equityRatio[1]) {
        return makeInsight(
          "balance-sheet-deleveraging",
          "Balance sheet leverage is declining",
          "Debt-to-assets declined while equity ratio increased across both intervals.",
          "strength",
          "medium",
          72,
          "improving",
          ["debt-to-assets", "equity-ratio"],
          [changeEvidence(context.periods[1], context.periods[2], "debt-to-assets"), changeEvidence(context.periods[1], context.periods[2], "equity-ratio")],
          context.currentPeriod.year
        );
      }
      return null;
    },
  },
  {
    id: "insufficient-analytical-coverage",
    order: 18,
    evaluate(context) {
      if (context.score.total === null || context.coverage.coveragePercentage < 80) {
        const unavailableScore = context.score.total === null;
        return makeInsight(
          "insufficient-analytical-coverage",
          "Analytical coverage is limited",
          "Some configured score metrics are unavailable, reducing analytical coverage.",
          "observation",
          unavailableScore ? "high" : "medium",
          unavailableScore ? 110 : 60,
          "mixed",
          ["analytical-coverage"],
          [
            {
              type: "coverage",
              coveragePercentage: context.coverage.coveragePercentage,
              unavailableMetricIds: context.coverage.unavailableMetricIds,
            },
          ],
          context.currentPeriod.year
        );
      }
      return null;
    },
  },
];

function sortInsights(a: FinancialInsight & { order: number }, b: FinancialInsight & { order: number }) {
  const priorityDelta = b.priority - a.priority;
  if (priorityDelta !== 0) return priorityDelta;

  const severityDelta = severityRank[b.severity] - severityRank[a.severity];
  if (severityDelta !== 0) return severityDelta;

  const orderDelta = a.order - b.order;
  if (orderDelta !== 0) return orderDelta;

  return a.ruleId.localeCompare(b.ruleId);
}

export function generateDeterministicInsights(context: InsightContext): FinancialInsight[] {
  return rules
    .map((rule) => {
      const result = rule.evaluate(context);
      return result
        ? {
            ...result,
            id: `${rule.id}-${result.affectedYear}`,
            order: rule.order,
          }
        : null;
    })
    .filter((insight): insight is FinancialInsight & { order: number } => insight !== null)
    .sort(sortInsights)
    .map((insightWithOrder) => ({
      id: insightWithOrder.id,
      ruleId: insightWithOrder.ruleId,
      title: insightWithOrder.title,
      category: insightWithOrder.category,
      severity: insightWithOrder.severity,
      explanation: insightWithOrder.explanation,
      supportingMetricIds: insightWithOrder.supportingMetricIds,
      affectedYear: insightWithOrder.affectedYear,
      trend: insightWithOrder.trend,
      priority: insightWithOrder.priority,
      evidence: insightWithOrder.evidence,
    }));
}
