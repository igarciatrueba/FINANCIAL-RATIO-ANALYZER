import { getSupabaseAuthenticatedIdentity } from "@/server/auth/supabase-server";
import { AppError } from "@/server/errors";
import type { BackendRepository } from "@/server/repositories/backend-repository";

export async function requireAuthenticatedUser(repository: BackendRepository) {
  const identity = await getSupabaseAuthenticatedIdentity();

  if (!identity) {
    throw new AppError("UNAUTHENTICATED", "Sign in is required for this workspace operation.");
  }

  return repository.upsertInternalUser(identity);
}
