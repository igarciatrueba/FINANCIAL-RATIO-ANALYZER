import { redirect } from "next/navigation";

import { AppError } from "@/server/errors";

export type WorkspaceRouteFailure = { title: string; description: string };

export function resolveWorkspaceRouteError(error: unknown, destination: string) {
  if (error instanceof AppError && error.code === "UNAUTHENTICATED") {
    redirect(`/login?next=${encodeURIComponent(destination)}`);
  }
  if (error instanceof AppError && error.code === "FORBIDDEN") {
    return { title: "You do not have access to this workspace resource.", description: "Your workspace membership does not permit this action. Return to the workspace to continue." };
  }
  if (error instanceof AppError && error.code === "NOT_FOUND") {
    return { title: "This workspace resource is unavailable.", description: "It may have been archived, removed, or belong to a different workspace." };
  }
  return { title: "Workspace data is unavailable.", description: "The secure workspace service could not complete this request. Your anonymous analysis remains available." };
}

export async function loadWorkspaceRoute<T>(load: () => Promise<T>, destination: string): Promise<{ data: T; failure: null } | { data: null; failure: WorkspaceRouteFailure }> {
  try {
    return { data: await load(), failure: null };
  } catch (error) {
    return { data: null, failure: resolveWorkspaceRouteError(error, destination) };
  }
}
