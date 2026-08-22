import { requireAuthenticatedIdentity } from "@/server/auth/require-authenticated-user";
import type { AuthenticatedIdentity } from "@/server/auth/types";
import { BackendRepository } from "@/server/repositories/backend-repository";
import { WorkspaceService } from "@/server/services/workspace-service";

/** Resolves an authenticated provider identity and ensures its personal workspace exists. */
export class AccountService {
  private readonly workspaces: WorkspaceService;

  constructor(private readonly repository: BackendRepository) {
    this.workspaces = new WorkspaceService(repository);
  }

  async resolveCurrentAccount() {
    return this.resolveAccountForIdentity(await requireAuthenticatedIdentity());
  }

  /** Keeps provider session resolution at the server boundary while making bootstrap testable. */
  async resolveAccountForIdentity(identity: AuthenticatedIdentity) {
    const user = await this.repository.upsertInternalUser(identity);
    const workspace = await this.workspaces.ensurePersonalWorkspace(user.id, "Personal workspace");
    return { user, workspace };
  }
}
