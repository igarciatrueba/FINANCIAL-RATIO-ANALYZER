import { analyseFinancialStatements } from "@/domain";
import { cloneDemoCompany } from "@/features/financial-input/demo-companies";
import { buildPremiumLandingViewModel, PremiumLanding } from "@/features/premium-landing";

export default function LandingPage() {
  const novaTech = cloneDemoCompany("novatech-solutions");
  const viewModel = buildPremiumLandingViewModel(analyseFinancialStatements(novaTech));

  return <PremiumLanding viewModel={viewModel} />;
}
