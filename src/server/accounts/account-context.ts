import { AccountService } from "@/server/services/account-service";
import { ActivityService } from "@/server/services/activity-service";
import { AnalysisHistoryService } from "@/server/services/analysis-history-service";
import { CompanyService } from "@/server/services/company-service";
import { FinancialDatasetService } from "@/server/services/financial-dataset-service";
import { FileService } from "@/server/services/file-service";
import { ScenarioService } from "@/server/services/scenario-service";
import { BackendRepository } from "@/server/repositories/backend-repository";
import { getDatabase } from "@/server/db/client";

export async function resolveAccountContext() {
  const repository = new BackendRepository(getDatabase());
  const account = await new AccountService(repository).resolveCurrentAccount();

  return {
    ...account,
    repository,
    services: {
      activity: new ActivityService(repository),
      analyses: new AnalysisHistoryService(repository),
      companies: new CompanyService(repository),
      datasets: new FinancialDatasetService(repository),
      scenarios: new ScenarioService(repository),
      files: new FileService(repository),
    },
  };
}
