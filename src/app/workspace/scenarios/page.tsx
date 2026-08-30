import { ScenariosCollection } from "@/features/workspace/components/workspace-collections";
import { WorkspacePageState, WorkspaceShell } from "@/features/workspace/components/workspace-shell";
import { loadWorkspaceRoute } from "@/features/workspace/lib/workspace-route-error";
import { loadWorkspaceScenarios } from "@/server/accounts/workspace-data";

export const dynamic = "force-dynamic";

export default async function ScenariosPage({ searchParams }: { searchParams: Promise<{ cursor?: string }> }) {
  const { cursor } = await searchParams;
  const state = await loadWorkspaceRoute(() => loadWorkspaceScenarios(cursor), "/workspace/scenarios");
  if (state.failure) return <WorkspaceShell currentPath="/workspace/scenarios" subtitle="Scenario library" title="Saved Scenarios"><WorkspacePageState {...state.failure} /></WorkspaceShell>;
  const nextHref = state.data.scenarios.nextCursor ? `/workspace/scenarios?cursor=${encodeURIComponent(state.data.scenarios.nextCursor)}` : null;
  return <WorkspaceShell currentPath="/workspace/scenarios" subtitle="Saved sensitivity records and immutable lineage" title="Saved Scenarios"><ScenariosCollection data={state.data} nextHref={nextHref} /></WorkspaceShell>;
}
