import { describe, expect, it } from "vitest";
import { analyseFinancialStatements } from "@/domain";
import { cloneDemoCompany } from "@/features/financial-input/demo-companies";
import { buildExecutiveDashboardViewModel } from "@/features/executive-dashboard/lib/build-dashboard-view-model";
import { buildReportDocument } from "@/features/pdf-report/report-document";
import { buildWaterfallGeometry, escapeSvg, trendSvg, waterfallSvg } from "@/features/pdf-report/report-charts";

export function reportFixture(id: "novatech-solutions" | "atlas-manufacturing-group" = "novatech-solutions") {
  const input = cloneDemoCompany(id);
  return buildExecutiveDashboardViewModel(analyseFinancialStatements(input), input);
}

describe("independent financial report", () => {
  it.each(["novatech-solutions", "atlas-manufacturing-group"] as const)("preserves every displayed ratio and insight for %s without mutating the VM", (id) => {
    const vm = reportFixture(id);
    const before = JSON.stringify(vm);
    const doc = JSON.stringify(buildReportDocument(vm, new Date("2026-09-28T12:00:00Z")));
    expect(doc).toContain(vm.score.displayValue);
    for (const group of vm.ratioTable.groups) for (const row of group.rows) {
      for (const value of [row.label, row.currentValue.display, row.previousValue.display, row.change.display, row.formula]) expect(doc).toContain(value);
    }
    for (const insight of [...vm.principalStrengths, ...vm.principalRisks]) {
      expect(doc).toContain(insight.explanation);
      for (const evidence of insight.evidence) expect(doc).toContain(evidence.value);
    }
    expect(JSON.stringify(vm)).toBe(before);
    expect(doc).not.toMatch(/window\.print|Edit financials|Priority \d/);
  });
  it("retains unavailable values, reasons, and incomplete bridge states", () => {
    const vm = reportFixture();
    vm.profitabilityWaterfall = { status: "unavailable", steps: [], summary: "No supported bridge", reconciliationNote: "Missing statement input" };
    vm.dimensionRadar.current.values[0] = null;
    vm.healthTrend.points[1].value = null;
    const doc = JSON.stringify(buildReportDocument(vm));
    expect(doc).toContain("No supported bridge");
    expect(doc).not.toMatch(/NaN|Infinity/);
  });
  it("plots signed bridge movements cumulatively and subtotals from zero", () => {
    const vm = reportFixture();
    const points = buildWaterfallGeometry(vm.profitabilityWaterfall);
    expect(points[1].start).toBe(points[0].end);
    expect(points[1].end).toBe(points[2].end);
    expect(points[2].start).toBe(0);
    expect(points[3].start).toBe(points[2].end);
    expect(points[3].end).toBe(points[4].end);
    expect(points[5].end).toBe(points[6].end);
  });
  it("escapes untrusted chart labels as text", () => {
    expect(escapeSvg('<script x="x">&')).toBe("&lt;script x=&quot;x&quot;&gt;&amp;");
  });
  it("does not connect unavailable trend observations or invent a zero point", () => {
    const output = trendSvg([{ year: 2022, value: 0.1, displayValue: "10%" }, { year: 2023, value: null, displayValue: "Unavailable" }, { year: 2024, value: 0.2, displayValue: "20%" }], "percentage");
    expect(output.match(/<circle/g)).toHaveLength(2);
    expect(output).toContain("Unavailable");
    expect(output).toContain("%");
    expect(output).not.toContain('stroke="#087D79"');
  });
  it("handles full, partial and unavailable bridges without substituting values", () => {
    const vm = reportFixture();
    expect(vm.profitabilityWaterfall.status).toBe("partial");
    expect(waterfallSvg(vm.profitabilityWaterfall)).not.toMatch(/NaN|Infinity/);
    vm.profitabilityWaterfall.status = "full";
    expect(JSON.stringify(buildReportDocument(vm))).toContain("Profitability waterfall");
    vm.profitabilityWaterfall.steps[1].rawValue = -5000;
    expect(buildWaterfallGeometry(vm.profitabilityWaterfall)[1].end).toBe(-3120);
    expect(waterfallSvg(vm.profitabilityWaterfall)).not.toMatch(/NaN|Infinity/);
  });
  it.each(["USD", "GBP"] as const)("preserves %s amounts from the view model", (currency) => {
    const input = cloneDemoCompany("novatech-solutions");
    input.company.currency = currency;
    const vm = buildExecutiveDashboardViewModel(analyseFinancialStatements(input), input);
    const output = JSON.stringify(buildReportDocument(vm));
    expect(output).toContain(vm.kpis[4].currentValue.display);
    expect(output).toContain(currency);
  });
  it("accepts an empty set of signals without inventing placeholders", () => {
    const vm = reportFixture();
    vm.principalStrengths = []; vm.principalRisks = [];
    expect(JSON.stringify(buildReportDocument(vm))).toContain("No principal strength was generated.");
  });
  it("retains long text and full values without ellipsis", () => {
    const vm = reportFixture();
    vm.company.name = "Long company name ".repeat(16);
    vm.principalStrengths[0].explanation = "Supported explanation. ".repeat(80);
    vm.kpis[4].currentValue.display = "GBP 123,456,789,123,456.00";
    const doc = JSON.stringify(buildReportDocument(vm));
    expect(doc).toContain(vm.company.name);
    expect(doc).toContain(vm.principalStrengths[0].explanation);
    expect(doc).toContain(vm.kpis[4].currentValue.display);
  });
});
