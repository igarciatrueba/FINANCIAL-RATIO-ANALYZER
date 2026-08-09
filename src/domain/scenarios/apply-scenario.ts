import { parseFinancialAnalysisInput, type FinancialAnalysisInput, type FinancialPeriod, type ScenarioAssumptions } from "@/domain";
import {
  scenarioControlOrder,
  scenarioPropagationRules,
} from "@/domain/scenarios/config";
import type {
  ScenarioChangedField,
  ScenarioControlId,
  ScenarioTransformationResult,
  ScenarioValidationIssue,
} from "@/domain/scenarios/types";

const percentChangeControls: Array<Exclude<ScenarioControlId, "ebitMarginPercent">> = [
  "revenueGrowthPercent",
  "totalDebtChangePercent",
  "currentAssetsChangePercent",
  "inventoryChangePercent",
  "interestExpenseChangePercent",
];

const fieldLabels: Record<string, string> = {
  "incomeStatement.revenue": "Revenue",
  "incomeStatement.costOfGoodsSold": "Cost of Goods Sold",
  "incomeStatement.ebit": "EBIT",
  "incomeStatement.interestExpense": "Interest Expense",
  "incomeStatement.netIncome": "Net Income",
  "balanceSheet.totalDebt": "Total Debt",
  "balanceSheet.currentAssets": "Current Assets",
  "balanceSheet.inventory": "Inventory",
  "workingCapital.averageInventory": "Average Inventory",
};

