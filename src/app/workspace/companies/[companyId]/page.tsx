import { CompanyWorkspaceView } from "@/features/workspace/components/workspace-collections";
import { WorkspacePageState, WorkspaceShell } from "@/features/workspace/components/workspace-shell";
import { loadWorkspaceRoute } from "@/features/workspace/lib/workspace-route-error";
import { loadCompanyWorkspace } from "@/server/accounts/workspace-data";

export const dynamic = "force-dynamic";

export default async function CompanyPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const state = await loadWorkspaceRoute(() => loadCompanyWorkspace(companyId), `/workspace/companies/${companyId}`);
  if (state.failure) return <WorkspaceShell currentPath="/workspace/companies" subtitle="Company workspace" title="Company"><WorkspacePageState {...state.failure} /></WorkspaceShell>;
  return <WorkspaceShell currentPath="/workspace/companies" subtitle="Financial data, analyses, files and scenarios" title={state.data.company.name}><CompanyWorkspaceView data={state.data} /></WorkspaceShell>;
}
