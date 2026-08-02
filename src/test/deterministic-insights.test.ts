import { describe, expect, it } from "vitest";

import type { DuPontResult, FinancialHealthScore, MetricResult, PeriodAnalysis, PeriodScoreResult } from "@/domain";
import { analyseFinancialStatements } from "@/domain/analyse-financial-statements";
import { selectPrincipalInsights } from "@/domain/insights";
import { generateDeterministicInsights } from "@/domain/insights/generate-insights";
import { cloneDemoCompany } from "@/features/financial-input/demo-companies";

const available = (value: number): MetricResult => ({ status: "available", value });
const unavailable: MetricResult = { status: "unavailable", reason: "zero-denominator" };

function score(total: number | null, changeFromPreviousPeriod: number | null = null): FinancialHealthScore {
  return {
    total,
    classification: total === null ? "Unavailable" : total >= 80 ? "Strong" : total >= 65 ? "Healthy" : total >= 50 ? "Moderate" : total >= 35 ? "Weak" : "Critical",
    dimensions: [],
    changeFromPreviousPeriod,
    coveragePercentage: total === null ? 50 : 100,
    strongestDimension: null,
    weakestDimension: null,
    positiveDrivers: [],
    negativeDrivers: [],
    metricScores: [],
    trend: changeFromPreviousPeriod === null ? "mixed" : changeFromPreviousPeriod >= 5 ? "improving" : changeFromPreviousPeriod <= -5 ? "deteriorating" : Math.abs(changeFromPreviousPeriod) <= 2 ? "stable" : "mixed",
  };
}

function period(
  year: number,
  ratios: Record<string, MetricResult>,
  overrides: Partial<DuPontResult> = {}
): PeriodAnalysis {
  const dupont: DuPontResult = {
    year,
    roe: ratios["return-on-equity"] ?? available(0),
    netProfitMargin: ratios["net-margin"] ?? available(0),
    assetTurnover: ratios["asset-turnover"] ?? available(0),
    financialLeverage: available(1),
    reconciliationStatus: "reconciled",
    ...overrides,
  };

  return {
    year,
    ratios,
    dupont,
    score: score(70),
  };
}

function history(periods: PeriodAnalysis[], currentScore: FinancialHealthScore = score(70)): PeriodScoreResult[] {
  return periods.map((item, index) => ({
    year: item.year,
    score: index === periods.length - 1 ? currentScore : score(65 + index),
  }));
}

function insightsFor(periods: PeriodAnalysis[], currentScore: FinancialHealthScore = score(70)) {
  return generateDeterministicInsights({
    company: { id: "test", name: "Test Co", industry: "Test", currency: "EUR" },
    periods,
    currentPeriod: periods[periods.length - 1],
    previousPeriod: periods[periods.length - 2],
    scoreHistory: history(periods, currentScore),
    score: currentScore,
    coverage: {
      validMetricCount: 20,
      configuredMetricCount: 20,
      coveragePercentage: currentScore.total === null ? 50 : 100,
      unavailableMetricIds: [],
    },
  });
}