function issue(code: string, message: string, controlId?: ScenarioControlId, path?: string): ScenarioValidationIssue {
  return { code, controlId, message, path };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const requiredAssumptionControls: ScenarioControlId[] = [
  "revenueGrowthPercent",
  "ebitMarginPercent",
  "totalDebtChangePercent",
  "currentAssetsChangePercent",
  "inventoryChangePercent",
  "interestExpenseChangePercent",
];

function validateAssumptions(candidate: unknown): ScenarioValidationIssue[] {
  const issues: ScenarioValidationIssue[] = [];

  if (!isRecord(candidate)) {
    return [issue("invalid-assumptions", "Scenario assumptions must be a complete object.")];
  }

  for (const controlId of requiredAssumptionControls) {
    if (!(controlId in candidate)) {
      issues.push(issue("missing-assumption", `Scenario assumption ${controlId} is required.`, controlId));
    }
  }

  if (issues.length > 0) {
    return issues;
  }

  for (const controlId of scenarioControlOrder) {
    const value = candidate[controlId];
    if (controlId === "ebitMarginPercent" && value === null) {
      continue;
    }
    if (typeof value !== "number" || !Number.isFinite(value)) {
      issues.push(issue("non-finite-assumption", "Scenario assumptions must be finite numbers.", controlId));
    }
  }

  const assumptions = candidate as unknown as ScenarioAssumptions;
  const ebitMarginPercent = assumptions.ebitMarginPercent;

  if (Number.isFinite(assumptions.revenueGrowthPercent) && assumptions.revenueGrowthPercent <= -100) {
    issues.push(issue("invalid-revenue-growth", "Revenue growth must keep scenario revenue above zero.", "revenueGrowthPercent"));
  }

  for (const controlId of percentChangeControls.filter((control) => control !== "revenueGrowthPercent")) {
    const value = assumptions[controlId];
    if (Number.isFinite(value) && value < -100) {
      issues.push(issue("invalid-percentage-change", "Percentage changes cannot reduce a non-negative field below zero.", controlId));
    }
  }

  if (
    ebitMarginPercent !== null &&
    Number.isFinite(ebitMarginPercent) &&
    (ebitMarginPercent < -100 || ebitMarginPercent > 100)
  ) {
    issues.push(issue("invalid-ebit-margin", "EBIT margin target must be between -100% and 100%.", "ebitMarginPercent"));
  }

  return issues;
}

function percentMultiplier(percent: number) {
  return 1 + percent / 100;
}

function margin(numerator: number, denominator: number) {
  return denominator === 0 ? null : numerator / denominator;
}

function recordChange(
  changes: ScenarioChangedField[],
  periodIndex: number,
  path: string,
  baseValue: number,
  scenarioValue: number,
  controlId: ScenarioControlId
) {
  if (Math.abs(baseValue - scenarioValue) < 1e-9) {
    return;
  }

  const existing = changes.find((change) => change.path === `periods.${periodIndex}.${path}`);
  if (existing) {
    existing.scenarioValue = scenarioValue;
    existing.controlId = controlId;
    return;
  }

  changes.push({
    path: `periods.${periodIndex}.${path}`,
    label: fieldLabels[path] ?? path,
    baseValue,
    scenarioValue,
    controlId,
  });
}

function cloneInput(input: FinancialAnalysisInput): FinancialAnalysisInput {
  return structuredClone(input);
}

function applyRevenueTransformation(
  basePeriod: FinancialPeriod,
  scenarioPeriod: FinancialPeriod,
  assumptions: ScenarioAssumptions,
  changes: ScenarioChangedField[],
  periodIndex: number
) {
  if (Math.abs(assumptions.revenueGrowthPercent) < 1e-12) {
    return;
  }

  const baseRevenue = basePeriod.incomeStatement.revenue;
  const transformedRevenue = baseRevenue * percentMultiplier(assumptions.revenueGrowthPercent);
  const grossCostRatio = margin(basePeriod.incomeStatement.costOfGoodsSold, baseRevenue);
  const ebitMargin = margin(basePeriod.incomeStatement.ebit, baseRevenue);
  const netMargin = margin(basePeriod.incomeStatement.netIncome, baseRevenue);

  scenarioPeriod.incomeStatement.revenue = transformedRevenue;
  if (grossCostRatio !== null) {
    scenarioPeriod.incomeStatement.costOfGoodsSold = transformedRevenue * grossCostRatio;
  }
  if (ebitMargin !== null) {
    scenarioPeriod.incomeStatement.ebit = transformedRevenue * ebitMargin;
  }
  if (netMargin !== null) {
    scenarioPeriod.incomeStatement.netIncome = transformedRevenue * netMargin;
  }

  recordChange(changes, periodIndex, "incomeStatement.revenue", basePeriod.incomeStatement.revenue, scenarioPeriod.incomeStatement.revenue, "revenueGrowthPercent");
  recordChange(
    changes,
    periodIndex,
    "incomeStatement.costOfGoodsSold",
    basePeriod.incomeStatement.costOfGoodsSold,
    scenarioPeriod.incomeStatement.costOfGoodsSold,
    "revenueGrowthPercent"
  );
  recordChange(changes, periodIndex, "incomeStatement.ebit", basePeriod.incomeStatement.ebit, scenarioPeriod.incomeStatement.ebit, "revenueGrowthPercent");
  recordChange(
    changes,
    periodIndex,
    "incomeStatement.netIncome",
    basePeriod.incomeStatement.netIncome,
    scenarioPeriod.incomeStatement.netIncome,
    "revenueGrowthPercent"
  );
}

export function applyScenario(
  baseInput: FinancialAnalysisInput,
  rawAssumptions: ScenarioAssumptions
): ScenarioTransformationResult {
  const assumptionIssues = validateAssumptions(rawAssumptions);
  if (assumptionIssues.length > 0) {
    return { status: "error", issues: assumptionIssues };
  }
  const assumptions = rawAssumptions;

  const input = cloneInput(baseInput);
  const periodIndex = input.periods.length - 1;
  const basePeriod = baseInput.periods[periodIndex];
  const scenarioPeriod = input.periods[periodIndex];
  const changes: ScenarioChangedField[] = [];

  applyRevenueTransformation(basePeriod, scenarioPeriod, assumptions, changes, periodIndex);

  const ebitMarginPercent = assumptions.ebitMarginPercent ?? null;
  if (ebitMarginPercent !== null) {
    const scenarioEbit = scenarioPeriod.incomeStatement.revenue * (ebitMarginPercent / 100);
    scenarioPeriod.incomeStatement.ebit = scenarioEbit;
    recordChange(changes, periodIndex, "incomeStatement.ebit", basePeriod.incomeStatement.ebit, scenarioEbit, "ebitMarginPercent");
  }

  if (Math.abs(assumptions.totalDebtChangePercent) >= 1e-12) {
    scenarioPeriod.balanceSheet.totalDebt = basePeriod.balanceSheet.totalDebt * percentMultiplier(assumptions.totalDebtChangePercent);
    recordChange(
      changes,
      periodIndex,
      "balanceSheet.totalDebt",
      basePeriod.balanceSheet.totalDebt,
      scenarioPeriod.balanceSheet.totalDebt,
      "totalDebtChangePercent"
    );
  }

  if (Math.abs(assumptions.currentAssetsChangePercent) >= 1e-12) {
    scenarioPeriod.balanceSheet.currentAssets =
      basePeriod.balanceSheet.currentAssets * percentMultiplier(assumptions.currentAssetsChangePercent);
    recordChange(
      changes,
      periodIndex,
      "balanceSheet.currentAssets",
      basePeriod.balanceSheet.currentAssets,
      scenarioPeriod.balanceSheet.currentAssets,
      "currentAssetsChangePercent"
    );
  }

  if (Math.abs(assumptions.inventoryChangePercent) >= 1e-12) {
    scenarioPeriod.balanceSheet.inventory = basePeriod.balanceSheet.inventory * percentMultiplier(assumptions.inventoryChangePercent);
    scenarioPeriod.workingCapital.averageInventory =
      basePeriod.workingCapital.averageInventory * percentMultiplier(assumptions.inventoryChangePercent);
    recordChange(
      changes,
      periodIndex,
      "balanceSheet.inventory",
      basePeriod.balanceSheet.inventory,
      scenarioPeriod.balanceSheet.inventory,
      "inventoryChangePercent"
    );
    recordChange(
      changes,
      periodIndex,
      "workingCapital.averageInventory",
      basePeriod.workingCapital.averageInventory,
      scenarioPeriod.workingCapital.averageInventory,
      "inventoryChangePercent"
    );
  }

  if (Math.abs(assumptions.interestExpenseChangePercent) >= 1e-12) {
    const interestExpense = basePeriod.incomeStatement.interestExpense * percentMultiplier(assumptions.interestExpenseChangePercent);
    const interestDelta = interestExpense - basePeriod.incomeStatement.interestExpense;
    scenarioPeriod.incomeStatement.interestExpense = interestExpense;
    scenarioPeriod.incomeStatement.netIncome -= interestDelta;
    recordChange(
      changes,
      periodIndex,
      "incomeStatement.interestExpense",
      basePeriod.incomeStatement.interestExpense,
      scenarioPeriod.incomeStatement.interestExpense,
      "interestExpenseChangePercent"
    );
    recordChange(
      changes,
      periodIndex,
      "incomeStatement.netIncome",
      basePeriod.incomeStatement.netIncome,
      scenarioPeriod.incomeStatement.netIncome,
      "interestExpenseChangePercent"
    );
  }

  const relationshipIssues: ScenarioValidationIssue[] = [];
  if (scenarioPeriod.balanceSheet.inventory > scenarioPeriod.balanceSheet.currentAssets) {
    relationshipIssues.push(
      issue(
        "inventory-exceeds-current-assets",
        "Inventory cannot exceed Current Assets in the Scenario Case.",
        "inventoryChangePercent",
        `periods.${periodIndex}.balanceSheet.inventory`
      )
    );
  }
  if (scenarioPeriod.balanceSheet.currentAssets > scenarioPeriod.balanceSheet.totalAssets) {
    relationshipIssues.push(
      issue(
        "current-assets-exceed-total-assets",
        "Current Assets cannot exceed Total Assets in the Scenario Case.",
        "currentAssetsChangePercent",
        `periods.${periodIndex}.balanceSheet.currentAssets`
      )
    );
  }

  if (relationshipIssues.length > 0) {
    return { status: "error", issues: relationshipIssues };
  }

  const canonical = parseFinancialAnalysisInput(input);
  if (!canonical.success) {
    return {
      status: "error",
      issues: canonical.validation.issues.map((validationIssue) =>
        issue("canonical-validation-error", validationIssue.message, undefined, validationIssue.path)
      ),
    };
  }

  return {
    status: "success",
    input: canonical.data,
    metadata: {
      latestYear: scenarioPeriod.year,
      changedFields: changes,
      propagationRules: scenarioPropagationRules,
    },
  };
}
