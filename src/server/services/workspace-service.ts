import { z } from "zod";

import { AppError } from "@/server/errors";
import { BackendRepository } from "@/server/repositories/backend-repository";
import { AuthorizationService } from "@/server/services/authorization-service";

const workspaceNameSchema = z.string().trim().min(1).max(255);
const workspaceRoleSchema = z.enum(["owner", "admin", "member", "viewer"]);
const pageRequestSchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100),
}).strict();

export class WorkspaceService {
  private readonly authorization: AuthorizationService;

  constructor(private readonly repository: BackendRepository) {
    this.authorization = new AuthorizationService(repository);
  }

  async createPersonalWorkspace(userId: string, name: unknown) {
    const parsedName = workspaceNameSchema.safeParse(name);
    if (!parsedName.success) throw new AppError("VALIDATION_ERROR", "A workspace name between 1 and 255 characters is required.");
    const workspace = await this.repository.createWorkspaceWithOwner({ ownerUserId: userId, name: parsedName.data });
    await this.repository.recordActivity({ workspaceId: workspace.id, userId, eventType: "workspace.created", entityType: "workspace", entityId: workspace.id });
    return workspace;
  }

  async ensurePersonalWorkspace(userId: string, name: unknown) {
    const parsedName = workspaceNameSchema.safeParse(name);
    if (!parsedName.success) throw new AppError("VALIDATION_ERROR", "A workspace name between 1 and 255 characters is required.");
    const provisioned = await this.repository.ensureWorkspaceWithOwner({ ownerUserId: userId, name: parsedName.data });
    if (provisioned.created) {
      await this.repository.recordActivity({ workspaceId: provisioned.workspace.id, userId, eventType: "workspace.created", entityType: "workspace", entityId: provisioned.workspace.id });
    }
    return provisioned.workspace;
  }

  async listForUser(actorUserId: string, request: unknown) {
    const parsed = pageRequestSchema.safeParse(request);
    if (!parsed.success) throw new AppError("VALIDATION_ERROR", "A pagination request must use a limit from 1 to 100.");
    return this.repository.listWorkspacesForUser(actorUserId, parsed.data);
  }

  async archive(actorUserId: string, workspaceId: string) {
    await this.authorization.requireWorkspaceAction(actorUserId, workspaceId, "archive-workspace");
    const workspace = await this.repository.archiveWorkspace(workspaceId);
    if (!workspace) throw new AppError("NOT_FOUND", "The requested workspace is not available.");
    await this.repository.recordActivity({ workspaceId, userId: actorUserId, eventType: "workspace.archived", entityType: "workspace", entityId: workspaceId });
    return workspace;
  }

  async addMember(actorUserId: string, workspaceId: string, userId: string, role: unknown) {
    const actorMembership = await this.authorization.requireWorkspaceAction(actorUserId, workspaceId, "manage-members");
    const parsedRole = workspaceRoleSchema.safeParse(role);
    if (!parsedRole.success) throw new AppError("VALIDATION_ERROR", "A supported workspace role is required.");
    if (parsedRole.data === "owner" && actorMembership?.role !== "owner") {
      throw new AppError("FORBIDDEN", "Only a workspace owner can grant the owner role.");
    }
    const membership = await this.repository.addWorkspaceMember({ workspaceId, userId, role: parsedRole.data });
    await this.repository.recordActivity({ workspaceId, userId: actorUserId, eventType: "workspace.member_added", entityType: "workspace_member", entityId: membership.id, metadata: { role: parsedRole.data } });
    return membership;
  }
}
