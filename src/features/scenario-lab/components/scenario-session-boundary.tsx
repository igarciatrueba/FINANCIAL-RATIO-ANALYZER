"use client";

import { useEffect, useState } from "react";

import { ACTIVE_ANALYSIS_STORAGE_KEY } from "@/features/financial-input/persistence";
import { ScenarioLab } from "@/features/scenario-lab/components/scenario-lab";
import { ScenarioEmpty, ScenarioError, ScenarioLoading } from "@/features/scenario-lab/components/scenario-state";
import { recoverScenarioSession } from "@/features/scenario-lab/lib/recover-scenario-session";
import type { ScenarioSessionRecoveryResult } from "@/features/scenario-lab/types/scenario.types";

type BoundaryState = { status: "loading" } | ScenarioSessionRecoveryResult;

export function ScenarioSessionBoundary() {
  const [state, setState] = useState<BoundaryState>({ status: "loading" });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const serialized = window.sessionStorage.getItem(ACTIVE_ANALYSIS_STORAGE_KEY);
      setState(recoverScenarioSession(serialized));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  if (state.status === "loading") {
    return <ScenarioLoading />;
  }

  if (state.status === "empty") {
    return <ScenarioEmpty />;
  }

  if (state.status === "corrupt") {
    return <ScenarioError message={state.message} />;
  }

  if (state.status === "invalid") {
    return (
      <ScenarioError
        message={`${state.message} Return to financial input and run validation again.`}
        title="Scenario Lab session failed validation"
      />
    );
  }

  if (state.status === "analysis-error") {
    return <ScenarioError message={state.message} title="Scenario Lab could not be completed" />;
  }

  return <ScenarioLab baseAnalysis={state.baseAnalysis} baseInput={state.baseInput} initialViewModel={state.initialViewModel} />;
}
