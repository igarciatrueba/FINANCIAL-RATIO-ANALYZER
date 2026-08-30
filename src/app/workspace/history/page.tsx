import { AnalysisHistoryCollection } from "@/features/workspace/components/workspace-collections";
import { WorkspacePageState, WorkspaceShell } from "@/features/workspace/components/workspace-shell";
import { loadWorkspaceRoute } from "@/features/workspace/lib/workspace-route-error";
import { loadAnalysisHistory } from "@/server/accounts/workspace-data";

export const dynamic = "force-dynamic";

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ cursor?: string }> }) {
  const { cursor } = await searchParams;
  const state = await loadWorkspaceRoute(() => loadAnalysisHistory(cursor), "/workspace/history");
  if (state.failure) return <WorkspaceShell currentPath="/workspace/history" subtitle="Historical analysis" title="Analysis History"><WorkspacePageState {...state.failure} /></WorkspaceShell>;
  const nextHref = state.data.analyses.nextCursor ? `/workspace/history?cursor=${encodeURIComponent(state.data.analyses.nextCursor)}` : null;
  return <WorkspaceShell currentPath="/workspace/history" subtitle="Stored results tied to immutable datasets" title="Analysis History"><AnalysisHistoryCollection data={state.data} nextHref={nextHref} /></WorkspaceShell>;
}
