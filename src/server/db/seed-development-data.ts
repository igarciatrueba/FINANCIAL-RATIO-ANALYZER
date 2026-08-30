import { cloneDemoCompany } from "@/features/financial-input/demo-companies";
import { BackendRepository } from "@/server/repositories/backend-repository";

const developmentIdentity = {
  provider: "development",
  providerUserId: "financial-ratio-analyzer-development-user",
  email: "development-user@example.test",
  displayName: "Development User",
};

const workspaceName = "Development workspace";

export async function seedDevelopmentWorkspace(repository: BackendRepository) {
  const user = await repository.upsertInternalUser(developmentIdentity);
  const workspace = await repository.findWorkspaceOwnedBy(user.id, workspaceName)
    ?? await repository.createWorkspaceWithOwner({ ownerUserId: user.id, name: workspaceName });

  for (const demoId of ["novatech-solutions", "atlas-manufacturing-group"] as const) {
    const demo = cloneDemoCompany(demoId);
    const existingCompany = await repository.findCompanyByNameForWorkspace(workspace.id, demo.company.name);
    if (existingCompany) continue;
    const company = await repository.createCompany({
      workspaceId: workspace.id,
      name: demo.company.name,
      industry: demo.company.industry,
      currency: demo.company.currency,
      createdBy: user.id,
    });
    const canonicalInput = { ...demo, company: { ...demo.company, id: company.id } };
    await repository.createDatasetWithInitialVersion({
      workspaceId: workspace.id,
      companyId: company.id,
      name: `${demo.company.name} FY ${demo.periods[0].year}-${demo.periods.at(-1)?.year}`,
      createdBy: user.id,
      sourceType: "demo",
      canonicalInput,
    });
  }

  return { user, workspace };
}
