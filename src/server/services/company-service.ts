import { z } from "zod";

import { AppError } from "@/server/errors";
import { BackendRepository } from "@/server/repositories/backend-repository";
import { AuthorizationService } from "@/server/services/authorization-service";

const companyInputSchema = z.object({
  name: z.string().trim().min(1).max(255),
  industry: z.string().trim().min(1).max(255),
  currency: z.enum(["EUR", "USD", "GBP"]),
}).strict();

const companyUpdateSchema = companyInputSchema.partial().refine((input) => Object.keys(input).length > 0);
const pageRequestSchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100),
}).strict();

export class CompanyService {
  private readonly authorization: AuthorizationService;

  constructor(private readonly repository: BackendRepository) {
    this.authorization = new AuthorizationService(repository);
  }

  async create(actorUserId: string, workspaceId: string, input: unknown) {
    await this.authorization.requireWorkspaceAction(actorUserId, workspaceId, "manage-company");
    const parsed = companyInputSchema.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Company name, industry and a supported currency are required.");
    const company = await this.repository.createCompany({ workspaceId, createdBy: actorUserId, ...parsed.data });
    await this.repository.recordActivity({ workspaceId, userId: actorUserId, companyId: company.id, eventType: "company.created", entityType: "company", entityId: company.id });
    return company;
  }

  async archive(actorUserId: string, workspaceId: string, companyId: string) {
    await this.authorization.requireCompanyAccess(actorUserId, workspaceId, companyId, "manage-company");
    const company = await this.repository.archiveCompany(workspaceId, companyId);
    if (!company) throw new AppError("NOT_FOUND", "The requested company is not available in this workspace.");
    await this.repository.recordActivity({ workspaceId, userId: actorUserId, companyId, eventType: "company.archived", entityType: "company", entityId: companyId });
    return company;
  }

  async list(actorUserId: string, workspaceId: string, request: unknown) {
    await this.authorization.requireWorkspaceAction(actorUserId, workspaceId, "read");
    const parsed = pageRequestSchema.safeParse(request);
    if (!parsed.success) throw new AppError("VALIDATION_ERROR", "A pagination request must use a limit from 1 to 100.");
    return this.repository.listCompaniesForWorkspace(workspaceId, parsed.data);
  }

  async get(actorUserId: string, workspaceId: string, companyId: string) {
    return this.authorization.requireCompanyAccess(actorUserId, workspaceId, companyId, "read");
  }

  async update(actorUserId: string, workspaceId: string, companyId: string, input: unknown) {
    await this.authorization.requireCompanyAccess(actorUserId, workspaceId, companyId, "manage-company");
    const parsed = companyUpdateSchema.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Provide at least one valid company field to update.");
    const company = await this.repository.updateCompany(workspaceId, companyId, parsed.data);
    if (!company) throw new AppError("NOT_FOUND", "The requested company is not available in this workspace.");
    await this.repository.recordActivity({ workspaceId, userId: actorUserId, companyId, eventType: "company.updated", entityType: "company", entityId: companyId });
    return company;
  }
}
