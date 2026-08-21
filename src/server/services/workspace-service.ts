import { z } from "zod";

import { AppError } from "@/server/errors";
import { BackendRepository } from "@/server/repositories/backend-repository";
import { AuthorizationService } from "@/server/services/authorization-service";

const workspaceNameSchema = z.string().trim().min(1).max(255);
const workspaceRoleSchema = z.enum(["owner", "admin", "member", "viewer"]);

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
    const existing = await this.repository.findWorkspaceOwnedBy(userId, parsedName.data);
    return existing ?? this.createPersonalWorkspace(userId, parsedName.data);
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
