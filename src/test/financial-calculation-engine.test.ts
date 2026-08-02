import { describe, expect, it } from "vitest";

import type { FinancialPeriod, MetricResult } from "@/domain";
import { calculateAverageBalance, safeDivide } from "@/domain/calculations";
import { calculateDuPont } from "@/domain/dupont";
import {
  calculateAssetTurnover,
  calculateCashConversionCycle,
  calculateCashRatio,
  calculateCurrentRatio,
  calculateDaysInventoryOutstanding,
  calculateDaysPayablesOutstanding,
  calculateDaysSalesOutstanding,
  calculateDebtToAssets,
  calculateDebtToEquity,
  calculateEbitMargin,
  calculateEquityRatio,
  calculateFreeCashFlow,
  calculateFreeCashFlowMargin,
  calculateGrossMargin,
  calculateGrossProfit,
  calculateInterestCoverage,
  calculateInventoryTurnover,
  calculateNetMargin,
  calculateOperatingCashFlowMargin,
  calculateOperatingCashFlowRatio,
  calculateOperatingCashFlowToNetIncome,
  calculatePeriodRatios,
  calculateQuickRatio,
  calculateReceivablesTurnover,
  calculateReturnOnAssets,
  calculateReturnOnCapitalEmployed,
  calculateReturnOnEquity,
  formulaRegistry,
} from "@/domain/ratios";

const previousPeriod: FinancialPeriod = {
  year: 2023,
  incomeStatement: {
    revenue: 900,
    costOfGoodsSold: 405,
    ebit: 180,
    interestExpense: 18,
    netIncome: 126,
  },
  balanceSheet: {
    cash: 90,
    accountsReceivable: 110,
    inventory: 100,
    currentAssets: 360,
    totalAssets: 1000,
    currentLiabilities: 180,
    totalDebt: 300,
    equity: 500,
  },
  cashFlow: {
    operatingCashFlow: 160,
    capitalExpenditure: 45,
  },
  workingCapital: {
    averageInventory: 95,
    averageReceivables: 105,
    averagePayables: 70,
  },
};

const currentPeriod: FinancialPeriod = {
  year: 2024,
  incomeStatement: {
    revenue: 1200,
    costOfGoodsSold: 480,
    ebit: 240,
    interestExpense: 24,
    netIncome: 144,
  },
  balanceSheet: {
    cash: 120,
    accountsReceivable: 150,
    inventory: 130,
    currentAssets: 500,
    totalAssets: 1300,
    currentLiabilities: 250,
    totalDebt: 400,
    equity: 650,
  },
  cashFlow: {
    operatingCashFlow: 210,
    capitalExpenditure: 60,
  },
  workingCapital: {
    averageInventory: 120,
    averageReceivables: 140,
    averagePayables: 80,
  },
};

const allFormulaIds = [
  "gross-profit",
  "gross-margin",
  "ebit-margin",
  "net-margin",
  "return-on-assets",
  "return-on-equity",
  "return-on-capital-employed",
  "current-ratio",
  "quick-ratio",
  "cash-ratio",
  "operating-cash-flow-ratio",
  "debt-to-equity",
  "debt-to-assets",
  "equity-ratio",
  "interest-coverage",
  "asset-turnover",
  "inventory-turnover",
  "receivables-turnover",
  "days-sales-outstanding",
  "days-inventory-outstanding",
  "days-payables-outstanding",
  "cash-conversion-cycle",
  "operating-cash-flow-margin",
  "free-cash-flow",
  "free-cash-flow-margin",
  "operating-cash-flow-to-net-income",
] as const satisfies ReadonlyArray<keyof typeof formulaRegistry>;

function expectAvailable(result: MetricResult, expected: number) {
  expect(result.status).toBe("available");
  expect(result.status === "available" ? result.value : null).toBeCloseTo(expected, 12);
  expect(result.status === "available" ? Number.isNaN(result.value) : false).toBe(false);
  expect(result.status === "available" ? Number.isFinite(result.value) : true).toBe(true);
}

