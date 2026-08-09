import type { ScenarioAssumptions } from "@/domain/types";
import type { ScenarioControlId, ScenarioPropagationRule } from "@/domain/scenarios/types";

export const scenarioControlOrder: ScenarioControlId[] = [
  "revenueGrowthPercent",
  "ebitMarginPercent",
  "totalDebtChangePercent",
  "currentAssetsChangePercent",
  "inventoryChangePercent",
  "interestExpenseChangePercent",
];

export const baseScenarioAssumptions: ScenarioAssumptions = {
  revenueGrowthPercent: 0,
  ebitMarginPercent: null,
  totalDebtChangePercent: 0,
  currentAssetsChangePercent: 0,
  inventoryChangePercent: 0,
  interestExpenseChangePercent: 0,
};

export const scenarioPropagationRules: ScenarioPropagationRule[] = [
  {
    controlId: "revenueGrowthPercent",
    sourceField: "periods[latest].incomeStatement.revenue",
    transformation: "Revenue is multiplied by 1 + revenueGrowthPercent / 100.",
    dependentFields: [
      "periods[latest].incomeStatement.costOfGoodsSold",
      "periods[latest].incomeStatement.ebit",
      "periods[latest].incomeStatement.netIncome",
    ],
    balancingAssumption:
      "Cost of Goods Sold and Net Income preserve their Base Case revenue margins. EBIT preserves its Base Case margin unless the EBIT Margin control is active.",
    limitation: "This is a margin-preservation transformation, not a detailed operating-expense or tax model.",
  },
  {
    controlId: "ebitMarginPercent",
    sourceField: "periods[latest].incomeStatement.ebit",
    transformation: "When supplied, EBIT is set to transformed Revenue multiplied by ebitMarginPercent / 100.",
    dependentFields: ["periods[latest].incomeStatement.ebit"],
    balancingAssumption: "No operating-expense line item is invented.",
    limitation: "Net Income is not derived from EBIT because tax and other below-operating detail are not supplied.",
  },
  {
    controlId: "totalDebtChangePercent",
    sourceField: "periods[latest].balanceSheet.totalDebt",
    transformation: "Total Debt is multiplied by 1 + totalDebtChangePercent / 100.",
    dependentFields: ["periods[latest].balanceSheet.totalDebt"],
    balancingAssumption: "Cash, assets and equity are preserved; no financing transaction is inferred.",
    limitation: "The scenario does not validate a full accounting equation or silently change equity.",
  },
  {
    controlId: "currentAssetsChangePercent",
    sourceField: "periods[latest].balanceSheet.currentAssets",
    transformation: "Current Assets are multiplied by 1 + currentAssetsChangePercent / 100.",
    dependentFields: ["periods[latest].balanceSheet.currentAssets"],
    balancingAssumption: "Cash and other current-asset components are not adjusted.",
    limitation: "The scenario is invalid if Current Assets become lower than Inventory or higher than Total Assets.",
  },
  {
    controlId: "inventoryChangePercent",
    sourceField: "periods[latest].balanceSheet.inventory",
    transformation: "Inventory and Average Inventory are multiplied by 1 + inventoryChangePercent / 100.",
    dependentFields: ["periods[latest].balanceSheet.inventory", "periods[latest].workingCapital.averageInventory"],
    balancingAssumption: "Inventory changes do not create an equal cash movement.",
    limitation: "Inventory optimisation is not a complete working-capital cash-flow model.",
  },
  {
    controlId: "interestExpenseChangePercent",
    sourceField: "periods[latest].incomeStatement.interestExpense",
    transformation:
      "Interest Expense is multiplied by 1 + interestExpenseChangePercent / 100; Net Income is adjusted by the inverse interest-expense delta with no tax effect.",
    dependentFields: ["periods[latest].incomeStatement.interestExpense", "periods[latest].incomeStatement.netIncome"],
    balancingAssumption: "Debt is preserved unless the Total Debt control is changed separately.",
    limitation: "No implied interest rate or tax shield is inferred.",
  },
];
