import { describe, expect, it } from "vitest";

import { parseFinancialAnalysisInput } from "@/domain";

const validInput = {
  company: {
    id: "company-001",
    name: "Example Company",
    industry: "Industrial Services",
    currency: "EUR",
  },
  periods: [
    {
      year: 2022,
      incomeStatement: {
        revenue: 1200,
        costOfGoodsSold: 520,
        ebit: 260,
        interestExpense: 24,
        netIncome: 180,
      },
      balanceSheet: {
        cash: 140,
        accountsReceivable: 210,
        inventory: 160,
        currentAssets: 580,
        totalAssets: 1500,
        currentLiabilities: 330,
        totalDebt: 420,
        equity: 760,
      },
      cashFlow: {
        operatingCashFlow: 230,
        capitalExpenditure: 70,
      },
      workingCapital: {
        averageInventory: 150,
        averageReceivables: 200,
        averagePayables: 120,
      },
    },
    {
      year: 2023,
      incomeStatement: {
        revenue: 1320,
        costOfGoodsSold: 570,
        ebit: 290,
        interestExpense: 25,
        netIncome: 202,
      },
      balanceSheet: {
        cash: 170,
        accountsReceivable: 225,
        inventory: 168,
        currentAssets: 640,
        totalAssets: 1620,
        currentLiabilities: 345,
        totalDebt: 410,
        equity: 835,
      },
      cashFlow: {
        operatingCashFlow: 260,
        capitalExpenditure: 82,
      },
      workingCapital: {
        averageInventory: 164,
        averageReceivables: 218,
        averagePayables: 126,
      },
    },
    {
      year: 2024,
      incomeStatement: {
        revenue: 1450,
        costOfGoodsSold: 615,
        ebit: 326,
        interestExpense: 23,
        netIncome: 232,
      },
      balanceSheet: {
        cash: 210,
        accountsReceivable: 248,
        inventory: 175,
        currentAssets: 710,
        totalAssets: 1750,
        currentLiabilities: 360,
        totalDebt: 390,
        equity: 940,
      },
      cashFlow: {
        operatingCashFlow: 306,
        capitalExpenditure: 88,
      },
      workingCapital: {
        averageInventory: 172,
        averageReceivables: 238,
        averagePayables: 132,
      },
    },
  ],
};

function cloneValidInput() {
  return structuredClone(validInput);
}

describe("financial analysis input parser", () => {
  it("accepts the approved lean canonical input model", () => {
    const result = parseFinancialAnalysisInput(cloneValidInput());

    expect(result.success).toBe(true);
    expect(result.validation).toEqual({
      valid: true,
      issues: [],
      blockingIssueCount: 0,
      warningCount: 0,
    });
    expect(result.success && result.data.periods).toHaveLength(3);
  });

  it("rejects analyses with fewer than three annual periods", () => {
    const input = cloneValidInput();
    input.periods = input.periods.slice(0, 2);

    const result = parseFinancialAnalysisInput(input);

    expect(result.success).toBe(false);
    expect(result.validation.valid).toBe(false);
    expect(result.validation.blockingIssueCount).toBeGreaterThan(0);
    expect(result.validation.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "error",
          path: "periods",
        }),
      ])
    );
  });

  it("rejects duplicate reporting years", () => {
    const input = cloneValidInput();
    input.periods[2].year = 2023;

    const result = parseFinancialAnalysisInput(input);

    expect(result.success).toBe(false);
    expect(result.validation.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "period-years-unique",
          severity: "error",
          path: "periods",
        }),
      ])
    );
  });

  it("rejects reporting years that are not chronological", () => {
    const input = cloneValidInput();
    input.periods[1].year = 2024;
    input.periods[2].year = 2023;

    const result = parseFinancialAnalysisInput(input);

    expect(result.success).toBe(false);
    expect(result.validation.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "period-years-chronological",
          severity: "error",
          path: "periods",
        }),
      ])
    );
  });

  it("rejects unsupported currency codes", () => {
    const input = cloneValidInput();
    input.company.currency = "JPY";

    const result = parseFinancialAnalysisInput(input);

    expect(result.success).toBe(false);
    expect(result.validation.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "error",
          path: "company.currency",
        }),
      ])
    );
  });

  it("rejects non-finite numeric values", () => {
    const input = cloneValidInput();
    input.periods[0].incomeStatement.revenue = Number.POSITIVE_INFINITY;

    const result = parseFinancialAnalysisInput(input);

    expect(result.success).toBe(false);
    expect(result.validation.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "error",
          path: "periods.0.incomeStatement.revenue",
        }),
      ])
    );
  });

  it("does not silently convert invalid numeric input into zero", () => {
    const input = cloneValidInput();
    input.periods[0].incomeStatement.revenue = "" as unknown as number;

    const result = parseFinancialAnalysisInput(input);

    expect(result.success).toBe(false);
    expect(result.validation.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "error",
          path: "periods.0.incomeStatement.revenue",
        }),
      ])
    );
  });

  it("requires company identity fields", () => {
    const input = cloneValidInput();
    input.company.name = "";
    input.company.industry = "";

    const result = parseFinancialAnalysisInput(input);

    expect(result.success).toBe(false);
    expect(result.validation.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "error",
          path: "company.name",
        }),
        expect.objectContaining({
          severity: "error",
          path: "company.industry",
        }),
      ])
    );
  });
});
