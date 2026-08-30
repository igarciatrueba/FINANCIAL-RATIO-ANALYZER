export const PERSISTED_ANALYSIS_CONTEXT_KEY = "financial-ratio-analyzer:persisted-analysis-context:v1";

export type PersistedAnalysisContext = {
  runId: string;
  companyId: string;
  datasetVersionId: string;
};

export function recoverPersistedAnalysisContext(value: string | null): PersistedAnalysisContext | null {
  if (!value) return null;
  try {
    const candidate = JSON.parse(value) as Partial<PersistedAnalysisContext>;
    return typeof candidate.runId === "string" && typeof candidate.companyId === "string" && typeof candidate.datasetVersionId === "string"
      ? { runId: candidate.runId, companyId: candidate.companyId, datasetVersionId: candidate.datasetVersionId }
      : null;
  } catch {
    return null;
  }
}
