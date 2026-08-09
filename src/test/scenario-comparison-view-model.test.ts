import { describe, expect, it } from "vitest";

import { analyseFinancialStatements } from "@/domain";
import { applyScenario, baseScenarioAssumptions, scenarioPresetList, scenarioPresets } from "@/domain/scenarios";
import { cloneDemoCompany } from "@/features/financial-input/demo-companies";
import {
  buildScenarioComparisonViewModel,
  runScenarioPipeline,
} from "@/features/scenario-lab/lib/build-scenario-comparison-view-model";
import { buildScenarioDimensionComparisonOption } from "@/features/scenario-lab/charts/scenario-chart-options";

describe("Phase 8 scenario presets and comparison view model", () => {
  it("defines the five approved presets on the standard ScenarioAssumptions contract", () => {
    expect(scenarioPresetList.map((preset) => preset.name)).toEqual([
      "High Growth",
      "Economic Slowdown",
      "Debt Reduction",
      "Inventory Optimisation",
      "Higher Interest Rates",
    ]);

    for (const preset of scenarioPresetList) {
      expect(Object.keys(preset.assumptions).sort()).toEqual(Object.keys(baseScenarioAssumptions).sort());
      expect(applyScenario(cloneDemoCompany("novatech-solutions"), preset.assumptions).status).toBe("success");
    }

    expect(scenarioPresets.highGrowth.description).toContain("Revenue growth: +15%");
    expect(scenarioPresets.highGrowth.description).toContain("EBIT margin target: 28%");
    expect(scenarioPresets.highGrowth.description).toMatch(/operating sensitivity/i);
  });

  it("makes preset output equal to equivalent manual assumptions", () => {
    const base = cloneDemoCompany("atlas-manufacturing-group");

    expect(applyScenario(base, scenarioPresets.debtReduction.assumptions)).toEqual(
      applyScenario(base, {
        revenueGrowthPercent: 0,
        ebitMarginPercent: null,
        totalDebtChangePercent: -20,
        currentAssetsChangePercent: 0,
        inventoryChangePercent: 0,
        interestExpenseChangePercent: 0,
      })
    );
  });

  it("preserves the approved preset scores for both fictional companies", () => {
    const expectedScores = {
      "novatech-solutions": {
        highGrowth: 94.23091199837866,
        economicSlowdown: 83.49751590323714,
        debtReduction: 93.65057929351761,
        inventoryOptimisation: 93.6337882487415,
        higherInterestRates: 93.65057929351761,
      },
      "atlas-manufacturing-group": {
        highGrowth: 45.627548404596226,
        economicSlowdown: 27.897278123246497,
        debtReduction: 32.66574775138992,
        inventoryOptimisation: 33.33427978216527,
        higherInterestRates: 28.139809830472487,
      },
    } as const;

    for (const [companyId, scores] of Object.entries(expectedScores)) {
      for (const [presetId, expectedScore] of Object.entries(scores)) {
        const scenario = applyScenario(
          cloneDemoCompany(companyId as "novatech-solutions" | "atlas-manufacturing-group"),
          scenarioPresets[presetId as keyof typeof scenarioPresets].assumptions
        );

        expect(scenario.status).toBe("success");
        if (scenario.status === "success") {
          expect(analyseFinancialStatements(scenario.input).score.total).toBeCloseTo(expectedScore, 12);
        }
      }
    }
  });

  it("runs transformation, canonical validation and standard analysis into a scenario comparison view model", () => {
    const baseInput = cloneDemoCompany("novatech-solutions");
    const baseAnalysis = analyseFinancialStatements(baseInput);
    const scenario = runScenarioPipeline(baseInput, scenarioPresets.highGrowth.assumptions);

    expect(scenario.status).toBe("success");
    if (scenario.status !== "success") {
      throw new Error("Expected successful scenario pipeline");
    }

    const viewModel = buildScenarioComparisonViewModel({
      baseInput,
      baseAnalysis,
      scenarioInput: scenario.input,
      scenarioAnalysis: scenario.analysis,
      assumptions: scenarioPresets.highGrowth.assumptions,
      metadata: scenario.metadata,
      selectedPresetId: "highGrowth",
    });

    expect(viewModel.company.name).toBe("NovaTech Solutions");
    expect(viewModel.period.latestYear).toBe(2024);
    expect(viewModel.selectedPresetLabel).toBe("High Growth");
    expect(viewModel.score.base.display).toBe("93.7");
    expect(viewModel.score.scenario.display).not.toBe(viewModel.score.base.display);
    expect(viewModel.score.delta.display).toMatch(/[+-].*pts/);
    expect(viewModel.dimensions).toHaveLength(5);
    expect(viewModel.keyMetrics.map((metric) => metric.label)).toEqual([
      "Financial Health Score",
      "Net Margin",
      "EBIT Margin",
      "Return on Equity",
      "Current Ratio",
      "Debt-to-Equity",
      "Interest Coverage",
      "Free Cash Flow",
      "Cash Conversion Cycle",
    ]);
    expect(viewModel.dupont.factors.map((factor) => factor.label)).toEqual([
      "Net Profit Margin",
      "Asset Turnover",
      "Financial Leverage",
      "Return on Equity",
    ]);
    expect(viewModel.changedFields.length).toBeGreaterThan(0);
    expect(JSON.stringify(viewModel)).not.toContain("ebit-margin");
  });

  it("returns typed invalid states instead of throwing or treating unavailable values as zero", () => {
    const baseInput = cloneDemoCompany("atlas-manufacturing-group");
    const invalid = runScenarioPipeline(baseInput, {
      ...baseScenarioAssumptions,
      currentAssetsChangePercent: -80,
      inventoryChangePercent: 10,
    });

    expect(invalid.status).toBe("transformation-error");
    if (invalid.status !== "transformation-error") {
      throw new Error("Expected transformation error");
    }
    expect(invalid.issues.map((issue) => issue.code)).toContain("inventory-exceeds-current-assets");
  });

  it("reset scenario comparison reproduces the base score, insights and DuPont output", () => {
    const baseInput = cloneDemoCompany("novatech-solutions");
    const baseAnalysis = analyseFinancialStatements(baseInput);
    const reset = runScenarioPipeline(baseInput, baseScenarioAssumptions);

    expect(reset.status).toBe("success");
    if (reset.status !== "success") {
      throw new Error("Expected reset pipeline success");
    }
    expect(reset.input).toEqual(baseInput);
    expect(reset.analysis.score).toEqual(baseAnalysis.score);
    expect(reset.analysis.insights).toEqual(baseAnalysis.insights);
    expect(reset.analysis.currentPeriod.dupont).toEqual(baseAnalysis.currentPeriod.dupont);
  });

  it("builds a Base Case versus Scenario Case dimension chart option from the scenario view model", () => {
    const baseInput = cloneDemoCompany("novatech-solutions");
    const baseAnalysis = analyseFinancialStatements(baseInput);
    const scenario = runScenarioPipeline(baseInput, scenarioPresets.debtReduction.assumptions);

    expect(scenario.status).toBe("success");
    if (scenario.status !== "success") {
      throw new Error("Expected successful scenario pipeline");
    }

    const viewModel = buildScenarioComparisonViewModel({
      baseInput,
      baseAnalysis,
      scenarioInput: scenario.input,
      scenarioAnalysis: scenario.analysis,
      assumptions: scenarioPresets.debtReduction.assumptions,
      metadata: scenario.metadata,
      selectedPresetId: "debtReduction",
    });
    const option = buildScenarioDimensionComparisonOption(viewModel.dimensionChart, true) as {
      animation?: boolean;
      series?: Array<{ name: string; data: Array<number | null> }>;
    };

    expect(option.animation).toBe(false);
    expect(option.series?.map((series) => series.name)).toEqual(["Base Case", "Scenario Case"]);
    expect(option.series?.[0].data).toHaveLength(5);
    expect(option.series?.[1].data).toHaveLength(5);
  });
});
