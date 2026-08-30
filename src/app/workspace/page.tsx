import { WorkspaceDashboard } from "@/features/workspace/components/workspace-dashboard";
import { WorkspacePageState, WorkspaceShell } from "@/features/workspace/components/workspace-shell";
import { loadWorkspaceRoute } from "@/features/workspace/lib/workspace-route-error";
import { loadWorkspaceOverview } from "@/server/accounts/workspace-data";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  const state = await loadWorkspaceRoute(loadWorkspaceOverview, "/workspace");
  if (state.failure) return <WorkspaceShell currentPath="/workspace" subtitle="Persistent analysis workspace" title="Workspace"><WorkspacePageState {...state.failure} /></WorkspaceShell>;
  return <WorkspaceShell currentPath="/workspace" subtitle="Companies, history, files and scenarios" title="Workspace"><WorkspaceDashboard data={state.data} /></WorkspaceShell>;
}
