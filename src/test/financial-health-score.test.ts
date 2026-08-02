import { describe, expect, it } from "vitest";

import type { MetricResult, PeriodRatioResult } from "@/domain";
import { analyseFinancialStatements } from "@/domain/analyse-financial-statements";
import {
  defaultScoringConfig,
  interpolateMetricScore,
  validateScoringConfig,
  calculateScoreHistory,
  classifyFinancialHealthScore,
} from "@/domain/scoring";
import { cloneDemoCompany } from "@/features/financial-input/demo-companies";

const available = (value: number): MetricResult => ({ status: "available", value });
const unavailable: MetricResult = { status: "unavailable", reason: "zero-denominator" };

function ratioResult(ratios: Record<string, MetricResult>): PeriodRatioResult {
  return {
    year: 2024,
    ratios,
  };
}

function completeExcellentRatios(overrides: Record<string, MetricResult> = {}) {
  return ratioResult({
    "ebit-margin": available(0.2),
    "net-margin": available(0.18),
    "return-on-assets": available(0.15),
    "return-on-equity": available(0.25),
    "return-on-capital-employed": available(0.2),
    "current-ratio": available(1.8),
    "quick-ratio": available(1.2),
    "cash-ratio": available(0.4),
    "operating-cash-flow-ratio": available(1.2),
    "debt-to-equity": available(0.5),
    "debt-to-assets": available(0.2),
    "equity-ratio": available(0.65),
    "interest-coverage": available(8),
    "asset-turnover": available(1.8),
    "days-sales-outstanding": available(30),
    "days-inventory-outstanding": available(30),
    "cash-conversion-cycle": available(30),
    "operating-cash-flow-margin": available(0.2),
    "free-cash-flow-margin": available(0.18),
    "operating-cash-flow-to-net-income": available(1.2),
    ...overrides,
  });
}

describe("Phase 5 scoring configuration", () => {
  it("validates dimension weights, metric weights and formula-registry compatibility", () => {
    const result = validateScoringConfig(defaultScoringConfig);

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(defaultScoringConfig.dimensionWeights).toEqual({
      profitability: 0.25,
      liquidity: 0.2,
      solvency: 0.2,
      efficiency: 0.15,
      "cash-flow": 0.2,
    });
  });

  it("rejects invalid weights, duplicate metrics and malformed anchors deterministically", () => {
    const config = structuredClone(defaultScoringConfig);
    config.dimensionWeights.profitability = 0.5;
    config.metricWeights.profitability["ebit-margin"] = 0.5;
    config.thresholds["ebit-margin"].anchors = [
      { value: 0.2, score: 100 },
      { value: 0.1, score: 50 },
    ];

    const result = validateScoringConfig(config);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Dimension weights must total 1"),
        expect.stringContaining("Metric weights for profitability must total 1"),
        expect.stringContaining("Anchors for ebit-margin must be ordered"),
      ])
    );
  });
});

describe("Phase 5 score interpolation", () => {
  it("supports higher-is-better boundaries, midpoints and endpoint clipping", () => {
    const threshold = defaultScoringConfig.thresholds["ebit-margin"];

    expect(interpolateMetricScore(-0.1, threshold)).toBe(0);
    expect(interpolateMetricScore(0, threshold)).toBe(0);
    expect(interpolateMetricScore(0.075, threshold)).toBe(37.5);
    expect(interpolateMetricScore(0.2, threshold)).toBe(100);
    expect(interpolateMetricScore(0.3, threshold)).toBe(100);
  });

  it("supports lower-is-better midpoints and clipping", () => {
    const threshold = defaultScoringConfig.thresholds["debt-to-equity"];

    expect(interpolateMetricScore(0, threshold)).toBe(100);
    expect(interpolateMetricScore(1.25, threshold)).toBe(62.5);
    expect(interpolateMetricScore(3, threshold)).toBe(0);
    expect(interpolateMetricScore(4, threshold)).toBe(0);
  });

  it("supports target-range plateaus and falling scores after the target range", () => {
    const threshold = defaultScoringConfig.thresholds["current-ratio"];

    expect(interpolateMetricScore(0.65, threshold)).toBe(12.5);
    expect(interpolateMetricScore(2, threshold)).toBe(100);
    expect(interpolateMetricScore(3, threshold)).toBe(87.5);
    expect(interpolateMetricScore(6, threshold)).toBe(50);
  });

  it("classifies unrounded total scores on configured boundaries", () => {
    expect(classifyFinancialHealthScore(null)).toBe("Unavailable");
    expect(classifyFinancialHealthScore(34.999)).toBe("Critical");
    expect(classifyFinancialHealthScore(35)).toBe("Weak");
    expect(classifyFinancialHealthScore(50)).toBe("Moderate");
    expect(classifyFinancialHealthScore(65)).toBe("Healthy");
    expect(classifyFinancialHealthScore(80)).toBe("Strong");
  });
});

