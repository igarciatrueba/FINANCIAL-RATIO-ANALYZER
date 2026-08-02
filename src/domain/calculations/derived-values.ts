import type { FinancialPeriod, MetricResult } from "@/domain/types";

import { calculateAverageBalance } from "@/domain/calculations/averages";
import { availableMetric, isAvailableMetric, safeDivide, unavailableMetric } from "@/domain/calculations/safe-math";

export interface DerivedFinancialValues {
  grossProfit: MetricResult;
  quickAssets: MetricResult;
  workingCapital: MetricResult;
  capitalEmployed: MetricResult;
  freeCashFlow: MetricResult;
  financialLeverage: MetricResult;
}

export function calculateGrossProfitValue(period: FinancialPeriod): MetricResult {
  return availableMetric(period.incomeStatement.revenue - period.incomeStatement.costOfGoodsSold);
}

export function calculateQuickAssets(period: FinancialPeriod): MetricResult {
  return availableMetric(period.balanceSheet.currentAssets - period.balanceSheet.inventory);
}

export function calculateWorkingCapital(period: FinancialPeriod): MetricResult {
  return availableMetric(period.balanceSheet.currentAssets - period.balanceSheet.currentLiabilities);
}

export function calculateCapitalEmployed(period: FinancialPeriod): MetricResult {
  return availableMetric(period.balanceSheet.totalAssets - period.balanceSheet.currentLiabilities);
}

export function calculateFreeCashFlowValue(period: FinancialPeriod): MetricResult {
  return availableMetric(period.cashFlow.operatingCashFlow - period.cashFlow.capitalExpenditure);
}

export function calculateAverageTotalAssets(period: FinancialPeriod, previousPeriod?: FinancialPeriod): MetricResult {
  return calculateAverageBalance(previousPeriod?.balanceSheet.totalAssets, period.balanceSheet.totalAssets, "total assets");
}

export function calculateAverageEquity(period: FinancialPeriod, previousPeriod?: FinancialPeriod): MetricResult {
  return calculateAverageBalance(previousPeriod?.balanceSheet.equity, period.balanceSheet.equity, "equity");
}

export function calculateAverageCapitalEmployed(period: FinancialPeriod, previousPeriod?: FinancialPeriod): MetricResult {
  const currentCapitalEmployed = calculateCapitalEmployed(period);

  if (!isAvailableMetric(currentCapitalEmployed)) {
    return currentCapitalEmployed;
  }

  const previousCapitalEmployed = previousPeriod ? calculateCapitalEmployed(previousPeriod) : undefined;

  if (previousCapitalEmployed && !isAvailableMetric(previousCapitalEmployed)) {
    return previousCapitalEmployed;
  }

  return calculateAverageBalance(
    previousCapitalEmployed?.value,
    currentCapitalEmployed.value,
    "capital employed"
  );
}

export function calculateFinancialLeverageValue(period: FinancialPeriod, previousPeriod?: FinancialPeriod): MetricResult {
  const averageTotalAssets = calculateAverageTotalAssets(period, previousPeriod);
  const averageEquity = calculateAverageEquity(period, previousPeriod);

  if (!isAvailableMetric(averageTotalAssets)) {
    return averageTotalAssets;
  }

  if (!isAvailableMetric(averageEquity)) {
    return averageEquity;
  }

  if (averageEquity.value < 0) {
    return unavailableMetric("non-meaningful-denominator", "average equity");
  }

  return safeDivide(averageTotalAssets.value, averageEquity.value, {
    denominatorName: "average equity",
    negativeDenominator: "non-meaningful",
  });
}

export function calculateDerivedFinancialValues(
  period: FinancialPeriod,
  previousPeriod?: FinancialPeriod
): DerivedFinancialValues {
  return {
    grossProfit: calculateGrossProfitValue(period),
    quickAssets: calculateQuickAssets(period),
    workingCapital: calculateWorkingCapital(period),
    capitalEmployed: calculateCapitalEmployed(period),
    freeCashFlow: calculateFreeCashFlowValue(period),
    financialLeverage: calculateFinancialLeverageValue(period, previousPeriod),
  };
}
