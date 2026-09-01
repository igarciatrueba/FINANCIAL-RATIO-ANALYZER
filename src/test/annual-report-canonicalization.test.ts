import { describe, expect, it } from "vitest";

import { canonicalizeExtractedFinancialValue } from "@/features/annual-report-ingestion/lib/canonicalize-extracted-value";

describe("annual-report canonicalization", () => {
  it("normalizes source-statement expense and liability signs to canonical magnitudes", () => {
    expect(canonicalizeExtractedFinancialValue("costOfGoodsSold", -80)).toBe(80);
    expect(canonicalizeExtractedFinancialValue("interestExpense", -12)).toBe(12);
    expect(canonicalizeExtractedFinancialValue("currentLiabilities", -45)).toBe(45);
    expect(canonicalizeExtractedFinancialValue("totalDebt", -70)).toBe(70);
    expect(canonicalizeExtractedFinancialValue("capitalExpenditure", -24)).toBe(24);
  });

  it("preserves signs for values whose positive or negative direction is analytical", () => {
    expect(canonicalizeExtractedFinancialValue("revenue", -10)).toBe(-10);
    expect(canonicalizeExtractedFinancialValue("ebit", -5)).toBe(-5);
    expect(canonicalizeExtractedFinancialValue("netIncome", -3)).toBe(-3);
    expect(canonicalizeExtractedFinancialValue("operatingCashFlow", -7)).toBe(-7);
    expect(canonicalizeExtractedFinancialValue("equity", -9)).toBe(-9);
  });
});
