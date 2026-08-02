import type {
  DimensionScore,
  FinancialHealthClassification,
  FinancialHealthScore,
  MetricResult,
  MetricScoreResult,
  MetricThresholdConfiguration,
  PeriodRatioResult,
  PeriodScoreResult,
  RatioCategory,
  ScoreDriver,
  ScoringConfiguration,
  ScoringConfigurationValidationResult,
  TrendDirection,
} from "@/domain/types";
import { formulaRegistry } from "@/domain/ratios";
import { defaultScoringConfig, dimensionOrder } from "@/domain/scoring/config";

const thresholdModes = new Set(["higher-is-better", "lower-is-better", "target-range"]);
const EPSILON = 1e-9;

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function clipScore(score: number) {
  if (!Number.isFinite(score)) {
    return 0;
  }
  return Math.min(100, Math.max(0, score));
}

function ratioCategoryWeight(dimension: RatioCategory, config: ScoringConfiguration) {
  return config.dimensionWeights[dimension] ?? 0;
}

export function validateScoringConfig(config: ScoringConfiguration): ScoringConfigurationValidationResult {
  const issues: string[] = [];
  const dimensionWeightTotal = sum(Object.values(config.dimensionWeights));

  if (Math.abs(dimensionWeightTotal - 1) > EPSILON) {
    issues.push(`Dimension weights must total 1; received ${dimensionWeightTotal}.`);
  }

  for (const threshold of Object.values(config.thresholds)) {
    if (!thresholdModes.has(threshold.mode)) {
      issues.push(`Threshold mode for ${threshold.metricId} is invalid.`);
    }

    for (let index = 0; index < threshold.anchors.length; index += 1) {
      const anchor = threshold.anchors[index];
      if (!Number.isFinite(anchor.value)) {
        issues.push(`Anchor value for ${threshold.metricId} must be finite.`);
      }
      if (!Number.isFinite(anchor.score) || anchor.score < 0 || anchor.score > 100) {
        issues.push(`Anchor scores for ${threshold.metricId} must be between 0 and 100.`);
      }
      if (index > 0 && anchor.value <= threshold.anchors[index - 1].value) {
        issues.push(`Anchors for ${threshold.metricId} must be ordered by value.`);
      }
    }
  }

  const seenMetricIds = new Set<string>();

  for (const dimension of dimensionOrder) {
    const metricWeights = config.metricWeights[dimension] ?? {};
    const metricIds = Object.keys(metricWeights);
    const metricWeightTotal = sum(Object.values(metricWeights).filter((value): value is number => typeof value === "number"));

    if (Math.abs(metricWeightTotal - 1) > EPSILON) {
      issues.push(`Metric weights for ${dimension} must total 1; received ${metricWeightTotal}.`);
    }

    for (const metricId of metricIds) {
      if (seenMetricIds.has(metricId)) {
        issues.push(`Duplicate scored metric configured: ${metricId}.`);
      }
      seenMetricIds.add(metricId);

      const definition = formulaRegistry[metricId as keyof typeof formulaRegistry];
      if (!definition) {
        issues.push(`Configured metric ${metricId} does not exist in formulaRegistry.`);
        continue;
      }
      if (definition.category !== dimension) {
        issues.push(`Configured metric ${metricId} category does not match ${dimension}.`);
      }
      if (!definition.scoreEligible) {
        issues.push(`Configured metric ${metricId} is not score eligible.`);
      }
      if (!config.thresholds[metricId]) {
        issues.push(`Configured metric ${metricId} has no threshold configuration.`);
      }
    }
  }

  for (const thresholdMetricId of Object.keys(config.thresholds)) {
    if (!seenMetricIds.has(thresholdMetricId)) {
      issues.push(`Threshold configured for unscored metric ${thresholdMetricId}.`);
    }
  }

  for (const [name, value] of [
    ["minimumDimensionCoverage", config.minimumDimensionCoverage],
    ["minimumTotalCoverage", config.minimumTotalCoverage],
  ] as const) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      issues.push(`${name} must be between 0 and 1.`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function interpolateMetricScore(value: number, threshold: MetricThresholdConfiguration): number {
  if (!Number.isFinite(value) || threshold.anchors.length === 0) {
    return 0;
  }

  const anchors = threshold.anchors;

  if (value <= anchors[0].value) {
    return clipScore(anchors[0].score);
  }

  const lastAnchor = anchors[anchors.length - 1];
  if (value >= lastAnchor.value) {
    return clipScore(lastAnchor.score);
  }

  for (let index = 1; index < anchors.length; index += 1) {
    const left = anchors[index - 1];
    const right = anchors[index];

    if (value <= right.value) {
      const position = (value - left.value) / (right.value - left.value);
      return clipScore(left.score + (right.score - left.score) * position);
    }
  }

  return clipScore(lastAnchor.score);
}

export function classifyFinancialHealthScore(total: number | null): FinancialHealthClassification {
  if (total === null) {
    return "Unavailable";
  }
  if (total >= 80) {
    return "Strong";
  }
  if (total >= 65) {
    return "Healthy";
  }
  if (total >= 50) {
    return "Moderate";
  }
  if (total >= 35) {
    return "Weak";
  }
  return "Critical";
}

function scoreTrend(change: number | null): TrendDirection {
  if (change === null) {
    return "mixed";
  }
  if (change >= 5) {
    return "improving";
  }
  if (change <= -5) {
    return "deteriorating";
  }
  if (change >= -2 && change <= 2) {
    return "stable";
  }
  return "mixed";
}

function scoreMetric(raw: MetricResult, threshold: MetricThresholdConfiguration): number | null {
  if (raw.status !== "available") {
    return null;
  }
  return interpolateMetricScore(raw.value, threshold);
}

function compareDimensions(a: DimensionScore, b: DimensionScore, config: ScoringConfiguration, direction: "high" | "low") {
  const aScore = a.score ?? 0;
  const bScore = b.score ?? 0;
  const scoreDelta = direction === "high" ? bScore - aScore : aScore - bScore;
  if (Math.abs(scoreDelta) > EPSILON) {
    return scoreDelta;
  }

  const weightDelta = ratioCategoryWeight(b.dimension, config) - ratioCategoryWeight(a.dimension, config);
  if (Math.abs(weightDelta) > EPSILON) {
    return weightDelta;
  }

  return dimensionOrder.indexOf(a.dimension) - dimensionOrder.indexOf(b.dimension);
}

function sortDrivers(a: ScoreDriver, b: ScoreDriver) {
  const impactDelta = Math.abs(b.impact) - Math.abs(a.impact);
  if (Math.abs(impactDelta) > EPSILON) {
    return impactDelta;
  }

  const dimensionDelta = dimensionOrder.indexOf(a.dimension) - dimensionOrder.indexOf(b.dimension);
  if (dimensionDelta !== 0) {
    return dimensionDelta;
  }

  return a.metricId.localeCompare(b.metricId);
}

function calculateSingleScore(
  period: PeriodRatioResult,
  config: ScoringConfiguration,
  changeFromPreviousPeriod: number | null = null
): FinancialHealthScore {
  const dimensions: DimensionScore[] = [];
  const metricScores: MetricScoreResult[] = [];
  const unavailableMetricIds: string[] = [];
  let totalCoverage = 0;

  for (const dimension of dimensionOrder) {
    const weights = config.metricWeights[dimension] ?? {};
    const metricIds = Object.keys(weights);
    const availableWeight = metricIds.reduce((total, metricId) => {
      const raw = period.ratios[metricId] ?? ({ status: "unavailable", reason: "missing-input" } satisfies MetricResult);
      return raw.status === "available" ? total + (weights[metricId] ?? 0) : total;
    }, 0);
    const dimensionMetricScores: MetricScoreResult[] = [];

    for (const metricId of metricIds) {
      const configuredWeight = weights[metricId] ?? 0;
      const raw = period.ratios[metricId] ?? ({ status: "unavailable", reason: "missing-input" } satisfies MetricResult);
      const rawScore = scoreMetric(raw, config.thresholds[metricId]);
      const effectiveWeight = rawScore === null || availableWeight <= 0 ? 0 : configuredWeight / availableWeight;
      const contribution = rawScore === null ? 0 : rawScore * effectiveWeight;

      if (rawScore === null) {
        unavailableMetricIds.push(metricId);
      }

      const metricScore: MetricScoreResult = {
        metricId,
        dimension,
        raw,
        score: rawScore,
        configuredWeight,
        effectiveWeight,
        totalEffectiveWeight: 0,
        contribution,
      };

      dimensionMetricScores.push(metricScore);
      metricScores.push(metricScore);
    }

    const coveragePercentage = availableWeight * 100;
    const validDimensionMetricScores = dimensionMetricScores.filter((metricScore) => metricScore.score !== null);
    const dimensionAvailable =
      availableWeight >= config.minimumDimensionCoverage &&
      validDimensionMetricScores.length >= config.minimumDimensionMetricCount;
    const dimensionScore = dimensionAvailable
      ? validDimensionMetricScores.reduce((total, metricScore) => total + metricScore.contribution, 0)
      : null;

    totalCoverage += ratioCategoryWeight(dimension, config) * availableWeight;

    const sortedByScore = [...validDimensionMetricScores].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    dimensions.push({
      dimension,
      score: dimensionScore,
      validMetricCount: validDimensionMetricScores.length,
      configuredMetricCount: metricIds.length,
      coveragePercentage,
      strongestMetrics: sortedByScore.slice(0, 3).map((metricScore) => metricScore.metricId),
      weakestMetrics: sortedByScore.slice(-3).map((metricScore) => metricScore.metricId),
      unavailableMetricIds: dimensionMetricScores
        .filter((metricScore) => metricScore.score === null)
        .map((metricScore) => metricScore.metricId),
    });
  }

  const availableDimensions = dimensions.filter((dimension) => dimension.score !== null);
  const availableDimensionWeight = availableDimensions.reduce(
    (total, dimension) => total + ratioCategoryWeight(dimension.dimension, config),
    0
  );
  const totalAvailable =
    totalCoverage >= config.minimumTotalCoverage &&
    availableDimensions.length >= config.minimumAvailableDimensionCount &&
    availableDimensionWeight > 0;
  const total = totalAvailable
    ? availableDimensions.reduce((runningTotal, dimension) => {
        const dimensionEffectiveWeight = ratioCategoryWeight(dimension.dimension, config) / availableDimensionWeight;
        return runningTotal + (dimension.score ?? 0) * dimensionEffectiveWeight;
      }, 0)
    : null;

  for (const metricScore of metricScores) {
    const dimension = dimensions.find((item) => item.dimension === metricScore.dimension);
    const dimensionEffectiveWeight =
      totalAvailable && dimension?.score !== null
        ? ratioCategoryWeight(metricScore.dimension, config) / availableDimensionWeight
        : 0;
    metricScore.totalEffectiveWeight = metricScore.effectiveWeight * dimensionEffectiveWeight;
  }

  const drivers = metricScores
    .filter((metricScore): metricScore is MetricScoreResult & { score: number } => metricScore.score !== null)
    .map<ScoreDriver>((metricScore) => {
      const impact = (metricScore.score - 50) * metricScore.totalEffectiveWeight;
      return {
        metricId: metricScore.metricId,
        dimension: metricScore.dimension,
        raw: metricScore.raw,
        score: metricScore.score,
        impact,
        configuredWeight: metricScore.configuredWeight,
        effectiveWeight: metricScore.effectiveWeight,
        totalEffectiveWeight: metricScore.totalEffectiveWeight,
        contribution: metricScore.contribution,
      };
    });

  const positiveDrivers = drivers
    .filter((driver) => driver.impact > 0)
    .sort(sortDrivers)
    .slice(0, 3);
  const negativeDrivers = drivers
    .filter((driver) => driver.impact < 0)
    .sort(sortDrivers)
    .slice(0, 3);
  const strongestDimension = availableDimensions.length
    ? [...availableDimensions].sort((a, b) => compareDimensions(a, b, config, "high"))[0]
    : null;
  const weakestDimension = availableDimensions.length
    ? [...availableDimensions].sort((a, b) => compareDimensions(a, b, config, "low"))[0]
    : null;

  return {
    total,
    classification: classifyFinancialHealthScore(total),
    dimensions,
    changeFromPreviousPeriod,
    coveragePercentage: totalCoverage * 100,
    strongestDimension,
    weakestDimension,
    positiveDrivers,
    negativeDrivers,
    metricScores,
    trend: scoreTrend(changeFromPreviousPeriod),
  };
}

export function calculateScoreHistory(
  periods: PeriodRatioResult[],
  config: ScoringConfiguration = defaultScoringConfig
): PeriodScoreResult[] {
  const preliminaryScores = periods.map((period) => calculateSingleScore(period, config));

  return preliminaryScores.map((score, index) => {
    const previous = index > 0 ? preliminaryScores[index - 1] : undefined;
    const changeFromPreviousPeriod =
      previous?.total !== null && previous?.total !== undefined && score.total !== null ? score.total - previous.total : null;
    return {
      year: periods[index].year,
      score: {
        ...score,
        changeFromPreviousPeriod,
        trend: scoreTrend(changeFromPreviousPeriod),
      },
    };
  });
}

export function calculateAnalyticalCoverage(score: FinancialHealthScore) {
  const unavailableMetricIds = score.dimensions.flatMap((dimension) => dimension.unavailableMetricIds);
  const validMetricCount = score.dimensions.reduce((total, dimension) => total + dimension.validMetricCount, 0);
  const configuredMetricCount = score.dimensions.reduce((total, dimension) => total + dimension.configuredMetricCount, 0);

  return {
    validMetricCount,
    configuredMetricCount,
    coveragePercentage: score.coveragePercentage,
    unavailableMetricIds,
  };
}
