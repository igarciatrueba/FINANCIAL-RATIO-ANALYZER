import { z } from "zod";

import { parseFinancialAnalysisInput, type FinancialAnalysisInput } from "@/domain";
import { AppError } from "@/server/errors";
import { BackendRepository } from "@/server/repositories/backend-repository";
import { AuthorizationService } from "@/server/services/authorization-service";

const datasetNameSchema = z.string().trim().min(1).max(255);
const pageRequestSchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100),
}).strict();

function bindInputToCompany(input: FinancialAnalysisInput, companyId: string) {
  return { ...input, company: { ...input.company, id: companyId } } satisfies FinancialAnalysisInput;
}

function parseCanonicalCandidate(value: unknown, companyId: string) {
  const parsed = parseFinancialAnalysisInput(value);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR", "The financial dataset failed canonical validation.");
  return bindInputToCompany(parsed.data, companyId);
}

export class FinancialDatasetService {
  private readonly authorization: AuthorizationService;

  constructor(private readonly repository: BackendRepository) {
    this.authorization = new AuthorizationService(repository);
  }

  async createDataset(actorUserId: string, workspaceId: string, companyId: string, name: unknown, input: unknown, sourceType: "manual" | "demo" | "import" = "manual") {
    await this.authorization.requireCompanyAccess(actorUserId, workspaceId, companyId, "manage-dataset");
    const parsedName = datasetNameSchema.safeParse(name);
    if (!parsedName.success) throw new AppError("VALIDATION_ERROR", "A dataset name between 1 and 255 characters is required.");
    const versionedInput = parseCanonicalCandidate(input, companyId);
    const created = await this.repository.createDatasetWithInitialVersion({ workspaceId, companyId, name: parsedName.data, createdBy: actorUserId, sourceType, canonicalInput: versionedInput });
    if (!created) throw new AppError("NOT_FOUND", "The requested company is not available in this workspace.");
    await this.repository.recordActivity({ workspaceId, userId: actorUserId, companyId, eventType: "dataset.version_created", entityType: "financial_dataset_version", entityId: created.version.id, metadata: { versionNumber: created.version.versionNumber } });
    return created;
  }

  async createVersion(actorUserId: string, workspaceId: string, companyId: string, datasetId: string, input: unknown, sourceType: "manual" | "demo" | "import" | "scenario" = "manual") {
    await this.authorization.requireCompanyAccess(actorUserId, workspaceId, companyId, "manage-dataset");
    const versionedInput = parseCanonicalCandidate(input, companyId);
    const version = await this.repository.createNextDatasetVersion({ workspaceId, companyId, financialDatasetId: datasetId, createdBy: actorUserId, sourceType, canonicalInput: versionedInput });
    if (!version) throw new AppError("NOT_FOUND", "The requested dataset is not available in this workspace.");
    await this.repository.recordActivity({ workspaceId, userId: actorUserId, companyId, eventType: "dataset.version_created", entityType: "financial_dataset_version", entityId: version.id, metadata: { versionNumber: version.versionNumber } });
    return version;
  }

  async list(actorUserId: string, workspaceId: string, companyId: string, request: unknown) {
    await this.authorization.requireCompanyAccess(actorUserId, workspaceId, companyId, "read");
    const parsed = pageRequestSchema.safeParse(request);
    if (!parsed.success) throw new AppError("VALIDATION_ERROR", "A pagination request must use a limit from 1 to 100.");
    return this.repository.listDatasetsForCompany(workspaceId, companyId, parsed.data);
  }

  async getVersion(actorUserId: string, workspaceId: string, companyId: string, versionId: string) {
    await this.authorization.requireCompanyAccess(actorUserId, workspaceId, companyId, "read");
    const row = await this.repository.findDatasetVersionForWorkspace(workspaceId, companyId, versionId);
    if (!row) throw new AppError("NOT_FOUND", "The requested dataset version is not available in this workspace.");
    return row.version;
  }

  async archive(actorUserId: string, workspaceId: string, companyId: string, datasetId: string) {
    await this.authorization.requireCompanyAccess(actorUserId, workspaceId, companyId, "manage-dataset");
    const dataset = await this.repository.archiveDataset(workspaceId, companyId, datasetId);
    if (!dataset) throw new AppError("NOT_FOUND", "The requested dataset is not available in this workspace.");
    await this.repository.recordActivity({ workspaceId, userId: actorUserId, companyId, eventType: "dataset.archived", entityType: "financial_dataset", entityId: datasetId });
    return dataset;
  }
}