describe("Phase 5 missing data and driver handling", () => {
  it("reweights available metrics inside dimensions and discloses coverage", () => {
    const history = calculateScoreHistory(
      [completeExcellentRatios({ "return-on-equity": unavailable, "return-on-capital-employed": unavailable })],
      defaultScoringConfig
    );

    const score = history[0].score;
    const profitability = score.dimensions.find((dimension) => dimension.dimension === "profitability");

    expect(profitability?.score).toBe(100);
    expect(profitability?.validMetricCount).toBe(3);
    expect(profitability?.configuredMetricCount).toBe(5);
    expect(profitability?.coveragePercentage).toBe(65);
    expect(profitability?.unavailableMetricIds).toEqual(["return-on-equity", "return-on-capital-employed"]);
  });

  it("marks dimensions unavailable below coverage or valid metric minimum", () => {
    const history = calculateScoreHistory(
      [
        completeExcellentRatios({
          "net-margin": unavailable,
          "return-on-assets": unavailable,
          "return-on-equity": unavailable,
          "return-on-capital-employed": unavailable,
        }),
      ],
      defaultScoringConfig
    );

    const profitability = history[0].score.dimensions.find((dimension) => dimension.dimension === "profitability");

    expect(profitability?.score).toBeNull();
    expect(profitability?.coveragePercentage).toBe(25);
  });

  it("calculates total analytical coverage and reweights available dimensions", () => {
    const history = calculateScoreHistory(
      [
        completeExcellentRatios({
          "asset-turnover": unavailable,
          "days-sales-outstanding": unavailable,
          "days-inventory-outstanding": unavailable,
          "cash-conversion-cycle": unavailable,
        }),
      ],
      defaultScoringConfig
    );

    const score = history[0].score;

    expect(score.total).toBe(100);
    expect(score.coveragePercentage).toBeCloseTo(85, 12);
    expect(score.dimensions.find((dimension) => dimension.dimension === "efficiency")?.score).toBeNull();
  });

  it("marks total score unavailable below total coverage or dimension minimum", () => {
    const history = calculateScoreHistory(
      [
        completeExcellentRatios({
          "asset-turnover": unavailable,
          "days-sales-outstanding": unavailable,
          "days-inventory-outstanding": unavailable,
          "cash-conversion-cycle": unavailable,
          "operating-cash-flow-margin": unavailable,
          "free-cash-flow-margin": unavailable,
          "operating-cash-flow-to-net-income": unavailable,
        }),
      ],
      defaultScoringConfig
    );

    expect(history[0].score.total).toBeNull();
    expect(history[0].score.classification).toBe("Unavailable");
    expect(history[0].score.coveragePercentage).toBe(65);
  });

  it("identifies strongest and weakest dimensions with stable tie-breaking", () => {
    const history = calculateScoreHistory([completeExcellentRatios({ "current-ratio": available(1) })], defaultScoringConfig);

    expect(history[0].score.strongestDimension?.dimension).toBe("profitability");
    expect(history[0].score.weakestDimension?.dimension).toBe("liquidity");
  });

  it("returns stable positive and negative principal drivers without NaN or Infinity", () => {
    const history = calculateScoreHistory(
      [completeExcellentRatios({ "debt-to-equity": available(3), "cash-conversion-cycle": available(180) })],
      defaultScoringConfig
    );

    const score = history[0].score;

    expect(score.positiveDrivers).toHaveLength(3);
    expect(score.negativeDrivers.map((driver) => driver.metricId)).toEqual(
      expect.arrayContaining(["debt-to-equity", "cash-conversion-cycle"])
    );
    for (const metricScore of score.metricScores) {
      expect(metricScore.score === null || Number.isFinite(metricScore.score)).toBe(true);
      expect(Number.isFinite(metricScore.contribution)).toBe(true);
    }
  });
});

describe("Phase 5 score history and orchestration", () => {
  it("calculates score change and trend from current and previous periods", () => {
    const history = calculateScoreHistory(
      [
        completeExcellentRatios({ "ebit-margin": available(0.1), "net-margin": available(0.07) }),
        completeExcellentRatios({ "ebit-margin": available(0.1), "net-margin": available(0.07) }),
        completeExcellentRatios({ "ebit-margin": available(0.2), "net-margin": available(0.18) }),
      ],
      defaultScoringConfig
    );

    expect(history[2].score.changeFromPreviousPeriod).toBeGreaterThanOrEqual(5);
    expect(history[2].score.trend).toBe("improving");
  });

  it("produces deterministic demo-company scores with NovaTech materially above Atlas", () => {
    const novaOne = analyseFinancialStatements(cloneDemoCompany("novatech-solutions"));
    const novaTwo = analyseFinancialStatements(cloneDemoCompany("novatech-solutions"));
    const atlas = analyseFinancialStatements(cloneDemoCompany("atlas-manufacturing-group"));

    expect(novaOne).toEqual(novaTwo);
    expect(novaOne.score.total).not.toBeNull();
    expect(atlas.score.total).not.toBeNull();
    expect((novaOne.score.total ?? 0) - (atlas.score.total ?? 0)).toBeGreaterThanOrEqual(20);
    expect(["Strong", "Healthy", "Moderate"]).toContain(novaOne.score.classification);
    expect(["Weak", "Critical"]).not.toContain(novaOne.score.classification);
    expect(atlas.insights.some((insight) => insight.category === "risk")).toBe(true);
    expect(novaOne.coverage.coveragePercentage).toBeGreaterThanOrEqual(70);
    expect(atlas.coverage.coveragePercentage).toBeGreaterThanOrEqual(70);
  });
});