function expectUnavailable(result: MetricResult, reason: MetricResult extends infer T ? T extends { reason: infer R } ? R : never : never) {
  expect(result).toEqual(expect.objectContaining({ status: "unavailable", reason }));
}

describe("safe arithmetic", () => {
  it("preserves genuine zero results", () => {
    expectAvailable(safeDivide(0, 12, { denominatorName: "revenue" }), 0);
  });

  it("returns unavailable for zero denominators instead of Infinity", () => {
    expectUnavailable(safeDivide(12, 0, { denominatorName: "revenue" }), "zero-denominator");
  });

  it("lets formulas decide whether negative denominators are meaningful", () => {
    expectAvailable(safeDivide(12, -3, { denominatorName: "net income" }), -4);
    expectUnavailable(
      safeDivide(12, -3, {
        denominatorName: "equity",
        negativeDenominator: "non-meaningful",
      }),
      "non-meaningful-denominator"
    );
  });
});

describe("average balance helpers", () => {
  it("uses previous and current closing balances when history is available", () => {
    expectAvailable(calculateAverageBalance(1000, 1300, "total assets"), 1150);
  });

  it("uses current closing balance for the oldest period fallback", () => {
    expectAvailable(calculateAverageBalance(undefined, 1300, "total assets"), 1300);
  });
});

describe("profitability formulas", () => {
  it("calculates gross profit and profitability margins as decimal values", () => {
    expectAvailable(calculateGrossProfit(currentPeriod), 720);
    expectAvailable(calculateGrossMargin(currentPeriod), 0.6);
    expectAvailable(calculateEbitMargin(currentPeriod), 0.2);
    expectAvailable(calculateNetMargin(currentPeriod), 0.12);
  });

  it("uses average balances for ROA, ROE and ROCE", () => {
    expectAvailable(calculateReturnOnAssets(currentPeriod, previousPeriod), 144 / 1150);
    expectAvailable(calculateReturnOnEquity(currentPeriod, previousPeriod), 144 / 575);
    expectAvailable(calculateReturnOnCapitalEmployed(currentPeriod, previousPeriod), 240 / 935);
  });

  it("keeps ROCE available when current capital employed is negative but average capital employed remains positive", () => {
    const negativeCurrentCapitalPeriod = {
      ...currentPeriod,
      balanceSheet: {
        ...currentPeriod.balanceSheet,
        totalAssets: 200,
        currentLiabilities: 500,
      },
    };

    expectAvailable(calculateReturnOnCapitalEmployed(negativeCurrentCapitalPeriod, previousPeriod), 240 / 260);
  });

  it("uses current closing balance fallback for oldest-period ROA", () => {
    expectAvailable(calculateReturnOnAssets(currentPeriod), 144 / 1300);
  });

  it("preserves negative numerators where financially meaningful", () => {
    const lossPeriod = {
      ...currentPeriod,
      incomeStatement: {
        ...currentPeriod.incomeStatement,
        netIncome: -36,
      },
    };

    expectAvailable(calculateNetMargin(lossPeriod), -0.03);
    expectAvailable(calculateReturnOnAssets(lossPeriod, previousPeriod), -36 / 1150);
  });

  it("rejects non-meaningful negative equity and negative average capital-employed denominators", () => {
    const negativeEquityPeriod = {
      ...currentPeriod,
      balanceSheet: {
        ...currentPeriod.balanceSheet,
        equity: -700,
      },
    };
    const negativeCapitalPeriod = {
      ...currentPeriod,
      balanceSheet: {
        ...currentPeriod.balanceSheet,
        totalAssets: 100,
        currentLiabilities: 1200,
      },
    };

    expectUnavailable(calculateReturnOnEquity(negativeEquityPeriod, previousPeriod), "non-meaningful-denominator");
    expectUnavailable(calculateReturnOnCapitalEmployed(negativeCapitalPeriod, previousPeriod), "non-meaningful-denominator");
  });
});