describe("Phase 5 deterministic insight rules", () => {
  it("triggers improving and declining margin rules at their boundaries", () => {
    const improving = insightsFor([
      period(2022, { "ebit-margin": available(0.1) }),
      period(2023, { "ebit-margin": available(0.11) }),
      period(2024, { "ebit-margin": available(0.13) }),
    ]);
    const declining = insightsFor([
      period(2022, { "ebit-margin": available(0.14) }),
      period(2023, { "ebit-margin": available(0.13) }),
      period(2024, { "ebit-margin": available(0.1) }),
    ]);

    expect(improving.map((insight) => insight.ruleId)).toContain("improving-margins");
    expect(declining.find((insight) => insight.ruleId === "declining-margins")).toEqual(
      expect.objectContaining({ category: "risk", severity: "high", trend: "deteriorating" })
    );
  });

  it("does not trigger margin rules when required evidence is unavailable", () => {
    const insights = insightsFor([
      period(2022, { "ebit-margin": unavailable }),
      period(2023, { "ebit-margin": available(0.13) }),
      period(2024, { "ebit-margin": available(0.14) }),
    ]);

    expect(insights.map((insight) => insight.ruleId)).not.toContain("improving-margins");
    expect(insights.map((insight) => insight.ruleId)).not.toContain("declining-margins");
  });

  it("triggers strong and weak liquidity rules with supporting evidence", () => {
    const strong = insightsFor([
      period(2022, {}),
      period(2023, {}),
      period(2024, {
        "current-ratio": available(1.5),
        "quick-ratio": available(1),
        "operating-cash-flow-ratio": available(0.5),
      }),
    ]);
    const weak = insightsFor([
      period(2022, {}),
      period(2023, {}),
      period(2024, {
        "current-ratio": available(0.9),
        "quick-ratio": available(0.7),
        "operating-cash-flow-ratio": available(-0.1),
      }),
    ]);

    expect(strong.find((insight) => insight.ruleId === "strong-liquidity")?.evidence).toHaveLength(3);
    expect(weak.find((insight) => insight.ruleId === "weak-liquidity")).toEqual(
      expect.objectContaining({ category: "risk", priority: 100 })
    );
  });

  it("triggers leverage, interest coverage and working-capital rules", () => {
    const insights = insightsFor([
      period(2022, { "debt-to-equity": available(0.7), "cash-conversion-cycle": available(60) }),
      period(2023, { "debt-to-equity": available(0.9), "cash-conversion-cycle": available(72) }),
      period(2024, {
        "debt-to-equity": available(1.25),
        "interest-coverage": available(1.8),
        "cash-conversion-cycle": available(90),
        "days-sales-outstanding": available(65),
        "days-inventory-outstanding": available(110),
        "days-payables-outstanding": available(85),
      }),
    ]);

    expect(insights.map((insight) => insight.ruleId)).toEqual(
      expect.arrayContaining([
        "weak-interest-coverage",
        "increasing-leverage",
        "deteriorating-working-capital-efficiency",
      ])
    );
  });

  it("triggers decreasing leverage, strong interest coverage and improving score strengths", () => {
    const insights = insightsFor(
      [
        period(2022, { "debt-to-equity": available(1.4) }),
        period(2023, { "debt-to-equity": available(1.1) }),
        period(2024, {
          "debt-to-equity": available(0.8),
          "interest-coverage": available(6),
        }),
      ],
      score(80, 6)
    );

    expect(insights.map((insight) => insight.ruleId)).toEqual(
      expect.arrayContaining(["decreasing-leverage", "strong-interest-coverage", "improving-health-score"])
    );
  });

  it("triggers cash-flow, DuPont and score movement risks", () => {
    const insights = insightsFor(
      [
        period(2022, {}),
        period(2023, { "free-cash-flow": available(-10) }),
        period(
          2024,
          {
            "free-cash-flow": available(-25),
            "operating-cash-flow-to-net-income": available(0.7),
            "return-on-equity": available(0.12),
            "return-on-assets": available(0.05),
          },
          { financialLeverage: available(3.2) }
        ),
      ],
      score(55, -8)
    );

    expect(insights.map((insight) => insight.ruleId)).toEqual(
      expect.arrayContaining([
        "negative-free-cash-flow",
        "earnings-unsupported-by-operating-cash-flow",
        "roe-driven-by-leverage",
        "deteriorating-health-score",
      ])
    );
    expect(insights.find((insight) => insight.ruleId === "negative-free-cash-flow")?.explanation).toContain("remained negative");
  });

  it("triggers profitability, deleveraging, divergence and insufficient coverage rules", () => {
    const profitable = insightsFor([
      period(2022, { "net-margin": available(0.05), "ebit-margin": available(0.1), "debt-to-assets": available(0.5), "equity-ratio": available(0.35), "operating-cash-flow-margin": available(0.15) }),
      period(2023, { "net-margin": available(0.06), "ebit-margin": available(0.11), "debt-to-assets": available(0.4), "equity-ratio": available(0.45), "operating-cash-flow-margin": available(0.14) }),
      period(2024, { "net-margin": available(0.07), "ebit-margin": available(0.14), "debt-to-assets": available(0.3), "equity-ratio": available(0.55), "operating-cash-flow-margin": available(0.1) }),
    ]);
    const lowCoverage = insightsFor([period(2022, {}), period(2023, {}), period(2024, {})], score(null, null));

    expect(profitable.map((insight) => insight.ruleId)).toEqual(
      expect.arrayContaining(["persistent-profitability", "balance-sheet-deleveraging", "margin-cash-divergence"])
    );
    expect(lowCoverage.find((insight) => insight.ruleId === "insufficient-analytical-coverage")).toEqual(
      expect.objectContaining({ category: "observation", severity: "high", priority: 110 })
    );
  });

  it("orders insights deterministically and limits principal strengths and risks", () => {
    const analysis = analyseFinancialStatements(cloneDemoCompany("atlas-manufacturing-group"));
    const repeated = analyseFinancialStatements(cloneDemoCompany("atlas-manufacturing-group"));
    const principal = selectPrincipalInsights(analysis.insights);

    expect(analysis.insights).toEqual(repeated.insights);
    expect(principal.strengths.length).toBeLessThanOrEqual(3);
    expect(principal.risks.length).toBeLessThanOrEqual(3);
    expect([...analysis.insights].sort((a, b) => b.priority - a.priority)[0].priority).toBe(analysis.insights[0].priority);
    for (const insight of analysis.insights) {
      expect(insight.evidence.length).toBeGreaterThan(0);
      expect(insight.supportingMetricIds.length).toBeGreaterThan(0);
    }
  });
});
