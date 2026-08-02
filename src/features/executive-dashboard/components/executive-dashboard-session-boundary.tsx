"use client";

import { useEffect, useState } from "react";

import { ACTIVE_ANALYSIS_STORAGE_KEY } from "@/features/financial-input/persistence";
import { DashboardEmpty, DashboardError, DashboardLoading } from "@/features/executive-dashboard/components/dashboard-state";
import { ExecutiveDashboard } from "@/features/executive-dashboard/components/executive-dashboard";
import { recoverExecutiveDashboardSession } from "@/features/executive-dashboard/lib/recover-analysis-session";
import type { DashboardSessionRecoveryResult } from "@/features/executive-dashboard/types/dashboard.types";

type BoundaryState = { status: "loading" } | DashboardSessionRecoveryResult;

export function ExecutiveDashboardSessionBoundary() {
  const [state, setState] = useState<BoundaryState>({ status: "loading" });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const serialized = window.sessionStorage.getItem(ACTIVE_ANALYSIS_STORAGE_KEY);
      setState(recoverExecutiveDashboardSession(serialized));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  if (state.status === "loading") {
    return <DashboardLoading />;
  }

  if (state.status === "empty") {
    return <DashboardEmpty />;
  }

  if (state.status === "corrupt") {
    return <DashboardError message={state.message} />;
  }

  if (state.status === "invalid") {
    return (
      <DashboardError
        message={`${state.message} Return to financial input and run validation again.`}
        title="Analysis session failed validation"
      />
    );
  }

  if (state.status === "analysis-error") {
    return <DashboardError message={state.message} title="Analysis could not be completed" />;
  }

  return <ExecutiveDashboard viewModel={state.viewModel} />;
}
