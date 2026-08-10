import { describe, expect, it } from "vitest";

import { analyseFinancialStatements } from "@/domain";
import { cloneDemoCompany } from "@/features/financial-input/demo-companies";
import { buildPremiumLandingViewModel } from "@/features/premium-landing/lib/build-premium-landing-view-model";

describe("premium landing view model", () => {
  it("uses the canonical NovaTech analysis rather than independent display values", () => {
    const model = buildPremiumLandingViewModel(analyseFinancialStatements(cloneDemoCompany("novatech-solutions")));

    expect(model.company).toBe("NovaTech Solutions");
    expect(model.year).toBe(2024);
    expect(model.score).toBe("93.7");
    expect(model.classification).toBe("Strong");
    expect(model.coverage).toBe("100.0%");
    expect(model.signals.find((signal) => signal.label === "EBIT MARGIN")?.value).toBe("25.5%");
    expect(model.dimensions).toHaveLength(5);
    expect(model.dupont.map((factor) => factor.label)).toEqual([
      "Net Profit Margin",
      "Asset Turnover",
      "Financial Leverage",
      "Return on Equity",
    ]);
  });
});