describe("liquidity formulas", () => {
  it("calculates current, quick, cash and operating cash flow ratios", () => {
    expectAvailable(calculateCurrentRatio(currentPeriod), 2);
    expectAvailable(calculateQuickRatio(currentPeriod), 1.48);
    expectAvailable(calculateCashRatio(currentPeriod), 0.48);
    expectAvailable(calculateOperatingCashFlowRatio(currentPeriod), 0.84);
  });

  it("returns unavailable when current liabilities are zero", () => {
    const zeroLiabilityPeriod = {
      ...currentPeriod,
      balanceSheet: {
        ...currentPeriod.balanceSheet,
        currentLiabilities: 0,
      },
    };

    expectUnavailable(calculateCurrentRatio(zeroLiabilityPeriod), "zero-denominator");
    expectUnavailable(calculateQuickRatio(zeroLiabilityPeriod), "zero-denominator");
    expectUnavailable(calculateCashRatio(zeroLiabilityPeriod), "zero-denominator");
    expectUnavailable(calculateOperatingCashFlowRatio(zeroLiabilityPeriod), "zero-denominator");
  });
});

describe("solvency formulas", () => {
  it("calculates debt-to-equity, debt-to-assets, equity ratio and interest coverage", () => {
    expectAvailable(calculateDebtToEquity(currentPeriod), 400 / 650);
    expectAvailable(calculateDebtToAssets(currentPeriod), 400 / 1300);
    expectAvailable(calculateEquityRatio(currentPeriod), 650 / 1300);
    expectAvailable(calculateInterestCoverage(currentPeriod), 10);
  });

  it("treats zero and negative equity as non-meaningful for debt-to-equity", () => {
    const zeroEquityPeriod = {
      ...currentPeriod,
      balanceSheet: {
        ...currentPeriod.balanceSheet,
        equity: 0,
      },
    };
    const negativeEquityPeriod = {
      ...currentPeriod,
      balanceSheet: {
        ...currentPeriod.balanceSheet,
        equity: -10,
      },
    };

    expectUnavailable(calculateDebtToEquity(zeroEquityPeriod), "zero-denominator");
    expectUnavailable(calculateDebtToEquity(negativeEquityPeriod), "non-meaningful-denominator");
  });

  it("does not create Infinity for zero or negative interest expense", () => {
    const zeroInterestPeriod = {
      ...currentPeriod,
      incomeStatement: {
        ...currentPeriod.incomeStatement,
        interestExpense: 0,
      },
    };
    const negativeInterestPeriod = {
      ...currentPeriod,
      incomeStatement: {
        ...currentPeriod.incomeStatement,
        interestExpense: -5,
      },
    };

    expectUnavailable(calculateInterestCoverage(zeroInterestPeriod), "zero-denominator");
    expectUnavailable(calculateInterestCoverage(negativeInterestPeriod), "non-meaningful-denominator");
  });
});

describe("efficiency formulas", () => {
  it("calculates turnover and days-based working-capital metrics", () => {
    expectAvailable(calculateAssetTurnover(currentPeriod, previousPeriod), 1200 / 1150);
    expectAvailable(calculateInventoryTurnover(currentPeriod), 4);
    expectAvailable(calculateReceivablesTurnover(currentPeriod), 1200 / 140);
    expectAvailable(calculateDaysSalesOutstanding(currentPeriod), (140 / 1200) * 365);
    expectAvailable(calculateDaysInventoryOutstanding(currentPeriod), (120 / 480) * 365);
    expectAvailable(calculateDaysPayablesOutstanding(currentPeriod), (80 / 480) * 365);
  });

  it("reconciles cash conversion cycle from DIO plus DSO minus DPO", () => {
    expectAvailable(calculateCashConversionCycle(currentPeriod), 91.25 + 42.583333333333336 - 60.83333333333333);
  });

  it("returns unavailable when a CCC component is unavailable", () => {
    const zeroRevenuePeriod = {
      ...currentPeriod,
      incomeStatement: {
        ...currentPeriod.incomeStatement,
        revenue: 0,
      },
    };

    expectUnavailable(calculateCashConversionCycle(zeroRevenuePeriod), "zero-denominator");
  });
});

