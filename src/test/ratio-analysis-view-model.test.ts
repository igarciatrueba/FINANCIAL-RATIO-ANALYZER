import { describe, expect, it } from "vitest";
import { analyseFinancialStatements } from "@/domain";
import { cloneDemoCompany } from "@/features/financial-input/demo-companies";
import { buildRatioAnalysisViewModel } from "@/features/ratio-analysis/lib/build-ratio-analysis-view-model";

describe("Ratio Analysis view model", () => {
  it("uses the registered ratio catalogue and excludes absolute derived values from trends", () => {
    const model = buildRatioAnalysisViewModel(analyseFinancialStatements(cloneDemoCompany("novatech-solutions")));
    const selectable = Object.values(model.trend.metricsById).map((metric) => metric.label);
    expect(model.categories.map((category) => category.label)).toEqual(["Profitability", "Liquidity", "Solvency", "Efficiency", "Cash Flow"]);
    expect(model.configured).toBeGreaterThan(0);
    expect(selectable).not.toContain("Gross Profit");
    expect(selectable).not.toContain("Free Cash Flow");
    expect(selectable).toContain("Free Cash Flow Margin");
    expect(model.financialDirection("debt-to-equity", "Decreased")).toBe("Favourable movement");
  });

  it("keeps unavailable results distinct from zero", () => {
    const input = cloneDemoCompany("novatech-solutions");
    input.periods[2].incomeStatement.revenue = 0;
    const model = buildRatioAnalysisViewModel(analyseFinancialStatements(input));
    const ebitMargin = model.table.groups.flatMap((group) => group.rows).find((row) => row.label === "EBIT Margin");
    expect(ebitMargin?.currentValue.display).toBe("Unavailable");
  });
});
