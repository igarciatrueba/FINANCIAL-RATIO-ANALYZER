import { parseFinancialAnalysisInput, type FinancialAnalysisInput } from "@/domain";
import { workflowSteps } from "@/features/financial-input/field-metadata";
import type { FinancialInputFormValues, WorkflowStepId } from "@/features/financial-input/types";

export const INPUT_DRAFT_STORAGE_KEY = "financial-ratio-analyzer:input-draft:v1";
export const ACTIVE_ANALYSIS_STORAGE_KEY = "financial-ratio-analyzer:active-analysis:v1";
export const INPUT_DRAFT_SCHEMA_VERSION = 1;
export const ACTIVE_ANALYSIS_SCHEMA_VERSION = 1;

export type InputDraft = {
  schemaVersion: typeof INPUT_DRAFT_SCHEMA_VERSION;
  savedAt: string;
  activeStep: WorkflowStepId;
  values: FinancialInputFormValues;
};

export type ActiveAnalysisSession = {
  schemaVersion: typeof ACTIVE_ANALYSIS_SCHEMA_VERSION;
  savedAt: string;
  data: FinancialAnalysisInput;
};

const validSteps = new Set(workflowSteps.map((step) => step.id));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every(isString);
}

function isFormPeriod(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.year) &&
    isStringRecord(value.incomeStatement) &&
    isStringRecord(value.balanceSheet) &&
    isStringRecord(value.cashFlow) &&
    isStringRecord(value.workingCapital)
  );
}

function isFormValues(value: unknown): value is FinancialInputFormValues {
  if (!isRecord(value) || !isRecord(value.company) || !Array.isArray(value.periods) || value.periods.length !== 3) {
    return false;
  }

  return (
    isString(value.company.name) &&
    isString(value.company.industry) &&
    isString(value.company.currency) &&
    value.periods.every(isFormPeriod)
  );
}

export function buildInputDraft(values: FinancialInputFormValues, activeStep: WorkflowStepId): InputDraft {
  return {
    schemaVersion: INPUT_DRAFT_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    activeStep,
    values,
  };
}

export function serializeInputDraft(draft: InputDraft): string {
  return JSON.stringify(draft);
}

export function recoverInputDraft(serialized: string | null): InputDraft | null {
  if (!serialized) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(serialized);

    if (
      !isRecord(parsed) ||
      parsed.schemaVersion !== INPUT_DRAFT_SCHEMA_VERSION ||
      !isString(parsed.savedAt) ||
      !isString(parsed.activeStep) ||
      !validSteps.has(parsed.activeStep as WorkflowStepId) ||
      !isFormValues(parsed.values)
    ) {
      return null;
    }

    return parsed as InputDraft;
  } catch {
    return null;
  }
}

export function buildActiveAnalysisSession(data: FinancialAnalysisInput): ActiveAnalysisSession {
  return {
    schemaVersion: ACTIVE_ANALYSIS_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    data,
  };
}

export function serializeActiveAnalysisSession(session: ActiveAnalysisSession): string {
  return JSON.stringify(session);
}

export function recoverActiveAnalysisSession(serialized: string | null): ActiveAnalysisSession | null {
  if (!serialized) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(serialized);

    if (!isRecord(parsed) || parsed.schemaVersion !== ACTIVE_ANALYSIS_SCHEMA_VERSION || !isString(parsed.savedAt)) {
      return null;
    }

    const domainResult = parseFinancialAnalysisInput(parsed.data);

    if (!domainResult.success) {
      return null;
    }

    return {
      schemaVersion: ACTIVE_ANALYSIS_SCHEMA_VERSION,
      savedAt: parsed.savedAt,
      data: domainResult.data,
    };
  } catch {
    return null;
  }
}
