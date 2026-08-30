import { z } from "zod";

import { AppError } from "@/server/errors";
import type { PageRequest } from "@/server/repositories/backend-repository";
import { BackendRepository } from "@/server/repositories/backend-repository";
import { AuthorizationService } from "@/server/services/authorization-service";

const activityRequestSchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100),
}).strict();

/** Reads product activity only; authentication-provider security logs remain external. */
export class ActivityService {
  private readonly authorization: AuthorizationService;

  constructor(private readonly repository: BackendRepository) {
    this.authorization = new AuthorizationService(repository);
  }

  async list(actorUserId: string, workspaceId: string, request: unknown, companyId?: string) {
    await this.authorization.requireWorkspaceAction(actorUserId, workspaceId, "read");
    if (companyId) await this.authorization.requireCompanyAccess(actorUserId, workspaceId, companyId, "read");
    const parsedResult = activityRequestSchema.safeParse(request);
    if (!parsedResult.success) throw new AppError("VALIDATION_ERROR", "A pagination request must use a limit from 1 to 100.");
    const parsed = parsedResult.data satisfies PageRequest;
    return this.repository.listActivityForWorkspace(workspaceId, parsed, companyId);
  }
}
