import { describe, expect, it } from "vitest";

import { analyseFinancialStatements } from "@/domain";
import { cloneDemoCompany } from "@/features/financial-input/demo-companies";
import { createAnalysisSnapshot, parseAnalysisSnapshot } from "@/server/analysis/analysis-snapshot";
import { canonicalInputToStatementRows } from "@/server/datasets/canonical-statement-mapper";

describe("persistent financial snapshots", () => {
  it("maps every canonical period to four normalized statements without recalculating financial values", () => {
    const input = cloneDemoCompany("novatech-solutions");
    const statements = canonicalInputToStatementRows(input, "dataset-version-id");

    expect(statements).toHaveLength(12);
    expect(statements.filter((statement) => statement.values.length > 0)).toHaveLength(12);
    expect(statements.find((statement) => statement.statementType === "income_statement" && statement.periodYear === 2024)?.values)
      .toContainEqual(expect.objectContaining({ metricKey: "revenue", value: String(input.periods[2].incomeStatement.revenue) }));
  });

  it("persists and revalidates a versioned analytical payload instead of trusting JSON casts", () => {
    const input = cloneDemoCompany("atlas-manufacturing-group");
    const snapshot = createAnalysisSnapshot(analyseFinancialStatements(input));
    const recovered = parseAnalysisSnapshot(snapshot);

    expect(recovered).toEqual(analyseFinancialStatements(input));
    expect(parseAnalysisSnapshot({ schemaVersion: 1, result: { broken: true } })).toBeNull();
  });
});
