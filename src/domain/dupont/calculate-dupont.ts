import type { DuPontResult, FinancialPeriod } from "@/domain/types";

import { calculateFinancialLeverageValue, isAvailableMetric } from "@/domain/calculations";
import { calculateAssetTurnover, calculateNetMargin, calculateReturnOnEquity } from "@/domain/ratios";

export function calculateDuPont(period: FinancialPeriod, previousPeriod?: FinancialPeriod): DuPontResult {
  const roe = calculateReturnOnEquity(period, previousPeriod);
  const netProfitMargin = calculateNetMargin(period);
  const assetTurnover = calculateAssetTurnover(period, previousPeriod);
  const financialLeverage = calculateFinancialLeverageValue(period, previousPeriod);

  const allComponentsAvailable = [roe, netProfitMargin, assetTurnover, financialLeverage].every(isAvailableMetric);

  if (!allComponentsAvailable) {
    return {
      year: period.year,
      roe,
      netProfitMargin,
      assetTurnover,
      financialLeverage,
      reconciliationStatus: "unavailable",
    };
  }

  const product =
    netProfitMargin.status === "available" &&
    assetTurnover.status === "available" &&
    financialLeverage.status === "available"
      ? netProfitMargin.value * assetTurnover.value * financialLeverage.value
      : null;
  const reconciliationStatus =
    roe.status === "available" && product !== null && Math.abs(roe.value - product) <= 1e-12
      ? "reconciled"
      : "approximate";

  return {
    year: period.year,
    roe,
    netProfitMargin,
    assetTurnover,
    financialLeverage,
    reconciliationStatus,
  };
}