describe("cash-flow formulas", () => {
  it("calculates cash-flow metrics and reconciles free cash flow", () => {
    expectAvailable(calculateOperatingCashFlowMargin(currentPeriod), 0.175);
    expectAvailable(calculateFreeCashFlow(currentPeriod), 150);
    expectAvailable(calculateFreeCashFlowMargin(currentPeriod), 0.125);
    expectAvailable(calculateOperatingCashFlowToNetIncome(currentPeriod), 210 / 144);
  });

  it("allows negative net income for operating cash flow to net income", () => {
    const lossPeriod = {
      ...currentPeriod,
      incomeStatement: {
        ...currentPeriod.incomeStatement,
        netIncome: -42,
      },
    };

    expectAvailable(calculateOperatingCashFlowToNetIncome(lossPeriod), -5);
  });

  it("returns unavailable when net income denominator is zero", () => {
    const zeroIncomePeriod = {
      ...currentPeriod,
      incomeStatement: {
        ...currentPeriod.incomeStatement,
        netIncome: 0,
      },
    };

    expectUnavailable(calculateOperatingCashFlowToNetIncome(zeroIncomePeriod), "zero-denominator");
  });
});

describe("formula registry and period-level calculation", () => {
  it("provides metadata for every approved formula", () => {
    expect(Object.keys(formulaRegistry).sort()).toEqual([...allFormulaIds].sort());
    for (const formulaId of allFormulaIds) {
      expect(formulaRegistry[formulaId]).toEqual(
        expect.objectContaining({
          id: formulaId,
          name: expect.any(String),
          shortName: expect.any(String),
          category: expect.any(String),
          unit: expect.any(String),
          description: expect.any(String),
          formulaLabel: expect.any(String),
          inputs: expect.any(Array),
          interpretation: expect.any(String),
          unavailableConditions: expect.any(Array),
        })
      );
    }
  });

  it("calculates every registered ratio for a period", () => {
    const result = calculatePeriodRatios(currentPeriod, previousPeriod);

    expect(result.year).toBe(2024);
    expect(Object.keys(result.ratios).sort()).toEqual([...allFormulaIds].sort());
    for (const metric of Object.values(result.ratios)) {
      if (metric.status === "available") {
        expect(Number.isNaN(metric.value)).toBe(false);
        expect(Number.isFinite(metric.value)).toBe(true);
      }
    }
  });
});

describe("DuPont calculation", () => {
  it("reconciles ROE with net margin, asset turnover and financial leverage", () => {
    const result = calculateDuPont(currentPeriod, previousPeriod);

    expect(result.reconciliationStatus).toBe("reconciled");

    const roe = result.roe.status === "available" ? result.roe.value : null;
    const netMargin = result.netProfitMargin.status === "available" ? result.netProfitMargin.value : null;
    const assetTurnover = result.assetTurnover.status === "available" ? result.assetTurnover.value : null;
    const leverage = result.financialLeverage.status === "available" ? result.financialLeverage.value : null;

    expect(roe).toBeCloseTo(144 / 575, 12);
    expect(netMargin && assetTurnover && leverage ? netMargin * assetTurnover * leverage : null).toBeCloseTo(
      144 / 575,
      12
    );
  });

  it("marks DuPont unavailable when leverage denominator is non-meaningful", () => {
    const negativeEquityPeriod = {
      ...currentPeriod,
      balanceSheet: {
        ...currentPeriod.balanceSheet,
        equity: -700,
      },
    };

    const result = calculateDuPont(negativeEquityPeriod, previousPeriod);

    expect(result.reconciliationStatus).toBe("unavailable");
    expectUnavailable(result.financialLeverage, "non-meaningful-denominator");
  });
});
