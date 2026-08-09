"use client";

import { useEffect, useState } from "react";

import { ACTIVE_ANALYSIS_STORAGE_KEY } from "@/features/financial-input/persistence";
import { DupontAnalysis } from "@/features/dupont-analysis/components/dupont-analysis";
import { DupontEmpty, DupontError, DupontLoading } from "@/features/dupont-analysis/components/dupont-state";
import { recoverDupontAnalysisSession } from "@/features/dupont-analysis/lib/recover-dupont-session";
import type { DupontSessionRecoveryResult } from "@/features/dupont-analysis/types/dupont.types";

type BoundaryState = { status: "loading" } | DupontSessionRecoveryResult;

export function DupontSessionBoundary() {
  const [state, setState] = useState<BoundaryState>({ status: "loading" });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const serialized = window.sessionStorage.getItem(ACTIVE_ANALYSIS_STORAGE_KEY);
      setState(recoverDupontAnalysisSession(serialized));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  if (state.status === "loading") {
    return <DupontLoading />;
  }

  if (state.status === "empty") {
    return <DupontEmpty />;
  }

  if (state.status === "corrupt") {
    return <DupontError message={state.message} />;
  }

  if (state.status === "invalid") {
    return (
      <DupontError
        message={`${state.message} Return to financial input and run validation again.`}
        title="DuPont analysis session failed validation"
      />
    );
  }

  if (state.status === "analysis-error") {
    return <DupontError message={state.message} title="DuPont analysis could not be completed" />;
  }

  return <DupontAnalysis viewModel={state.viewModel} />;
}
