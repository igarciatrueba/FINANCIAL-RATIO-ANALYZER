import { AppError } from "@/server/errors";

export const workspaceRoles = ["owner", "admin", "member", "viewer"] as const;
export type WorkspaceRole = (typeof workspaceRoles)[number];

export const workspaceActions = [
  "read",
  "manage-company",
  "manage-dataset",
  "run-analysis",
  "manage-scenario",
  "manage-files",
  "manage-members",
  "archive-workspace",
] as const;
export type WorkspaceAction = (typeof workspaceActions)[number];

const rolePermissions: Record<WorkspaceRole, readonly WorkspaceAction[]> = {
  owner: workspaceActions,
  admin: ["read", "manage-company", "manage-dataset", "run-analysis", "manage-scenario", "manage-files", "manage-members"],
  member: ["read", "manage-company", "manage-dataset", "run-analysis", "manage-scenario", "manage-files"],
  viewer: ["read"],
};

export function canPerformWorkspaceAction(role: WorkspaceRole, action: WorkspaceAction) {
  return rolePermissions[role].includes(action);
}

export function requireWorkspaceAction(role: WorkspaceRole | null, action: WorkspaceAction): asserts role is WorkspaceRole {
  if (!role || !canPerformWorkspaceAction(role, action)) {
    throw new AppError("FORBIDDEN", "You do not have permission to perform this workspace action.");
  }
}
