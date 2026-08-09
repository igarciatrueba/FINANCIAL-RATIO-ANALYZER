import { describe, expect, it } from "vitest";

import { analyseFinancialStatements } from "@/domain";
import type { FinancialAnalysisResult } from "@/domain";
import { cloneDemoCompany } from "@/features/financial-input/demo-companies";
import { buildDupontAnalysisViewModel } from "@/features/dupont-analysis/lib/build-dupont-view-model";
import { buildDupontAttributionOption, buildDupontFactorTrendOption } from "@/features/dupont-analysis/charts/dupont-chart-options";

describe("Phase 7 DuPont analysis view model", () => {
  it("builds NovaTech context, identity, trends and attribution from existing analysis outputs", () => {
    const input = cloneDemoCompany("novatech-solutions");
    const viewModel = buildDupontAnalysisViewModel(input, analyseFinancialStatements(input));

    expect(viewModel.company.name).toBe("NovaTech Solutions");
    expect(viewModel.period.currentYear).toBe(2024);
    expect(viewModel.period.comparisonYear).toBe(2023);
    expect(viewModel.overview.currentRoe.display).toBe("33.2%");
    expect(viewModel.overview.reconciliationStatus).toBe("Reconciled");
    expect(viewModel.identity.factors.map((factor) => factor.label)).toEqual([
      "Net Profit Margin",
      "Asset Turnover",
      "Financial Leverage",
    ]);
    expect(viewModel.identity.factors.map((factor) => factor.unit)).toEqual(["Percentage", "Multiple", "Multiple"]);
    expect(viewModel.trends.series).toHaveLength(4);
    expect(viewModel.trends.years).toEqual([2022, 2023, 2024]);
    expect(viewModel.attribution.status).toBe("available");
    if (viewModel.attribution.status !== "available") {
      throw new Error("Expected available attribution");
    }
    expect(viewModel.attribution.contributions[0].value.display).toBe("+2.46 pp");
    expect(viewModel.attribution.contributions[2].value.display).toBe("-1.28 pp");
    expect(viewModel.attribution.totalChange.display).toBe("+2.89 pp");
    expect(viewModel.attribution.contributions.map((contribution) => contribution.value.display).join(" ")).not.toContain("%");
    expect(viewModel.attribution.reconciliation.statusLabel).toBe("Reconciled");
    expect(viewModel.attribution.reconciliation.totalAttributedChange.display).toBe("+2.89 pp");
    expect(viewModel.attribution.reconciliation.actualRoeChange.display).toBe("+2.89 pp");
    expect(viewModel.attribution.reconciliation.difference.display).toBe("0.00 pp");
    expect(viewModel.explanation.text).toContain("ROE");
    expect(viewModel.methodology.identity).toContain("ROE = Net Profit Margin");
    expect(viewModel.trends.indexDisclosure.title).toBe("Indexed trend");
    expect(viewModel.trends.indexDisclosure.summary).toBe("Base: first available year = 100");
    expect(viewModel.trends.indexDisclosure.detail).toBe("Base year: 2022 = 100");
  });

  it("builds Atlas with a deterministic primary driver and leverage context", () => {
    const input = cloneDemoCompany("atlas-manufacturing-group");
    const viewModel = buildDupontAnalysisViewModel(input, analyseFinancialStatements(input));

    expect(viewModel.company.name).toBe("Atlas Manufacturing Group");
    expect(viewModel.overview.currentRoe.display).toBe("2.9%");
    expect(viewModel.attribution.status).toBe("available");
    expect(viewModel.attribution.primaryDriver?.label).toBe("Net Profit Margin");
    expect(viewModel.explanation.text).toContain("weaker net profit margin");
    expect(viewModel.leverageContext).toContain("financial dependence");
  });

  it("keeps unavailable ROE and factor values explicit instead of rendering zero", () => {
    const input = cloneDemoCompany("novatech-solutions");
    input.periods[1].balanceSheet.equity = 0;
    input.periods[2].balanceSheet.equity = 0;
    const viewModel = buildDupontAnalysisViewModel(input, analyseFinancialStatements(input));

    expect(viewModel.overview.currentRoe.display).toBe("Unavailable");
    expect(viewModel.overview.reconciliationStatus).toBe("Unavailable");
    expect(viewModel.identity.result.display).toBe("Unavailable");
    expect(viewModel.attribution.status).toBe("unavailable");
    expect(viewModel.attribution.reconciliation.statusLabel).toBe("Unavailable");
  });

  it("builds contribution and trend chart options from view models without raw metric ids", () => {
    const input = cloneDemoCompany("novatech-solutions");
    const viewModel = buildDupontAnalysisViewModel(input, analyseFinancialStatements(input));
    const attributionOption = buildDupontAttributionOption(viewModel.attribution);
    const trendOption = buildDupontFactorTrendOption(viewModel.trends);

    expect(JSON.stringify(attributionOption)).not.toContain("netProfitMargin");
    expect(JSON.stringify(trendOption)).not.toContain("assetTurnover");
    expect(viewModel.attribution.status).toBe("available");
    if (viewModel.attribution.status !== "available") {
      throw new Error("Expected available attribution");
    }
    expect(viewModel.attribution.contributions.reduce((sum, contribution) => sum + contribution.rawValue, 0)).toBeCloseTo(
      viewModel.attribution.totalChangeRaw,
      12
    );
    expect(JSON.stringify(attributionOption)).toContain("+2.46 pp");
    expect(JSON.stringify(attributionOption)).not.toContain("+2.5%");
  });

  it("formats zero attribution contributions as percentage points without percent signs", () => {
    const input = cloneDemoCompany("novatech-solutions");
    const analysis = analyseFinancialStatements(input);
    const adjustedAnalysis: FinancialAnalysisResult = {
      ...analysis,
      currentPeriod: {
        ...analysis.currentPeriod,
        dupont: analysis.previousPeriod?.dupont ?? analysis.currentPeriod.dupont,
      },
    };
    const viewModel = buildDupontAnalysisViewModel(input, adjustedAnalysis);

    expect(viewModel.attribution.status).toBe("available");
    if (viewModel.attribution.status !== "available") {
      throw new Error("Expected available attribution");
    }
    expect(viewModel.attribution.contributions.map((contribution) => contribution.value.display)).toEqual([
      "0.00 pp",
      "0.00 pp",
      "0.00 pp",
    ]);
    expect(viewModel.attribution.totalChange.display).toBe("0.00 pp");
  });

  it("surfaces outside-tolerance attribution failure separately from identity reconciliation", () => {
    const input = cloneDemoCompany("novatech-solutions");
    const analysis = analyseFinancialStatements(input);
    const adjustedAnalysis: FinancialAnalysisResult = {
      ...analysis,
      currentPeriod: {
        ...analysis.currentPeriod,
        dupont: {
          ...analysis.currentPeriod.dupont,
          roe: { status: "available", value: 0.5 },
        },
      },
    };
    const viewModel = buildDupontAnalysisViewModel(input, adjustedAnalysis);

    expect(viewModel.overview.reconciliationStatus).toBe("Reconciled");
    expect(viewModel.attribution.status).toBe("failed");
    expect(viewModel.attribution.reconciliation.statusLabel).toBe("Failed");
    expect(viewModel.attribution.reconciliation.difference.display).toMatch(/pp$/);
    expect(viewModel.attribution.summary).toContain("did not reconcile");
  });

  it("discloses later and independent trend index bases while preserving unavailable zero-base points", () => {
    const input = cloneDemoCompany("novatech-solutions");
    input.periods[0].incomeStatement.revenue = 0;
    const analysis = analyseFinancialStatements(input);
    const viewModel = buildDupontAnalysisViewModel(input, analysis);
    const roeTrend = viewModel.trends.series.find((series) => series.label === "Return on Equity");
    const marginTrend = viewModel.trends.series.find((series) => series.label === "Net Profit Margin");

    expect(viewModel.trends.indexDisclosure.summary).toBe("Base: first available year = 100");
    expect(viewModel.trends.indexDisclosure.detail).toContain("Each series is indexed independently");
    expect(viewModel.trends.indexDisclosure.detail).toContain("first available non-zero value");
    expect(roeTrend?.baseYear).toBe(2022);
    expect(marginTrend?.baseYear).toBe(2023);
    expect(marginTrend?.indexedPoints[0].indexedValue).toBeNull();
  });
});
