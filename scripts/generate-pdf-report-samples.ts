import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import PdfPrinter from "pdfmake";
import fonts from "pdfmake/build/vfs_fonts.js";
import { analyseFinancialStatements } from "../src/domain/index";
import { cloneDemoCompany } from "../src/features/financial-input/demo-companies";
import { buildExecutiveDashboardViewModel } from "../src/features/executive-dashboard/lib/build-dashboard-view-model";
import { buildReportDocument } from "../src/features/pdf-report/report-document";
import type { ExecutiveDashboardViewModel } from "../src/features/executive-dashboard/types/dashboard.types";

// Offline QA, no accounts, storage, or network. Same document builder as the browser.
const output = resolve(process.argv[2] ?? "output/pdf");
await mkdir(output, { recursive: true });
const vfs = fonts as unknown as Record<string, string>;
const printer = new PdfPrinter({ Roboto: {
  normal: Buffer.from(vfs["Roboto-Regular.ttf"], "base64"),
  bold: Buffer.from(vfs["Roboto-Medium.ttf"], "base64"),
  italics: Buffer.from(vfs["Roboto-Italic.ttf"], "base64"),
  bolditalics: Buffer.from(vfs["Roboto-MediumItalic.ttf"], "base64"),
} });
const samples: Array<{ name: string; vm: ExecutiveDashboardViewModel }> = [];
for (const company of ["novatech-solutions", "atlas-manufacturing-group"] as const) {
  const input = cloneDemoCompany(company);
  const vm = buildExecutiveDashboardViewModel(analyseFinancialStatements(input), input);
  samples.push({ name: company, vm });
}
if (process.argv.includes("--stress")) {
  const long = structuredClone(samples[0].vm);
  long.company.name = "QA layout fixture: International Industrial Technologies and Infrastructure Holdings ".repeat(4);
  long.company.industry = "Diversified industrial equipment, manufacturing, logistics and technology services ".repeat(4);
  long.principalStrengths[0].explanation = "Layout-only QA text, not an analytical conclusion. ".repeat(60);
  long.kpis[4].currentValue.display = "GBP 123,456,789,123,456.00";
  samples.push({ name: "qa-long-content", vm: long });
  const input = cloneDemoCompany("novatech-solutions");
  input.company.currency = "GBP";
  for (const period of input.periods) {
    period.incomeStatement.revenue = 0;
    period.balanceSheet.equity = 0;
    period.balanceSheet.currentLiabilities = 0;
  }
  samples.push({ name: "qa-unavailable-gbp", vm: buildExecutiveDashboardViewModel(analyseFinancialStatements(input)) });
}
for (const { name, vm } of samples) {
  const document = printer.createPdfKitDocument(buildReportDocument(vm, new Date("2026-09-28T12:00:00Z")));
  const chunks: Buffer[] = [];
  await new Promise<void>((done, reject) => {
    document.on("data", chunk => chunks.push(chunk));
    document.on("error", reject);
    document.on("end", done);
    document.end();
  });
  await writeFile(resolve(output, `${name}.pdf`), Buffer.concat(chunks));
  await writeFile(resolve(output, `${name}.view-model.json`), JSON.stringify(vm, null, 2));
  console.log(`${name}: report and exact source view model generated`);
}
