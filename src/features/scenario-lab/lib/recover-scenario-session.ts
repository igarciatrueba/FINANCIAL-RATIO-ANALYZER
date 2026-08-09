import { analyseFinancialStatements, parseFinancialAnalysisInput } from "@/domain";
import { ACTIVE_ANALYSIS_SCHEMA_VERSION } from "@/features/financial-input/persistence";
import {
  buildScenarioComparisonViewModel,
  runScenarioPipeline,
} from "@/features/scenario-lab/lib/build-scenario-comparison-view-model";
import { baseScenarioAssumptions } from "@/domain/scenarios";
import type { ScenarioSessionRecoveryResult } from "@/features/scenario-lab/types/scenario.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function recoverScenarioSession(serialized: string | null): ScenarioSessionRecoveryResult {
  if (!serialized) {
    return { status: "empty" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    return {
      status: "corrupt",
      message: "The Scenario Lab session could not be read.",
    };
  }

  if (!isRecord(parsed) || parsed.schemaVersion !== ACTIVE_ANALYSIS_SCHEMA_VERSION || typeof parsed.savedAt !== "string") {
    return {
      status: "corrupt",
      message: "The active analysis session is not compatible with the Scenario Lab.",
    };
  }

  const canonical = parseFinancialAnalysisInput(parsed.data);
  if (!canonical.success) {
    return {
      status: "invalid",
      message: "The active analysis session failed canonical validation.",
      issues: canonical.validation.issues.map((issue) => issue.message),
    };
  }

  try {
    const baseAnalysis = analyseFinancialStatements(canonical.data);
    const scenario = runScenarioPipeline(canonical.data, baseScenarioAssumptions);

    if (scenario.status !== "success") {
      return {
        status: "analysis-error",
        message: "The Base Case could not be prepared for scenario analysis.",
      };
    }

    return {
      status: "ready",
      baseInput: canonical.data,
      baseAnalysis,
      initialViewModel: buildScenarioComparisonViewModel({
        baseInput: canonical.data,
        baseAnalysis,
        scenarioInput: scenario.input,
        scenarioAnalysis: scenario.analysis,
        assumptions: baseScenarioAssumptions,
        metadata: scenario.metadata,
        selectedPresetId: null,
      }),
    };
  } catch {
    return {
      status: "analysis-error",
      message: "The Base Case could not be analysed safely.",
    };
  }
}
