import { analyseFinancialStatements, parseFinancialAnalysisInput } from "@/domain";
import { ACTIVE_ANALYSIS_SCHEMA_VERSION } from "@/features/financial-input/persistence";
import { buildDupontAnalysisViewModel } from "@/features/dupont-analysis/lib/build-dupont-view-model";
import type { DupontSessionRecoveryResult } from "@/features/dupont-analysis/types/dupont.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function recoverDupontAnalysisSession(serialized: string | null): DupontSessionRecoveryResult {
  if (!serialized) {
    return { status: "empty" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    return {
      status: "corrupt",
      message: "The DuPont analysis session could not be read.",
    };
  }

  if (!isRecord(parsed) || parsed.schemaVersion !== ACTIVE_ANALYSIS_SCHEMA_VERSION || typeof parsed.savedAt !== "string") {
    return {
      status: "corrupt",
      message: "The DuPont analysis session is not compatible with this route.",
    };
  }

  const canonical = parseFinancialAnalysisInput(parsed.data);
  if (!canonical.success) {
    return {
      status: "invalid",
      message: "The DuPont analysis session failed canonical validation.",
      issues: canonical.validation.issues.map((issue) => issue.message),
    };
  }

  try {
    const analysis = analyseFinancialStatements(canonical.data);
    return {
      status: "ready",
      viewModel: buildDupontAnalysisViewModel(canonical.data, analysis),
    };
  } catch {
    return {
      status: "analysis-error",
      message: "The accepted financial statements could not be analysed safely for DuPont.",
    };
  }
}
