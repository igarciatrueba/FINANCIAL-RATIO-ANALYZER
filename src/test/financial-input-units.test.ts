import { describe, expect, it } from "vitest";

import { parseFinancialAnalysisInput } from "@/domain";
import { cloneDemoCompany, demoCompanies } from "@/features/financial-input/demo-companies";
import {
  createEmptyFinancialInputForm,
  financialInputToFormValues,
  generateCompanyId,
  transformFormValuesToCanonical,
} from "@/features/financial-input/form-transform";
import { parsePlainNumber } from "@/features/financial-input/numeric-parser";
import {
  buildInputDraft,
  recoverInputDraft,
  serializeInputDraft,
} from "@/features/financial-input/persistence";
import { createFinancialValidationFeedback } from "@/features/financial-input/validation";

describe("Phase 4 numeric parsing", () => {
  it("parses plain integer and decimal strings without coercing blanks", () => {
    expect(parsePlainNumber("1200")).toEqual({ success: true, value: 1200 });
    expect(parsePlainNumber("-12.5")).toEqual({ success: true, value: -12.5 });
    expect(parsePlainNumber("")).toEqual({
      success: false,
      code: "required",
      message: "Enter a value.",
    });
    expect(parsePlainNumber("   ")).toEqual({
      success: false,
      code: "required",
      message: "Enter a value.",
    });
  });

  it("rejects non-finite values, currency symbols and ambiguous separators", () => {
    expect(parsePlainNumber("NaN")).toEqual(
      expect.objectContaining({ success: false, code: "invalid-format" })
    );
    expect(parsePlainNumber("Infinity")).toEqual(
      expect.objectContaining({ success: false, code: "invalid-format" })
    );
    expect(parsePlainNumber("€1200")).toEqual(
      expect.objectContaining({ success: false, code: "invalid-format" })
    );
    expect(parsePlainNumber("1,200")).toEqual(
      expect.objectContaining({ success: false, code: "invalid-format" })
    );
  });
});

describe("Phase 4 form transformation", () => {
  it("generates deterministic safe company identifiers", () => {
    expect(generateCompanyId("NovaTech Solutions")).toBe("novatech-solutions");
    expect(generateCompanyId("  Atlas & Manufacturing Group! ")).toBe("atlas-manufacturing-group");
    expect(generateCompanyId("")).toBe("company");
  });

  it("transforms string form values into a canonical candidate accepted by the domain parser", () => {
    const formValues = financialInputToFormValues(cloneDemoCompany("novatech-solutions"));
    const result = transformFormValuesToCanonical(formValues);

    expect(result.success).toBe(true);
    expect(result.success ? result.data.periods.map((period) => period.year) : []).toEqual([2022, 2023, 2024]);
    expect(result.success ? result.data.periods[0].incomeStatement.revenue : null).toBe(1280);
    expect(result.success ? parseFinancialAnalysisInput(result.data).success : false).toBe(true);
  });

  it("does not transform empty numeric strings into zero", () => {
    const formValues = financialInputToFormValues(cloneDemoCompany("novatech-solutions"));
    formValues.periods[0].incomeStatement.revenue = "";

    const result = transformFormValuesToCanonical(formValues);

    expect(result.success).toBe(false);
    expect(result.validation.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "periods.0.incomeStatement.revenue",
          severity: "error",
        }),
      ])
    );
  });

  it("starts with blank editable strings rather than canonical numbers", () => {
    const formValues = createEmptyFinancialInputForm();

    expect(formValues.company.currency).toBe("EUR");
    expect(formValues.periods).toHaveLength(3);
    expect(formValues.periods[0].incomeStatement.revenue).toBe("");
  });
});

describe("Phase 4 relationship feedback", () => {
  it("creates non-blocking warnings for impossible current-asset relationships", () => {
    const formValues = financialInputToFormValues(cloneDemoCompany("novatech-solutions"));
    formValues.periods[0].balanceSheet.cash = "900";
    formValues.periods[1].balanceSheet.accountsReceivable = "1000";
    formValues.periods[2].balanceSheet.inventory = "3000";
    formValues.periods[2].balanceSheet.currentAssets = "2500";

    const canonical = transformFormValuesToCanonical(formValues);
    expect(canonical.success).toBe(true);

    const feedback = createFinancialValidationFeedback(canonical.success ? canonical.data : null, false);

    expect(feedback.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "cash-greater-than-current-assets-2022", severity: "warning" }),
        expect.objectContaining({ id: "receivables-greater-than-current-assets-2023", severity: "warning" }),
        expect.objectContaining({ id: "inventory-greater-than-current-assets-2024", severity: "warning" }),
        expect.objectContaining({ id: "current-assets-greater-than-total-assets-2024", severity: "warning" }),
      ])
    );
    expect(feedback.errors).toHaveLength(0);
  });

  it("creates denominator-suitability warnings without blocking analysis", () => {
    const formValues = financialInputToFormValues(cloneDemoCompany("atlas-manufacturing-group"));
    formValues.periods[0].incomeStatement.revenue = "0";
    formValues.periods[0].balanceSheet.currentLiabilities = "0";
    formValues.periods[1].balanceSheet.totalAssets = "-1";
    formValues.periods[1].balanceSheet.equity = "0";
    formValues.periods[2].workingCapital.averageInventory = "0";
    formValues.periods[2].workingCapital.averageReceivables = "0";
    formValues.periods[2].workingCapital.averagePayables = "0";
    formValues.periods[2].incomeStatement.interestExpense = "0";

    const canonical = transformFormValuesToCanonical(formValues);
    expect(canonical.success).toBe(true);

    const feedback = createFinancialValidationFeedback(canonical.success ? canonical.data : null, false);

    expect(feedback.warnings.map((warning) => warning.id)).toEqual(
      expect.arrayContaining([
        "revenue-denominator-2022",
        "current-liabilities-denominator-2022",
        "total-assets-denominator-2023",
        "equity-denominator-2023",
        "average-inventory-denominator-2024",
        "average-receivables-denominator-2024",
        "average-payables-denominator-2024",
        "interest-expense-denominator-2024",
      ])
    );
    expect(feedback.errors).toHaveLength(0);
  });
});

describe("Phase 4 demo companies and persistence", () => {
  it("ships both demo companies as canonical parser-compatible fictional inputs", () => {
    expect(demoCompanies.map((company) => company.company.name)).toEqual([
      "NovaTech Solutions",
      "Atlas Manufacturing Group",
    ]);

    for (const demo of demoCompanies) {
      expect(parseFinancialAnalysisInput(demo).success).toBe(true);
    }
  });

  it("copies loaded demo data before editing", () => {
    const copy = cloneDemoCompany("novatech-solutions");
    copy.periods[0].incomeStatement.revenue = 1;

    expect(demoCompanies[0].periods[0].incomeStatement.revenue).toBe(1280);
  });

  it("serializes and recovers compatible local drafts", () => {
    const values = financialInputToFormValues(cloneDemoCompany("atlas-manufacturing-group"));
    const serialized = serializeInputDraft(buildInputDraft(values, "balance-sheet"));
    const recovered = recoverInputDraft(serialized);

    expect(recovered?.activeStep).toBe("balance-sheet");
    expect(recovered?.values.company.name).toBe("Atlas Manufacturing Group");
  });

  it("discards corrupt or incompatible local drafts", () => {
    expect(recoverInputDraft("{")).toBeNull();
    expect(recoverInputDraft(JSON.stringify({ schemaVersion: 999 }))).toBeNull();
  });
});
