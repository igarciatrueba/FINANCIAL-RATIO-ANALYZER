import { requireAuthenticatedUser } from "@/server/auth/require-authenticated-user";
import { BackendRepository } from "@/server/repositories/backend-repository";
import { WorkspaceService } from "@/server/services/workspace-service";

/** Resolves an authenticated provider identity and ensures its personal workspace exists. */
export class AccountService {
  private readonly workspaces: WorkspaceService;

  constructor(private readonly repository: BackendRepository) {
    this.workspaces = new WorkspaceService(repository);
  }

  async resolveCurrentAccount() {
    const user = await requireAuthenticatedUser(this.repository);
    const workspace = await this.workspaces.ensurePersonalWorkspace(user.id, "Personal workspace");
    return { user, workspace };
  }
}
