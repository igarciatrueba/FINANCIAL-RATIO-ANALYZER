"use client";

import { useEffect } from "react";

import { PERSISTED_ANALYSIS_CONTEXT_KEY, type PersistedAnalysisContext } from "@/features/accounts/persisted-analysis-context";

export function PersistedAnalysisContextBridge({ context }: { context: PersistedAnalysisContext }) {
  useEffect(() => {
    window.sessionStorage.setItem(PERSISTED_ANALYSIS_CONTEXT_KEY, JSON.stringify(context));
  }, [context]);
  return null;
}
