import { CompaniesCollection } from "@/features/workspace/components/workspace-collections";
import { WorkspacePageState, WorkspaceShell } from "@/features/workspace/components/workspace-shell";
import { loadWorkspaceRoute } from "@/features/workspace/lib/workspace-route-error";
import { loadWorkspaceOverview } from "@/server/accounts/workspace-data";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const state = await loadWorkspaceRoute(loadWorkspaceOverview, "/workspace/companies");
  if (state.failure) return <WorkspaceShell currentPath="/workspace/companies" subtitle="Company management" title="Companies"><WorkspacePageState {...state.failure} /></WorkspaceShell>;
  return <WorkspaceShell currentPath="/workspace/companies" subtitle="Company metadata and immutable financial lineage" title="Companies"><CompaniesCollection data={state.data} /></WorkspaceShell>;
}
