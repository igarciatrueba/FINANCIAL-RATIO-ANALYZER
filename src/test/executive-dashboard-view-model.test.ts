import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { buildActiveAnalysisSession, serializeActiveAnalysisSession } from "@/features/financial-input/persistence";
import { cloneDemoCompany } from "@/features/financial-input/demo-companies";
import { buildExecutiveDashboardViewModel } from "@/features/executive-dashboard/lib/build-dashboard-view-model";
import { formatFinancialValue } from "@/features/executive-dashboard/lib/format-financial-value";
import { recoverExecutiveDashboardSession } from "@/features/executive-dashboard/lib/recover-analysis-session";
import type { FinancialAnalysisInput, FinancialInsight } from "@/domain";
import { analyseFinancialStatements } from "@/domain";
import { formulaRegistry } from "@/domain/ratios";
import { buildInsightViewModel } from "@/features/executive-dashboard/lib/build-insight-view-model";
import {
  buildDimensionRadarOption,
  buildHealthTrendOption,
  buildProfitabilityWaterfallOption,
  buildRatioTrendOption,
  buildScoreContributionOption,
} from "@/features/executive-dashboard/charts/chart-options";

function serializedDemoSession(id: "novatech-solutions" | "atlas-manufacturing-group") {
  return serializeActiveAnalysisSession(buildActiveAnalysisSession(cloneDemoCompany(id)));
}

