import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ExecutiveDashboard } from "@/features/executive-dashboard/components/executive-dashboard";
import { buildExecutiveDashboardViewModel } from "@/features/executive-dashboard/lib/build-dashboard-view-model";
import { WorkspacePageState, WorkspaceShell } from "@/features/workspace/components/workspace-shell";
import { loadWorkspaceRoute } from "@/features/workspace/lib/workspace-route-error";
import { loadPersistedScenario } from "@/server/accounts/workspace-data";

export const dynamic = "force-dynamic";

export default async function PersistedScenarioPage({ params }: { params: Promise<{ scenarioId: string }> }) {
  const { scenarioId } = await params;
  const state = await loadWorkspaceRoute(() => loadPersistedScenario(scenarioId), `/workspace/scenarios/${scenarioId}`);
  if (state.failure) return <WorkspaceShell currentPath="/workspace/scenarios" subtitle="Stored scenario result" title="Scenario"><WorkspacePageState {...state.failure} /></WorkspaceShell>;
  if (!state.data.result) return <WorkspaceShell currentPath="/workspace/scenarios" subtitle="Stored scenario result" title={state.data.scenario.name}><WorkspacePageState description="This scenario does not contain a recoverable persisted result." title="Scenario result unavailable" /></WorkspaceShell>;
  return <WorkspaceShell currentPath="/workspace/scenarios" subtitle="Stored scenario output and original lineage" title={state.data.scenario.name}><div className="mb-6"><Link className="inline-flex items-center gap-2 text-caption font-semibold text-blue-200 hover:text-white" href="/workspace/scenarios"><ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />Back to saved scenarios</Link></div><section className="premium-panel mb-8 rounded-lg p-5"><p className="premium-kicker">Saved scenario</p><p className="mt-2 text-small text-neutral-300">{state.data.scenario.description ?? "Stored assumptions and results are preserved with their base analysis lineage."}</p></section><ExecutiveDashboard viewModel={buildExecutiveDashboardViewModel(state.data.result, state.data.input)} /></WorkspaceShell>;
}
