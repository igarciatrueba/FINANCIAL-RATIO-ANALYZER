import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ExecutiveDashboard } from "@/features/executive-dashboard/components/executive-dashboard";
import { PersistedAnalysisContextBridge } from "@/features/accounts/components/persisted-analysis-context-bridge";
import { buildExecutiveDashboardViewModel } from "@/features/executive-dashboard/lib/build-dashboard-view-model";
import { WorkspacePageState, WorkspaceShell } from "@/features/workspace/components/workspace-shell";
import { loadWorkspaceRoute } from "@/features/workspace/lib/workspace-route-error";
import { loadPersistedAnalysis } from "@/server/accounts/workspace-data";

export const dynamic = "force-dynamic";

export default async function PersistedAnalysisPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const state = await loadWorkspaceRoute(() => loadPersistedAnalysis(runId), `/workspace/analyses/${runId}`);
  if (state.failure) return <WorkspaceShell currentPath="/workspace/history" subtitle="Stored historical result" title="Historical Analysis"><WorkspacePageState {...state.failure} /></WorkspaceShell>;
  if (!state.data.result) return <WorkspaceShell currentPath="/workspace/history" subtitle="Stored historical result" title="Analysis unavailable"><WorkspacePageState description="This analysis did not complete with a persisted result. No partial financial dashboard is shown." title="Historical analysis unavailable" /></WorkspaceShell>;
  return <WorkspaceShell currentPath="/workspace/history" subtitle="Stored result from its immutable dataset version" title="Historical Analysis"><PersistedAnalysisContextBridge context={{ runId, companyId: state.data.run.companyId, datasetVersionId: state.data.run.datasetVersionId }} /><div className="mb-6"><Link className="inline-flex items-center gap-2 text-caption font-semibold text-blue-200 hover:text-white" href="/workspace/history"><ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />Back to analysis history</Link></div><ExecutiveDashboard viewModel={buildExecutiveDashboardViewModel(state.data.result, state.data.input)} /></WorkspaceShell>;
}
