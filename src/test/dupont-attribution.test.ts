import { describe, expect, it } from "vitest";

import { calculateDupontDriverAttribution } from "@/domain/dupont";
import type { DuPontResult, MetricResult } from "@/domain";

function available(value: number): MetricResult {
  return { status: "available", value };
}

function dupont(year: number, margin: number, turnover: number, leverage: number): DuPontResult {
  return {
    year,
    roe: available(margin * turnover * leverage),
    netProfitMargin: available(margin),
    assetTurnover: available(turnover),
    financialLeverage: available(leverage),
    reconciliationStatus: "reconciled",
  };
}

describe("Phase 7 DuPont Shapley attribution", () => {
  it("reconciles simultaneous factor changes exactly to total ROE change", () => {
    const previous = dupont(2023, 0.1, 1.2, 2);
    const current = dupont(2024, 0.12, 1.4, 2.5);

    const result = calculateDupontDriverAttribution(previous, current);

    expect(result.status).toBe("available");
    if (result.status !== "available") {
      throw new Error("Expected available attribution");
    }

    const contributionSum = result.contributions.reduce((sum, contribution) => sum + contribution.value, 0);
    expect(contributionSum).toBeCloseTo(result.totalChange, 12);
    expect(result.totalChange).toBeCloseTo(0.18, 12);
    expect(result.reconciliationDifference).toBeCloseTo(0, 12);
  });

  it("is order independent and assigns all change to a margin-only movement", () => {
    const previous = dupont(2023, 0.08, 1.3, 2.2);
    const current = dupont(2024, 0.12, 1.3, 2.2);

    const result = calculateDupontDriverAttribution(previous, current);

    expect(result.status).toBe("available");
    if (result.status !== "available") {
      throw new Error("Expected available attribution");
    }

    expect(result.contributions.find((item) => item.factorId === "netProfitMargin")?.value).toBeCloseTo(0.1144, 12);
    expect(result.contributions.find((item) => item.factorId === "assetTurnover")?.value).toBeCloseTo(0, 12);
    expect(result.contributions.find((item) => item.factorId === "financialLeverage")?.value).toBeCloseTo(0, 12);
    expect(result.primaryDriver?.factorId).toBe("netProfitMargin");
  });

  it("assigns all change to a turnover-only movement", () => {
    const result = calculateDupontDriverAttribution(dupont(2023, 0.09, 1, 2), dupont(2024, 0.09, 1.4, 2));

    expect(result.status).toBe("available");
    if (result.status !== "available") {
      throw new Error("Expected available attribution");
    }

    expect(result.contributions.find((item) => item.factorId === "assetTurnover")?.value).toBeCloseTo(0.072, 12);
    expect(result.primaryDriver?.factorId).toBe("assetTurnover");
  });

  it("assigns all change to a leverage-only movement", () => {
    const result = calculateDupontDriverAttribution(dupont(2023, 0.09, 1.1, 1.8), dupont(2024, 0.09, 1.1, 2.4));

    expect(result.status).toBe("available");
    if (result.status !== "available") {
      throw new Error("Expected available attribution");
    }

    expect(result.contributions.find((item) => item.factorId === "financialLeverage")?.value).toBeCloseTo(0.0594, 12);
    expect(result.primaryDriver?.factorId).toBe("financialLeverage");
  });

  it("supports negative factor cases where the identity is mathematically valid", () => {
    const result = calculateDupontDriverAttribution(dupont(2023, -0.02, 1.1, 2), dupont(2024, 0.03, 1, 2.1));

    expect(result.status).toBe("available");
    if (result.status !== "available") {
      throw new Error("Expected available attribution");
    }

    expect(result.totalChange).toBeCloseTo(0.107, 12);
    expect(result.contributions.reduce((sum, item) => sum + item.value, 0)).toBeCloseTo(result.totalChange, 12);
  });

  it("returns unavailable instead of assigning a hidden residual when inputs are unavailable", () => {
    const previous = dupont(2023, 0.1, 1.2, 2);
    const current: DuPontResult = {
      ...dupont(2024, 0.12, 1.4, 2.5),
      financialLeverage: { status: "unavailable", reason: "zero-denominator", affectedDenominator: "average equity" },
    };

    const result = calculateDupontDriverAttribution(previous, current);

    expect(result.status).toBe("unavailable");
    if (result.status !== "unavailable") {
      throw new Error("Expected unavailable attribution");
    }
    expect(result.reason).toContain("Financial Leverage");
  });

  it("returns a failed reconciliation state without assigning a hidden residual when ROE and factor movement disagree", () => {
    const previous = dupont(2023, 0.1, 1.2, 2);
    const current = {
      ...dupont(2024, 0.12, 1.4, 2.5),
      roe: available(0.5),
    };

    const result = calculateDupontDriverAttribution(previous, current);

    expect(result.status).toBe("failed");
    if (result.status !== "failed") {
      throw new Error("Expected failed attribution reconciliation");
    }
    expect(result.contributions.reduce((sum, item) => sum + item.value, 0)).toBeCloseTo(0.18, 12);
    expect(result.totalChange).toBeCloseTo(0.26, 12);
    expect(result.reconciliationDifference).toBeCloseTo(-0.08, 12);
    expect(result.reason).toContain("did not reconcile");
  });
});
