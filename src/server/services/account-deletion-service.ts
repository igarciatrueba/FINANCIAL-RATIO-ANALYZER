import { AppError } from "@/server/errors";
import { BackendRepository } from "@/server/repositories/backend-repository";
import type { StorageService } from "@/server/storage/types";

type AuthIdentityDeletion = { deleteUser(providerUserId: string): Promise<void> };

export class AccountDeletionService {
  constructor(
    private readonly repository: BackendRepository,
    private readonly storage: StorageService,
    private readonly auth: AuthIdentityDeletion,
  ) {}

  async deleteAccount(input: { userId: string; providerUserId: string }) {
    const workspaces = await this.repository.listAccountDeletionWorkspaces(input.userId);
    if (!workspaces.length || workspaces.some((workspace) => workspace.ownerUserId !== input.userId || workspace.memberCount !== 1)) {
      throw new AppError("CONFLICT", "Account deletion is unavailable while a shared workspace is connected to this account.");
    }
    const workspaceIds = workspaces.map((workspace) => workspace.id);
    const files = await this.repository.listStorageKeysForWorkspaces(workspaceIds);
    for (const file of files) await this.storage.delete(file.storageKey);
    await this.repository.deletePersonalAccountData(input.userId, workspaceIds);
    await this.auth.deleteUser(input.providerUserId);
  }
}
