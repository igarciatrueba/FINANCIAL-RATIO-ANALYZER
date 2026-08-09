import type { FinancialAnalysisInput, ScenarioAssumptions } from "@/domain/types";

export type ScenarioControlId =
  | "revenueGrowthPercent"
  | "ebitMarginPercent"
  | "totalDebtChangePercent"
  | "currentAssetsChangePercent"
  | "inventoryChangePercent"
  | "interestExpenseChangePercent";

export type ScenarioValidationIssue = {
  code: string;
  controlId?: ScenarioControlId;
  message: string;
  path?: string;
};

export type ScenarioChangedField = {
  path: string;
  label: string;
  baseValue: number;
  scenarioValue: number;
  controlId: ScenarioControlId;
};

export type ScenarioTransformationMetadata = {
  latestYear: number;
  changedFields: ScenarioChangedField[];
  propagationRules: ScenarioPropagationRule[];
};

export type ScenarioPropagationRule = {
  controlId: ScenarioControlId;
  sourceField: string;
  transformation: string;
  dependentFields: string[];
  balancingAssumption: string;
  limitation: string;
};

export type ScenarioTransformationResult =
  | {
      status: "success";
      input: FinancialAnalysisInput;
      metadata: ScenarioTransformationMetadata;
    }
  | {
      status: "error";
      issues: ScenarioValidationIssue[];
    };

export type ScenarioPresetId =
  | "highGrowth"
  | "economicSlowdown"
  | "debtReduction"
  | "inventoryOptimisation"
  | "higherInterestRates";

export type ScenarioPreset = {
  id: ScenarioPresetId;
  name: string;
  description: string;
  assumptionDetails: string[];
  assumptions: ScenarioAssumptions;
  affectedControls: ScenarioControlId[];
};
