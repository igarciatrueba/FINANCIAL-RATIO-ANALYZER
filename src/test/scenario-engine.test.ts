import { describe, expect, it } from "vitest";

import { analyseFinancialStatements, parseFinancialAnalysisInput, type ScenarioAssumptions } from "@/domain";
import { applyScenario, baseScenarioAssumptions, scenarioPresets } from "@/domain/scenarios";
import { cloneDemoCompany, demoCompanies } from "@/features/financial-input/demo-companies";

function latest<T>(items: readonly T[]): T {
  return items[items.length - 1];
}

describe("Phase 8 scenario transformation engine", () => {
  it("creates a fresh scenario case without mutating the base input or demo fixtures", () => {
    const base = cloneDemoCompany("novatech-solutions");
    const baseSnapshot = structuredClone(base);
    const demoSnapshot = structuredClone(demoCompanies[0]);

    const result = applyScenario(base, {
      ...baseScenarioAssumptions,
      revenueGrowthPercent: 15,
      totalDebtChangePercent: -20,
    });

    expect(result.status).toBe("success");
    expect(base).toEqual(baseSnapshot);
    expect(demoCompanies[0]).toEqual(demoSnapshot);
    if (result.status !== "success") {
      throw new Error("Expected successful scenario");
    }
    expect(result.input).not.toBe(base);
    expect(result.input.periods[2]).not.toBe(base.periods[2]);
  });

  it("accepts the explicit complete Base Case assumptions contract", () => {
    const result = applyScenario(cloneDemoCompany("novatech-solutions"), baseScenarioAssumptions);

    expect(result.status).toBe("success");
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["an array", []],
    ["a primitive", "15"],
    ["an empty object", {}],
    ["an object without revenue growth", {
      ebitMarginPercent: null,
      totalDebtChangePercent: 0,
      currentAssetsChangePercent: 0,
      inventoryChangePercent: 0,
      interestExpenseChangePercent: 0,
    }],
    ["an object without total debt", {
      revenueGrowthPercent: 0,
      ebitMarginPercent: null,
      currentAssetsChangePercent: 0,
      inventoryChangePercent: 0,
      interestExpenseChangePercent: 0,
    }],
    ["an object without current assets", {
      revenueGrowthPercent: 0,
      ebitMarginPercent: null,
      totalDebtChangePercent: 0,
      inventoryChangePercent: 0,
      interestExpenseChangePercent: 0,
    }],
    ["an object without inventory", {
      revenueGrowthPercent: 0,
      ebitMarginPercent: null,
      totalDebtChangePercent: 0,
      currentAssetsChangePercent: 0,
      interestExpenseChangePercent: 0,
    }],
    ["an object without interest expense", {
      revenueGrowthPercent: 0,
      ebitMarginPercent: null,
      totalDebtChangePercent: 0,
      currentAssetsChangePercent: 0,
      inventoryChangePercent: 0,
    }],
    ["a malformed EBIT margin", { ...baseScenarioAssumptions, ebitMarginPercent: "28" }],
  ])("rejects %s assumptions safely", (_description, rawAssumptions) => {
    const base = cloneDemoCompany("novatech-solutions");

    expect(() => applyScenario(base, rawAssumptions as ScenarioAssumptions)).not.toThrow();
    const result = applyScenario(base, rawAssumptions as ScenarioAssumptions);

    expect(result.status).toBe("error");
  });

  it("transforms only the latest reporting period and preserves earlier periods exactly", () => {
    const base = cloneDemoCompany("novatech-solutions");
    const result = applyScenario(base, {
      ...baseScenarioAssumptions,
      revenueGrowthPercent: 10,
      inventoryChangePercent: -15,
      interestExpenseChangePercent: 30,
    });

    expect(result.status).toBe("success");
    if (result.status !== "success") {
      throw new Error("Expected successful scenario");
    }
    expect(result.input.periods[0]).toEqual(base.periods[0]);
    expect(result.input.periods[1]).toEqual(base.periods[1]);
    expect(result.input.periods[2]).not.toEqual(base.periods[2]);
  });

  it("applies revenue growth before an active EBIT margin target", () => {
    const base = cloneDemoCompany("novatech-solutions");
    const result = applyScenario(base, {
      ...baseScenarioAssumptions,
      revenueGrowthPercent: 10,
      ebitMarginPercent: 30,
    });

    expect(result.status).toBe("success");
    if (result.status !== "success") {
      throw new Error("Expected successful scenario");
    }
    const scenarioPeriod = latest(result.input.periods);
    expect(scenarioPeriod.incomeStatement.revenue).toBeCloseTo(2068, 12);
    expect(scenarioPeriod.incomeStatement.ebit).toBeCloseTo(620.4, 12);
  });

  it("preserves base EBIT, gross and net margins when revenue changes without an EBIT margin override", () => {
    const base = cloneDemoCompany("novatech-solutions");
    const result = applyScenario(base, { ...baseScenarioAssumptions, revenueGrowthPercent: 10 });

    expect(result.status).toBe("success");
    if (result.status !== "success") {
      throw new Error("Expected successful scenario");
    }
    const basePeriod = latest(base.periods);
    const scenarioPeriod = latest(result.input.periods);
    expect(scenarioPeriod.incomeStatement.costOfGoodsSold / scenarioPeriod.incomeStatement.revenue).toBeCloseTo(
      basePeriod.incomeStatement.costOfGoodsSold / basePeriod.incomeStatement.revenue,
      12
    );
    expect(scenarioPeriod.incomeStatement.ebit / scenarioPeriod.incomeStatement.revenue).toBeCloseTo(
      basePeriod.incomeStatement.ebit / basePeriod.incomeStatement.revenue,
      12
    );
    expect(scenarioPeriod.incomeStatement.netIncome / scenarioPeriod.incomeStatement.revenue).toBeCloseTo(
      basePeriod.incomeStatement.netIncome / basePeriod.incomeStatement.revenue,
      12
    );
  });

  it("updates debt, current assets, inventory, average inventory and interest expense through explicit controls", () => {
    const base = cloneDemoCompany("atlas-manufacturing-group");
    const result = applyScenario(base, {
      ...baseScenarioAssumptions,
      totalDebtChangePercent: -20,
      currentAssetsChangePercent: 5,
      inventoryChangePercent: -15,
      interestExpenseChangePercent: 30,
    });

    expect(result.status).toBe("success");
    if (result.status !== "success") {
      throw new Error("Expected successful scenario");
    }
    const basePeriod = latest(base.periods);
    const scenarioPeriod = latest(result.input.periods);
    expect(scenarioPeriod.balanceSheet.totalDebt).toBeCloseTo(basePeriod.balanceSheet.totalDebt * 0.8, 12);
    expect(scenarioPeriod.balanceSheet.currentAssets).toBeCloseTo(basePeriod.balanceSheet.currentAssets * 1.05, 12);
    expect(scenarioPeriod.balanceSheet.inventory).toBeCloseTo(basePeriod.balanceSheet.inventory * 0.85, 12);
    expect(scenarioPeriod.workingCapital.averageInventory).toBeCloseTo(basePeriod.workingCapital.averageInventory * 0.85, 12);
    expect(scenarioPeriod.incomeStatement.interestExpense).toBeCloseTo(basePeriod.incomeStatement.interestExpense * 1.3, 12);
    expect(scenarioPeriod.incomeStatement.netIncome).toBeCloseTo(
      basePeriod.incomeStatement.netIncome - basePeriod.incomeStatement.interestExpense * 0.3,
      12
    );
  });

  it("derives every application from the original base case so manipulation order is irrelevant", () => {
    const base = cloneDemoCompany("novatech-solutions");
    const first: ScenarioAssumptions = {
      revenueGrowthPercent: 8,
      ebitMarginPercent: 28,
      totalDebtChangePercent: -10,
      currentAssetsChangePercent: 3,
      inventoryChangePercent: -12,
      interestExpenseChangePercent: 15,
    };
    const second: ScenarioAssumptions = {
      interestExpenseChangePercent: 15,
      inventoryChangePercent: -12,
      currentAssetsChangePercent: 3,
      totalDebtChangePercent: -10,
      ebitMarginPercent: 28,
      revenueGrowthPercent: 8,
    };

    expect(applyScenario(base, first)).toEqual(applyScenario(base, second));
  });

  it("reset assumptions reproduce the exact base case and base analysis", () => {
    const base = cloneDemoCompany("novatech-solutions");
    const result = applyScenario(base, baseScenarioAssumptions);

    expect(result.status).toBe("success");
    if (result.status !== "success") {
      throw new Error("Expected successful scenario");
    }
    expect(result.input).toEqual(base);
    expect(analyseFinancialStatements(result.input)).toEqual(analyseFinancialStatements(base));
  });

  it("rejects non-finite values and invalid financial relationships without throwing", () => {
    const base = cloneDemoCompany("atlas-manufacturing-group");
    const nonFinite = applyScenario(base, { ...baseScenarioAssumptions, revenueGrowthPercent: Number.POSITIVE_INFINITY });
    const invalidInventory = applyScenario(base, {
      ...baseScenarioAssumptions,
      currentAssetsChangePercent: -70,
      inventoryChangePercent: 20,
    });

    expect(nonFinite.status).toBe("error");
    expect(invalidInventory.status).toBe("error");
    if (invalidInventory.status !== "error") {
      throw new Error("Expected invalid inventory scenario");
    }
    expect(invalidInventory.issues.map((issue) => issue.code)).toContain("inventory-exceeds-current-assets");
  });

  it("keeps scenario output on the canonical validation and standard analysis path", () => {
    const base = cloneDemoCompany("novatech-solutions");
    const result = applyScenario(base, scenarioPresets.highGrowth.assumptions);

    expect(result.status).toBe("success");
    if (result.status !== "success") {
      throw new Error("Expected successful scenario");
    }
    const canonical = parseFinancialAnalysisInput(result.input);
    expect(canonical.success).toBe(true);
    expect(analyseFinancialStatements(result.input).score.total).not.toBe(analyseFinancialStatements(base).score.total);
  });
});
