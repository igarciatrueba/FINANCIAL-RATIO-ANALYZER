import type { DuPontResult, MetricResult } from "@/domain/types";

export type DupontFactorId = "netProfitMargin" | "assetTurnover" | "financialLeverage";

export type DupontFactorContribution = {
  factorId: DupontFactorId;
  value: number;
};

export type DupontDriverAttributionResult =
  | {
      status: "available";
      contributions: DupontFactorContribution[];
      totalChange: number;
      reconciliationDifference: number;
      primaryDriver: DupontFactorContribution | null;
      tolerance: number;
    }
  | {
      status: "unavailable";
      reason: string;
      tolerance: number;
    }
  | {
      status: "failed";
      contributions: DupontFactorContribution[];
      totalChange: number;
      reconciliationDifference: number;
      primaryDriver: DupontFactorContribution | null;
      tolerance: number;
      reason: string;
    };

const factors = ["netProfitMargin", "assetTurnover", "financialLeverage"] as const;
const defaultTolerance = 1e-12;

const labels: Record<DupontFactorId, string> = {
  netProfitMargin: "Net Profit Margin",
  assetTurnover: "Asset Turnover",
  financialLeverage: "Financial Leverage",
};

function isAvailable(metric: MetricResult): metric is Extract<MetricResult, { status: "available" }> {
  return metric.status === "available" && Number.isFinite(metric.value);
}

function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) {
    return [Array.from(items)];
  }

  return items.flatMap((item, index) => {
    const remaining = [...items.slice(0, index), ...items.slice(index + 1)];
    return permutations(remaining).map((permutation) => [item, ...permutation]);
  });
}

function product(values: Record<DupontFactorId, number>) {
  return values.netProfitMargin * values.assetTurnover * values.financialLeverage;
}

function readValues(result: DuPontResult) {
  const netProfitMargin = result.netProfitMargin;
  if (!isAvailable(netProfitMargin)) {
    return {
      status: "unavailable" as const,
      reason: `${labels.netProfitMargin} is unavailable for ${result.year}.`,
    };
  }

  const assetTurnover = result.assetTurnover;
  if (!isAvailable(assetTurnover)) {
    return {
      status: "unavailable" as const,
      reason: `${labels.assetTurnover} is unavailable for ${result.year}.`,
    };
  }

  const financialLeverage = result.financialLeverage;
  if (!isAvailable(financialLeverage)) {
    return {
      status: "unavailable" as const,
      reason: `${labels.financialLeverage} is unavailable for ${result.year}.`,
    };
  }

  if (!isAvailable(result.roe)) {
    return {
      status: "unavailable" as const,
      reason: `Return on Equity is unavailable for ${result.year}.`,
    };
  }

  return {
    status: "available" as const,
    values: {
      netProfitMargin: netProfitMargin.value,
      assetTurnover: assetTurnover.value,
      financialLeverage: financialLeverage.value,
    },
    roe: result.roe.value,
  };
}

function primaryDriver(contributions: DupontFactorContribution[]) {
  const meaningful = contributions.filter((contribution) => Math.abs(contribution.value) > defaultTolerance);

  if (meaningful.length === 0) {
    return null;
  }

  return meaningful.sort((a, b) => {
    const impactDelta = Math.abs(b.value) - Math.abs(a.value);
    if (impactDelta !== 0) {
      return impactDelta;
    }

    return factors.indexOf(a.factorId) - factors.indexOf(b.factorId);
  })[0];
}

export function calculateDupontDriverAttribution(
  previous: DuPontResult,
  current: DuPontResult,
  tolerance = defaultTolerance
): DupontDriverAttributionResult {
  const previousValues = readValues(previous);
  const currentValues = readValues(current);

  if (previousValues.status === "unavailable") {
    return { status: "unavailable", reason: previousValues.reason, tolerance };
  }

  if (currentValues.status === "unavailable") {
    return { status: "unavailable", reason: currentValues.reason, tolerance };
  }

  const totals: Record<DupontFactorId, number> = {
    netProfitMargin: 0,
    assetTurnover: 0,
    financialLeverage: 0,
  };
  const orders = permutations(factors);

  for (const order of orders) {
    const working = { ...previousValues.values };

    for (const factor of order) {
      const before = product(working);
      working[factor] = currentValues.values[factor];
      const after = product(working);
      totals[factor] += after - before;
    }
  }

  const contributions = factors.map((factor) => ({
    factorId: factor,
    value: totals[factor] / orders.length,
  }));
  const contributionTotal = contributions.reduce((sum, contribution) => sum + contribution.value, 0);
  const totalChange = currentValues.roe - previousValues.roe;
  const reconciliationDifference = contributionTotal - totalChange;

  if (Math.abs(reconciliationDifference) > tolerance) {
    return {
      status: "failed",
      contributions,
      totalChange,
      reconciliationDifference,
      primaryDriver: primaryDriver(contributions),
      reason: "DuPont attribution did not reconcile within tolerance.",
      tolerance,
    };
  }

  return {
    status: "available",
    contributions,
    totalChange,
    reconciliationDifference,
    primaryDriver: primaryDriver(contributions),
    tolerance,
  };
}