describe("Phase 6 Delivery 1 dashboard view model", () => {
  it("declares ECharts as a direct npm dependency", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as { dependencies?: Record<string, string> };
    const lockfile = JSON.parse(readFileSync("package-lock.json", "utf8")) as {
      packages?: Record<string, { version?: string }>;
    };

    expect(packageJson.dependencies?.echarts).toBe("^6.1.0");
    expect(lockfile.packages?.["node_modules/echarts"]?.version).toBe("6.1.0");
  });

  it("recovers a serialized NovaTech session through canonical analysis into a dashboard view model", () => {
    const recovered = recoverExecutiveDashboardSession(serializedDemoSession("novatech-solutions"));

    expect(recovered.status).toBe("ready");
    if (recovered.status !== "ready") {
      throw new Error("Expected ready dashboard session");
    }

    expect(recovered.viewModel.company.name).toBe("NovaTech Solutions");
    expect(recovered.viewModel.period.currentYear).toBe(2024);
    expect(recovered.viewModel.period.comparisonYear).toBe(2023);
    expect(recovered.viewModel.score.total).toBe(93.65057929351761);
    expect(recovered.viewModel.score.displayValue).toBe("93.7");
    expect(recovered.viewModel.score.classification).toBe("Strong");
    expect(recovered.viewModel.coverage.displayValue).toBe("100.0%");
    expect(recovered.viewModel.kpis.map((kpi) => kpi.label)).toEqual([
      "Financial Health Score",
      "Return on Equity",
      "Current Ratio",
      "Debt-to-Equity",
      "Free Cash Flow",
      "Net Margin",
    ]);
    expect(recovered.viewModel.dimensions).toHaveLength(5);
    expect(recovered.viewModel.principalRisks.map((insight) => insight.title)).toContain(
      "Working-capital cycle is deteriorating"
    );
  });

  it("formats currency, percentages, multiples, days, scores and unavailable values centrally", () => {
    expect(formatFinancialValue({ value: 412, unit: "currency", currency: "EUR" }).display).toBe("€412");
    expect(formatFinancialValue({ value: 0.19787234042553192, unit: "percentage" }).display).toBe("19.8%");
    expect(formatFinancialValue({ value: 1.1497584541062802, unit: "multiple" }).display).toBe("1.15x");
    expect(formatFinancialValue({ value: 129.11178845002377, unit: "days" }).display).toBe("129.1 days");
    expect(formatFinancialValue({ value: 93.65057929351761, unit: "score" }).display).toBe("93.7");
    expect(formatFinancialValue({ value: null, unit: "multiple", unavailableReason: "zero-denominator" }).display).toBe(
      "Unavailable"
    );
  });

  it("selects the six approved KPIs and applies metric-specific direction logic", () => {
    const analysis = analyseFinancialStatements(cloneDemoCompany("atlas-manufacturing-group"));
    const viewModel = buildExecutiveDashboardViewModel(analysis);

    const debtToEquity = viewModel.kpis.find((kpi) => kpi.metricId === "debt-to-equity");
    const freeCashFlow = viewModel.kpis.find((kpi) => kpi.metricId === "free-cash-flow");

    expect(debtToEquity?.direction).toBe("unfavourable");
    expect(debtToEquity?.movementDisplay).toBe("+0.21x");
    expect(debtToEquity?.accessibleStatus).toContain("unfavourable");
    expect(freeCashFlow?.currentValue.display).toBe("-€52");
    expect(freeCashFlow?.direction).toBe("unfavourable");
  });

  it("renders unavailable KPI values without converting them to zero", () => {
    const input = cloneDemoCompany("novatech-solutions");
    input.periods[2].balanceSheet.currentLiabilities = 0;
    const viewModel = buildExecutiveDashboardViewModel(analyseFinancialStatements(input));

    const currentRatio = viewModel.kpis.find((kpi) => kpi.metricId === "current-ratio");

    expect(currentRatio?.currentValue.display).toBe("Unavailable");
    expect(currentRatio?.currentValue.accessibleText).toContain("zero-denominator");
    expect(currentRatio?.direction).toBe("unavailable");
  });

  it("builds deterministic diagnosis text from existing analysis outputs", () => {
    const viewModel = buildExecutiveDashboardViewModel(analyseFinancialStatements(cloneDemoCompany("novatech-solutions")));

    expect(viewModel.diagnosis.headline).toBe("Strong financial health with stable score movement");
    expect(viewModel.diagnosis.summary).toContain("NovaTech Solutions is classified as Strong");
    expect(viewModel.diagnosis.strongestArea).toContain("Profitability");
    expect(viewModel.diagnosis.primaryPressure).toContain("Liquidity");
    expect(viewModel.diagnosis.coverageContext).toContain("100.0% analytical coverage");
  });

  it("maps insight evidence to user-facing metric labels instead of raw metric ids", () => {
    const viewModel = buildExecutiveDashboardViewModel(analyseFinancialStatements(cloneDemoCompany("atlas-manufacturing-group")));
    const weakLiquidity = viewModel.principalRisks.find((insight) => insight.title === "Liquidity indicators are weak");

    expect(weakLiquidity?.evidence.map((evidence) => evidence.label)).toEqual(expect.arrayContaining(["Quick Ratio"]));
    expect(weakLiquidity?.evidence.map((evidence) => evidence.label)).not.toContain("quick-ratio");
  });

  it("uses safe user-facing labels when insight evidence references an unknown metric id", () => {
    const insight: FinancialInsight = {
      id: "unknown-metric",
      ruleId: "unknown-metric-rule",
      title: "Unknown metric label test",
      category: "risk",
      severity: "medium",
      explanation: "Fixed deterministic explanation.",
      supportingMetricIds: ["internal-coverage-test-id"],
      affectedYear: 2024,
      trend: "mixed",
      priority: 1,
      evidence: [
        {
          type: "metric",
          metricId: "internal-coverage-test-id",
          year: 2024,
          value: { status: "available", value: 1.25 },
        },
      ],
    };

    const viewModel = buildInsightViewModel(insight, "EUR");

    expect(viewModel.supportingMetricLabels).toEqual(["Unlabelled metric"]);
    expect(viewModel.evidence[0].label).toBe("Unlabelled metric");
    expect(viewModel.evidence[0].label).not.toBe("internal-coverage-test-id");
  });

  it("marks unavailable dimension tracks as unavailable instead of a numeric zero position", () => {
    const input = cloneDemoCompany("novatech-solutions");
    input.periods[2].incomeStatement.revenue = 0;
    input.periods[2].incomeStatement.netIncome = 0;
    input.periods[2].incomeStatement.ebit = 0;
    input.periods[2].balanceSheet.totalAssets = 0;
    input.periods[2].balanceSheet.equity = 0;
    const viewModel = buildExecutiveDashboardViewModel(analyseFinancialStatements(input));

    const unavailableDimension = viewModel.dimensions.find((dimension) => dimension.score === null);

    expect(unavailableDimension).toBeDefined();
    expect(unavailableDimension?.displayScore).toBe("Unavailable");
    expect(unavailableDimension?.relativePosition).toBeNull();
  });

  it("classifies absent, corrupt and invalid active-analysis sessions distinctly", () => {
    expect(recoverExecutiveDashboardSession(null).status).toBe("empty");
    expect(recoverExecutiveDashboardSession("{not json").status).toBe("corrupt");
    expect(recoverExecutiveDashboardSession(JSON.stringify({ schemaVersion: 1, savedAt: "now", data: {} })).status).toBe(
      "invalid"
    );
  });

  it("builds corrected Delivery 2 chart and reporting view models from existing analysis outputs", () => {
    const analysis = analyseFinancialStatements(cloneDemoCompany("novatech-solutions"));
    const viewModel = buildExecutiveDashboardViewModel(analysis, cloneDemoCompany("novatech-solutions"));

    expect(viewModel.dimensionRadar.indicators.map((indicator) => indicator.label)).toEqual([
      "Profitability",
      "Liquidity",
      "Solvency",
      "Efficiency",
      "Cash Flow",
    ]);
    expect(viewModel.dimensionRadar.current.year).toBe(2024);
    expect(viewModel.dimensionRadar.previous?.year).toBe(2023);
    expect(viewModel.healthTrend.points.map((point) => point.year)).toEqual([2022, 2023, 2024]);
    expect(viewModel.healthTrend.summary).toContain("stable");
    expect(viewModel.ratioTrend.categories.map((category) => category.label)).toEqual([
      "Profitability",
      "Liquidity",
      "Solvency",
      "Efficiency",
      "Cash Flow",
    ]);
    expect(viewModel.ratioTrend.defaultCategory).toBe("profitability");
    expect(viewModel.ratioTrend.defaultMetricId).toBe("gross-profit");
    expect(viewModel.ratioTable.groups.flatMap((group) => group.rows)).toHaveLength(Object.keys(formulaRegistry).length);
    expect(viewModel.workingCapital.metrics.map((metric) => metric.metricId)).toEqual([
      "days-sales-outstanding",
      "days-inventory-outstanding",
      "days-payables-outstanding",
      "cash-conversion-cycle",
    ]);
    expect(viewModel.workingCapital.equation).toBe("DSO + DIO - DPO = CCC");
    expect(viewModel.scoreContribution.dimensions.map((dimension) => dimension.label)).toEqual([
      "Profitability",
      "Liquidity",
      "Solvency",
      "Efficiency",
      "Cash Flow",
    ]);
    expect(viewModel.profitabilityWaterfall.status).toBe("partial");
    expect(viewModel.profitabilityWaterfall.reconciliationNote).toContain("Revenue minus Cost of Goods Sold");
    expect(viewModel.executiveSummary.overallCondition).toContain("Strong");
  });

  it("keeps detailed ratio table unavailable values explicit and non-zero", () => {
    const input = cloneDemoCompany("novatech-solutions");
    input.periods[2].balanceSheet.currentLiabilities = 0;
    const viewModel = buildExecutiveDashboardViewModel(analyseFinancialStatements(input), input);

    const currentRatio = viewModel.ratioTable.groups.flatMap((group) => group.rows).find((row) => row.label === "Current Ratio");

    expect(currentRatio?.currentValue.display).toBe("Unavailable");
    expect(currentRatio?.availability).toBe("Unavailable");
    expect(currentRatio?.unavailableReason).toBe("zero-denominator");
    expect(currentRatio?.currentValue.display).not.toBe("0.00x");
  });

  it("removes unsupported insight confidence from the dashboard insight view model", () => {
    const viewModel = buildExecutiveDashboardViewModel(analyseFinancialStatements(cloneDemoCompany("atlas-manufacturing-group")));
    const risk = viewModel.principalRisks[0] as Record<string, unknown>;

    expect(risk.confidence).toBeUndefined();
    expect(risk.priority).toBeGreaterThan(0);
  });

  it("builds profitability waterfall full, partial and unavailable states without invented line items", () => {
    const input = cloneDemoCompany("novatech-solutions");
    const partial = buildExecutiveDashboardViewModel(analyseFinancialStatements(input), input).profitabilityWaterfall;
    const unavailable = buildExecutiveDashboardViewModel(analyseFinancialStatements(input)).profitabilityWaterfall;
    const fullInput = cloneDemoCompany("novatech-solutions") as FinancialAnalysisInput & {
      periods: [
        FinancialAnalysisInput["periods"][0],
        FinancialAnalysisInput["periods"][1],
        FinancialAnalysisInput["periods"][2] & {
          incomeStatement: FinancialAnalysisInput["periods"][2]["incomeStatement"] & { operatingExpenses: number; taxExpense: number };
        },
      ];
    };
    fullInput.periods[2].incomeStatement.operatingExpenses = 911;
    fullInput.periods[2].incomeStatement.taxExpense = 93;
    const full = buildExecutiveDashboardViewModel(analyseFinancialStatements(fullInput), fullInput).profitabilityWaterfall;

    expect(partial.status).toBe("partial");
    expect(partial.steps.map((step) => step.label)).toContain("Unspecified operating bridge");
    expect(partial.steps.map((step) => step.label)).not.toContain("Taxes");
    expect(unavailable.status).toBe("unavailable");
    expect(full.status).toBe("full");
    expect(full.steps.map((step) => step.label)).toEqual(expect.arrayContaining(["Operating expenses", "Interest expense", "Taxes"]));
  });

  it("builds chart options from view models with reduced-motion and unavailable values preserved", () => {
    const input = cloneDemoCompany("novatech-solutions");
    input.periods[2].incomeStatement.revenue = 0;
    input.periods[2].incomeStatement.netIncome = 0;
    input.periods[2].incomeStatement.ebit = 0;
    const viewModel = buildExecutiveDashboardViewModel(analyseFinancialStatements(input), input);

    expect(buildDimensionRadarOption(viewModel.dimensionRadar, true).animation).toBe(false);
    expect(JSON.stringify(buildDimensionRadarOption(viewModel.dimensionRadar, true))).toContain("null");
    expect(buildHealthTrendOption(viewModel.healthTrend, true).animation).toBe(false);
    expect(buildRatioTrendOption(viewModel.ratioTrend.metricsById["current-ratio"], true).animation).toBe(false);
    expect(buildProfitabilityWaterfallOption(viewModel.profitabilityWaterfall, true).animation).toBe(false);
    expect(buildScoreContributionOption(viewModel.scoreContribution, true).animation).toBe(false);
  });
});
