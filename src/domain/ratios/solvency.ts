import type { FinancialPeriod, MetricResult } from "@/domain/types";

import { safeDivide } from "@/domain/calculations";

export function calculateDebtToEquity(period: FinancialPeriod): MetricResult {
  return safeDivide(period.balanceSheet.totalDebt, period.balanceSheet.equity, {
    denominatorName: "equity",
    negativeDenominator: "non-meaningful",
  });
}

export function calculateDebtToAssets(period: FinancialPeriod): MetricResult {
  return safeDivide(period.balanceSheet.totalDebt, period.balanceSheet.totalAssets, {
    denominatorName: "total assets",
    negativeDenominator: "non-meaningful",
  });
}

export function calculateEquityRatio(period: FinancialPeriod): MetricResult {
  return safeDivide(period.balanceSheet.equity, period.balanceSheet.totalAssets, {
    denominatorName: "total assets",
    negativeDenominator: "non-meaningful",
  });
}

export function calculateInterestCoverage(period: FinancialPeriod): MetricResult {
  return safeDivide(period.incomeStatement.ebit, period.incomeStatement.interestExpense, {
    denominatorName: "interest expense",
    negativeDenominator: "non-meaningful",
  });
}
