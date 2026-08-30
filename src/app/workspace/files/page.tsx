import { FilesCollection } from "@/features/workspace/components/workspace-collections";
import { WorkspacePageState, WorkspaceShell } from "@/features/workspace/components/workspace-shell";
import { loadWorkspaceRoute } from "@/features/workspace/lib/workspace-route-error";
import { loadWorkspaceFiles } from "@/server/accounts/workspace-data";

export const dynamic = "force-dynamic";

export default async function FilesPage({ searchParams }: { searchParams: Promise<{ cursor?: string }> }) {
  const { cursor } = await searchParams;
  const state = await loadWorkspaceRoute(() => loadWorkspaceFiles(cursor), "/workspace/files");
  if (state.failure) return <WorkspaceShell currentPath="/workspace/files" subtitle="Private workspace files" title="Files"><WorkspacePageState {...state.failure} /></WorkspaceShell>;
  const nextHref = state.data.files.nextCursor ? `/workspace/files?cursor=${encodeURIComponent(state.data.files.nextCursor)}` : null;
  return <WorkspaceShell currentPath="/workspace/files" subtitle="Private source documents and signed access" title="Files"><FilesCollection data={state.data} nextHref={nextHref} /></WorkspaceShell>;
}
