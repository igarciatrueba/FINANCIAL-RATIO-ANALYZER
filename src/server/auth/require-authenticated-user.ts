import { getSupabaseAuthenticatedIdentity } from "@/server/auth/supabase-server";
import type { AuthenticatedIdentity } from "@/server/auth/types";
import { AppError } from "@/server/errors";
import type { BackendRepository } from "@/server/repositories/backend-repository";

export async function requireAuthenticatedIdentity(): Promise<AuthenticatedIdentity> {
  const identity = await getSupabaseAuthenticatedIdentity();

  if (!identity) {
    throw new AppError("UNAUTHENTICATED", "Sign in is required for this workspace operation.");
  }

  return identity;
}

export async function requireAuthenticatedUser(repository: BackendRepository) {
  return repository.upsertInternalUser(await requireAuthenticatedIdentity());
}
