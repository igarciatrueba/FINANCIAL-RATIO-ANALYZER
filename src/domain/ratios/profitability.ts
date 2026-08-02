import type { FinancialPeriod, MetricResult } from "@/domain/types";

import {
  calculateAverageCapitalEmployed,
  calculateAverageEquity,
  calculateAverageTotalAssets,
  calculateGrossProfitValue,
  isAvailableMetric,
  safeDivide,
  unavailableMetric,
} from "@/domain/calculations";

export function calculateGrossProfit(period: FinancialPeriod): MetricResult {
  return calculateGrossProfitValue(period);
}

export function calculateGrossMargin(period: FinancialPeriod): MetricResult {
  const grossProfit = calculateGrossProfit(period);

  if (!isAvailableMetric(grossProfit)) {
    return grossProfit;
  }

  return safeDivide(grossProfit.value, period.incomeStatement.revenue, {
    denominatorName: "revenue",
    negativeDenominator: "non-meaningful",
  });
}

export function calculateEbitMargin(period: FinancialPeriod): MetricResult {
  return safeDivide(period.incomeStatement.ebit, period.incomeStatement.revenue, {
    denominatorName: "revenue",
    negativeDenominator: "non-meaningful",
  });
}

export function calculateNetMargin(period: FinancialPeriod): MetricResult {
  return safeDivide(period.incomeStatement.netIncome, period.incomeStatement.revenue, {
    denominatorName: "revenue",
    negativeDenominator: "non-meaningful",
  });
}

export function calculateReturnOnAssets(period: FinancialPeriod, previousPeriod?: FinancialPeriod): MetricResult {
  const averageTotalAssets = calculateAverageTotalAssets(period, previousPeriod);

  if (!isAvailableMetric(averageTotalAssets)) {
    return averageTotalAssets;
  }

  return safeDivide(period.incomeStatement.netIncome, averageTotalAssets.value, {
    denominatorName: "average total assets",
    negativeDenominator: "non-meaningful",
  });
}

export function calculateReturnOnEquity(period: FinancialPeriod, previousPeriod?: FinancialPeriod): MetricResult {
  const averageEquity = calculateAverageEquity(period, previousPeriod);

  if (!isAvailableMetric(averageEquity)) {
    return averageEquity;
  }

  if (averageEquity.value < 0) {
    return unavailableMetric("non-meaningful-denominator", "average equity");
  }

  return safeDivide(period.incomeStatement.netIncome, averageEquity.value, {
    denominatorName: "average equity",
    negativeDenominator: "non-meaningful",
  });
}

export function calculateReturnOnCapitalEmployed(
  period: FinancialPeriod,
  previousPeriod?: FinancialPeriod
): MetricResult {
  const averageCapitalEmployed = calculateAverageCapitalEmployed(period, previousPeriod);

  if (!isAvailableMetric(averageCapitalEmployed)) {
    return averageCapitalEmployed;
  }

  if (averageCapitalEmployed.value < 0) {
    return unavailableMetric("non-meaningful-denominator", "average capital employed");
  }

  return safeDivide(period.incomeStatement.ebit, averageCapitalEmployed.value, {
    denominatorName: "average capital employed",
    negativeDenominator: "non-meaningful",
  });
}
