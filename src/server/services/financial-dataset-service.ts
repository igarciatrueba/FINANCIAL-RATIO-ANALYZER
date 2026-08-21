import { z } from "zod";

import { parseFinancialAnalysisInput, type FinancialAnalysisInput } from "@/domain";
import { AppError } from "@/server/errors";
import { BackendRepository } from "@/server/repositories/backend-repository";
import { AuthorizationService } from "@/server/services/authorization-service";

const datasetNameSchema = z.string().trim().min(1).max(255);

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
}
