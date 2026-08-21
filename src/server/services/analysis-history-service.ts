import { analyseFinancialStatements, parseFinancialAnalysisInput, type FinancialAnalysisInput, type FinancialAnalysisResult } from "@/domain";
import { z } from "zod";
import { createAnalysisSnapshot, parseAnalysisSnapshot } from "@/server/analysis/analysis-snapshot";
import { AppError } from "@/server/errors";
import { BackendRepository, type PageRequest } from "@/server/repositories/backend-repository";
import { AuthorizationService } from "@/server/services/authorization-service";

export const ANALYSIS_ENGINE_VERSION = process.env.ANALYSIS_ENGINE_VERSION ?? "financial-ratio-analyzer@0.1.0";

type AnalysisRunner = (input: FinancialAnalysisInput) => FinancialAnalysisResult;

const pageRequestSchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100),
}).strict();

export class AnalysisHistoryService {
  private readonly authorization: AuthorizationService;

  constructor(
    private readonly repository: BackendRepository,
    private readonly runAnalysis: AnalysisRunner = analyseFinancialStatements,
  ) {
    this.authorization = new AuthorizationService(repository);
  }

  async execute(actorUserId: string, workspaceId: string, companyId: string, datasetVersionId: string, idempotencyKey?: string) {
    await this.authorization.requireCompanyAccess(actorUserId, workspaceId, companyId, "run-analysis");
    const datasetVersion = await this.repository.findDatasetVersionForWorkspace(workspaceId, companyId, datasetVersionId);
    if (!datasetVersion) throw new AppError("NOT_FOUND", "The requested dataset version is not available in this workspace.");

    if (idempotencyKey) {
      const existing = await this.repository.findAnalysisRunByIdempotencyKey(workspaceId, idempotencyKey);
      if (existing) {
        if (existing.companyId !== companyId || existing.datasetVersionId !== datasetVersionId) {
          throw new AppError("CONFLICT", "This analysis request key is already associated with a different analysis.");
        }
        if (existing.status !== "completed") {
          throw new AppError("CONFLICT", "This analysis request is already being processed.");
        }
        const completed = await this.repository.getAnalysisRunForWorkspace(workspaceId, existing.id);
        const result = completed?.result ? parseAnalysisSnapshot(completed.result.payload) : null;
        if (!result) throw new AppError("ANALYSIS_FAILED", "The prior analysis result could not be recovered safely.");
        return { runId: existing.id, result };
      }
    }

    const canonical = parseFinancialAnalysisInput(datasetVersion.version.canonicalInput);
    if (!canonical.success) throw new AppError("VALIDATION_ERROR", "The persisted dataset version no longer passes canonical validation.");
    const run = await this.repository.createAnalysisRun({ workspaceId, companyId, datasetVersionId, requestedBy: actorUserId, engineVersion: ANALYSIS_ENGINE_VERSION, idempotencyKey });
    if (!run) {
      const existing = idempotencyKey ? await this.repository.findAnalysisRunByIdempotencyKey(workspaceId, idempotencyKey) : null;
      if (existing && existing.companyId === companyId && existing.datasetVersionId === datasetVersionId) {
        throw new AppError("CONFLICT", "This analysis request is already being processed.");
      }
      throw new AppError("CONFLICT", "The analysis request could not be created safely. Retry the request.");
    }
    await this.repository.markAnalysisRunning(run.id);
    await this.repository.recordActivity({ workspaceId, userId: actorUserId, companyId, eventType: "analysis.started", entityType: "analysis_run", entityId: run.id });

    try {
      const result = this.runAnalysis(canonical.data);
      await this.repository.completeAnalysisRun(run.id, createAnalysisSnapshot(result));
      await this.repository.recordActivity({ workspaceId, userId: actorUserId, companyId, eventType: "analysis.completed", entityType: "analysis_run", entityId: run.id });
      return { runId: run.id, result };
    } catch {
      await this.repository.failAnalysisRun(run.id, "ANALYSIS_FAILED");
      await this.repository.recordActivity({ workspaceId, userId: actorUserId, companyId, eventType: "analysis.failed", entityType: "analysis_run", entityId: run.id, metadata: { failureCode: "ANALYSIS_FAILED" } });
      throw new AppError("ANALYSIS_FAILED", "The financial analysis could not be completed safely.");
    }
  }

  async get(actorUserId: string, workspaceId: string, runId: string) {
    await this.authorization.requireWorkspaceAction(actorUserId, workspaceId, "read");
    const row = await this.repository.getAnalysisRunForWorkspace(workspaceId, runId);
    if (!row) throw new AppError("NOT_FOUND", "The requested analysis is not available in this workspace.");
    return { run: row.run, result: row.result ? parseAnalysisSnapshot(row.result.payload) : null };
  }

  async list(actorUserId: string, workspaceId: string, request: unknown, companyId?: string) {
    await this.authorization.requireWorkspaceAction(actorUserId, workspaceId, "read");
    if (companyId) await this.authorization.requireCompanyAccess(actorUserId, workspaceId, companyId, "read");
    const parsedResult = pageRequestSchema.safeParse(request);
    if (!parsedResult.success) throw new AppError("VALIDATION_ERROR", "A pagination request must use a limit from 1 to 100.");
    const parsed = parsedResult.data satisfies PageRequest;
    return this.repository.listAnalysisRuns(workspaceId, parsed, companyId);
  }
}
