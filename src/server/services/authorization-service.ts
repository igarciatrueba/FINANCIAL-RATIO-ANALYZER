import type { WorkspaceAction } from "@/server/authorization";
import { requireWorkspaceAction } from "@/server/authorization";
import { AppError } from "@/server/errors";
import { BackendRepository } from "@/server/repositories/backend-repository";

export class AuthorizationService {
  constructor(private readonly repository: BackendRepository) {}

  async requireWorkspaceAction(userId: string, workspaceId: string, action: WorkspaceAction) {
    if (!z.string().uuid().safeParse(workspaceId).success) {
      throw new AppError("VALIDATION_ERROR", "A valid workspace identifier is required.");
    }
    const membership = await this.repository.findMembership(userId, workspaceId);
    requireWorkspaceAction(membership?.role ?? null, action);
    return membership;
  }

  async requireCompanyAccess(userId: string, workspaceId: string, companyId: string, action: WorkspaceAction) {
    if (!z.string().uuid().safeParse(companyId).success) {
      throw new AppError("VALIDATION_ERROR", "A valid company identifier is required.");
    }
    await this.requireWorkspaceAction(userId, workspaceId, action);
    const company = await this.repository.findCompanyForWorkspace(workspaceId, companyId);
    if (!company) {
      throw new AppError("NOT_FOUND", "The requested company is not available in this workspace.");
    }
    return company;
  }
}
import { z } from "zod";
