import type { ScenarioPreset } from "@/domain/scenarios/types";

export const scenarioPresets = {
  highGrowth: {
    id: "highGrowth",
    name: "High Growth",
    description: "Strong revenue growth combined with operating-margin expansion. Revenue growth: +15%. EBIT margin target: 28%. The EBIT margin target is an operating sensitivity, not a complete income-statement forecast.",
    assumptionDetails: ["Revenue growth: +15%", "EBIT margin target: 28%"],
    assumptions: {
      revenueGrowthPercent: 15,
      ebitMarginPercent: 28,
      totalDebtChangePercent: 0,
      currentAssetsChangePercent: 0,
      inventoryChangePercent: 0,
      interestExpenseChangePercent: 0,
    },
    affectedControls: ["revenueGrowthPercent", "ebitMarginPercent"],
  },
  economicSlowdown: {
    id: "economicSlowdown",
    name: "Economic Slowdown",
    description: "Revenue contraction combined with operating-margin compression. Revenue growth: -10%. EBIT margin target: 5%. The EBIT margin target is an operating sensitivity, not a complete income-statement forecast.",
    assumptionDetails: ["Revenue growth: -10%", "EBIT margin target: 5%"],
    assumptions: {
      revenueGrowthPercent: -10,
      ebitMarginPercent: 5,
      totalDebtChangePercent: 0,
      currentAssetsChangePercent: 0,
      inventoryChangePercent: 0,
      interestExpenseChangePercent: 0,
    },
    affectedControls: ["revenueGrowthPercent", "ebitMarginPercent"],
  },
  debtReduction: {
    id: "debtReduction",
    name: "Debt Reduction",
    description: "Total debt change: -20%. Cash and equity remain unchanged, without inferring a financing transaction or accounting balance.",
    assumptionDetails: ["Total debt change: -20%", "Cash and equity: unchanged"],
    assumptions: {
      revenueGrowthPercent: 0,
      ebitMarginPercent: null,
      totalDebtChangePercent: -20,
      currentAssetsChangePercent: 0,
      inventoryChangePercent: 0,
      interestExpenseChangePercent: 0,
    },
    affectedControls: ["totalDebtChangePercent"],
  },
  inventoryOptimisation: {
    id: "inventoryOptimisation",
    name: "Inventory Optimisation",
    description: "Inventory and Average Inventory change: -15%. Cash remains unchanged; the scenario does not assume cash creation.",
    assumptionDetails: ["Inventory change: -15%", "Average inventory change: -15%", "Cash: unchanged"],
    assumptions: {
      revenueGrowthPercent: 0,
      ebitMarginPercent: null,
      totalDebtChangePercent: 0,
      currentAssetsChangePercent: 0,
      inventoryChangePercent: -15,
      interestExpenseChangePercent: 0,
    },
    affectedControls: ["inventoryChangePercent"],
  },
  higherInterestRates: {
    id: "higherInterestRates",
    name: "Higher Interest Rates",
    description: "Interest expense change: +30%. Net Income is adjusted by the interest delta without tax, while total debt remains unchanged.",
    assumptionDetails: ["Interest expense change: +30%", "Net Income: adjusted by the interest delta without tax", "Total debt: unchanged"],
    assumptions: {
      revenueGrowthPercent: 0,
      ebitMarginPercent: null,
      totalDebtChangePercent: 0,
      currentAssetsChangePercent: 0,
      inventoryChangePercent: 0,
      interestExpenseChangePercent: 30,
    },
    affectedControls: ["interestExpenseChangePercent"],
  },
} as const satisfies Record<string, ScenarioPreset>;

export const scenarioPresetList: ScenarioPreset[] = Object.values(scenarioPresets);
