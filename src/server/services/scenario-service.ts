import { analyseFinancialStatements, parseFinancialAnalysisInput, type ScenarioAssumptions } from "@/domain";
import { z } from "zod";
import { applyScenario } from "@/domain/scenarios";
import { createAnalysisSnapshot, parseAnalysisSnapshot } from "@/server/analysis/analysis-snapshot";
import { AppError } from "@/server/errors";
import { BackendRepository, type PageRequest } from "@/server/repositories/backend-repository";
import { ANALYSIS_ENGINE_VERSION } from "@/server/services/analysis-history-service";
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

  async get(actorUserId: string, workspaceId: string, scenarioId: string) {
    await this.authorization.requireWorkspaceAction(actorUserId, workspaceId, "read");
    const row = await this.repository.getScenarioForWorkspace(workspaceId, scenarioId);
    if (!row || !row.assumptions) throw new AppError("NOT_FOUND", "The requested scenario is not available in this workspace.");
    const assumptions = scenarioAssumptionsSchema.safeParse(row.assumptions.assumptions);
    const result = row.result ? parseAnalysisSnapshot(row.result.payload) : null;
    if (!assumptions.success || (row.result && !result)) {
      throw new AppError("VALIDATION_ERROR", "The persisted scenario payload could not be recovered safely.");
    }
    return { scenario: row.scenario, assumptions: assumptions.data, result };
  }

  async list(actorUserId: string, workspaceId: string, request: unknown, companyId?: string) {
    await this.authorization.requireWorkspaceAction(actorUserId, workspaceId, "read");
    if (companyId) await this.authorization.requireCompanyAccess(actorUserId, workspaceId, companyId, "read");
    const parsed = pageRequestSchema.safeParse(request);
    if (!parsed.success) throw new AppError("VALIDATION_ERROR", "A pagination request must use a limit from 1 to 100.");
    return this.repository.listScenariosForWorkspace(workspaceId, parsed.data satisfies PageRequest, companyId);
  }

  async archive(actorUserId: string, workspaceId: string, scenarioId: string) {
    await this.authorization.requireWorkspaceAction(actorUserId, workspaceId, "manage-scenario");
    const scenario = await this.repository.getScenarioForWorkspace(workspaceId, scenarioId);
    if (!scenario) throw new AppError("NOT_FOUND", "The requested scenario is not available in this workspace.");
    const archived = await this.repository.archiveScenario(workspaceId, scenarioId);
    if (!archived) throw new AppError("NOT_FOUND", "The requested scenario is not available in this workspace.");
    await this.repository.recordActivity({ workspaceId, userId: actorUserId, companyId: scenario.scenario.companyId, eventType: "scenario.archived", entityType: "scenario", entityId: scenarioId });
    return archived;
  }

  async update(actorUserId: string, workspaceId: string, scenarioId: string, input: unknown) {
    await this.authorization.requireWorkspaceAction(actorUserId, workspaceId, "manage-scenario");
    const parsed = scenarioUpdateSchema.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Provide a valid scenario name or description to update.");
    const scenario = await this.repository.updateScenario(workspaceId, scenarioId, parsed.data);
    if (!scenario) throw new AppError("NOT_FOUND", "The requested scenario is not available in this workspace.");
    await this.repository.recordActivity({ workspaceId, userId: actorUserId, companyId: scenario.companyId, eventType: "scenario.updated", entityType: "scenario", entityId: scenarioId });
    return scenario;
  }
}

const scenarioAssumptionsSchema = z.object({
  revenueGrowthPercent: z.number().finite(),
  ebitMarginPercent: z.number().finite().nullable(),
  totalDebtChangePercent: z.number().finite(),
  currentAssetsChangePercent: z.number().finite(),
  inventoryChangePercent: z.number().finite(),
  interestExpenseChangePercent: z.number().finite(),
}).strict() satisfies z.ZodType<ScenarioAssumptions>;

const scenarioInputSchema = z.object({
  baseAnalysisRunId: z.string().uuid(),
  sourceDatasetVersionId: z.string().uuid(),
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(2_000).optional(),
  assumptions: scenarioAssumptionsSchema,
}).strict();

const scenarioUpdateSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(2_000).nullable().optional(),
}).strict().refine((input) => Object.keys(input).length > 0);

const pageRequestSchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100),
}).strict();
