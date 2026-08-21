import { analyseFinancialStatements, parseFinancialAnalysisInput, type ScenarioAssumptions } from "@/domain";
import { z } from "zod";
import { applyScenario } from "@/domain/scenarios";
import { createAnalysisSnapshot } from "@/server/analysis/analysis-snapshot";
import { ANALYSIS_ENGINE_VERSION } from "@/server/services/analysis-history-service";
import { AppError } from "@/server/errors";
import { BackendRepository } from "@/server/repositories/backend-repository";
import { AuthorizationService } from "@/server/services/authorization-service";

export class ScenarioService {
  private readonly authorization: AuthorizationService;

  constructor(private readonly repository: BackendRepository) {
    this.authorization = new AuthorizationService(repository);
  }

  async create(actorUserId: string, workspaceId: string, companyId: string, input: unknown) {
    const parsedInput = scenarioInputSchema.safeParse(input);
    if (!parsedInput.success) throw new AppError("VALIDATION_ERROR", "A complete scenario name, lineage and finite assumptions are required.");
    const scenarioInput = parsedInput.data;
    await this.authorization.requireCompanyAccess(actorUserId, workspaceId, companyId, "manage-scenario");
    const baseRun = await this.repository.getAnalysisRunForWorkspace(workspaceId, scenarioInput.baseAnalysisRunId);
    if (!baseRun || baseRun.run.companyId !== companyId || baseRun.run.datasetVersionId !== scenarioInput.sourceDatasetVersionId || baseRun.run.status !== "completed") {
      throw new AppError("VALIDATION_ERROR", "A completed analysis from the selected company and dataset version is required.");
    }
    const datasetVersion = await this.repository.findDatasetVersionForWorkspace(workspaceId, companyId, scenarioInput.sourceDatasetVersionId);
    if (!datasetVersion) throw new AppError("NOT_FOUND", "The requested dataset version is not available in this workspace.");
    const canonical = parseFinancialAnalysisInput(datasetVersion.version.canonicalInput);
    if (!canonical.success) throw new AppError("VALIDATION_ERROR", "The persisted dataset version failed canonical validation.");
    const transformed = applyScenario(canonical.data, scenarioInput.assumptions);
    if (transformed.status === "error") throw new AppError("VALIDATION_ERROR", "Scenario assumptions could not produce a valid canonical dataset.");
    const scenario = await this.repository.createScenario({ ...scenarioInput, workspaceId, companyId, createdBy: actorUserId });
    const result = analyseFinancialStatements(transformed.input);
    await this.repository.createScenarioResult({ scenarioId: scenario.id, sourceDatasetVersionId: scenarioInput.sourceDatasetVersionId, baseAnalysisRunId: scenarioInput.baseAnalysisRunId, engineVersion: ANALYSIS_ENGINE_VERSION, snapshot: createAnalysisSnapshot(result) });
    await this.repository.recordActivity({ workspaceId, userId: actorUserId, companyId, eventType: "scenario.created", entityType: "scenario", entityId: scenario.id });
    return { scenario, result };
  }
}

const scenarioInputSchema = z.object({
  baseAnalysisRunId: z.string().uuid(),
  sourceDatasetVersionId: z.string().uuid(),
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(2_000).optional(),
  assumptions: z.object({
    revenueGrowthPercent: z.number().finite(),
    ebitMarginPercent: z.number().finite().nullable(),
    totalDebtChangePercent: z.number().finite(),
    currentAssetsChangePercent: z.number().finite(),
    inventoryChangePercent: z.number().finite(),
    interestExpenseChangePercent: z.number().finite(),
  }).strict() satisfies z.ZodType<ScenarioAssumptions>,
}).strict();
