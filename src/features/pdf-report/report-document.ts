import type { Content, ContentTable, TableCell, TDocumentDefinitions } from "pdfmake/interfaces";
import type { DashboardInsightViewModel, ExecutiveDashboardViewModel } from "@/features/executive-dashboard/types/dashboard.types";
import { contributionSvg, radarSvg, reportColors, trendSvg, waterfallSvg } from "./report-charts";

const paragraph = (text: string, style = "body"): Content => ({ text, style });
const title = (text: string, pageBreak = false): Content => ({ text, style: "title", ...(pageBreak ? { pageBreak: "before" as const } : {}), headlineLevel: 1 });
const subtitle = (text: string): Content => ({ text, style: "subtitle", headlineLevel: 2 });
const chart = (svg: string, height?: number): Content => ({ svg, width: 499, ...(height ? { height } : {}), margin: [0, 8, 0, 10] });
const amount = (text: string, width: number): TableCell => ({ text, fontSize: Math.min(9, width / (Math.max(1, text.length) * 0.58)), noWrap: true });
function table(headers: string[], rows: TableCell[][], widths: ContentTable["table"]["widths"], compact = false): ContentTable {
  return { margin: [0, 5, 0, 12], fontSize: 9, table: { headerRows: 1, keepWithHeaderRows: 1, dontBreakRows: true, widths, body: [headers.map(text => ({ text, bold: true, color: "#FFFFFF", fillColor: reportColors.ink })), ...rows] }, layout: { hLineWidth: () => 0.5, vLineWidth: () => 0, hLineColor: () => reportColors.grid, paddingTop: () => compact ? 2.5 : 5, paddingBottom: () => compact ? 2.5 : 5, paddingLeft: () => 5, paddingRight: () => 5 } };
}
function insights(items: DashboardInsightViewModel[], empty: string): Content[] {
  if (!items.length) return [paragraph(empty)];
  return items.map((item, i) => ({ stack: [
    subtitle(`${i + 1}. ${item.title}`),
    paragraph(`${item.severityLabel} severity | ${item.trendLabel} | ${item.affectedYear}`, "caption"),
    paragraph(item.explanation),
    ...item.evidence.map(e => paragraph(`${e.label}: ${e.value}${e.context ? ` (${e.context})` : ""}`, "evidence")),
  ], unbreakable: item.explanation.length + item.evidence.reduce((length, e) => length + e.value.length + e.label.length + e.context.length, 0) < 1800 }));
}

/** Presentation only: the supplied VM owns every financial value, classification and explanation. */
export function buildReportDocument(vm: ExecutiveDashboardViewModel, generatedAt = new Date()): TDocumentDefinitions {
  const current = String(vm.period.currentYear);
  const prior = vm.period.comparisonYear === null ? "Prior unavailable" : String(vm.period.comparisonYear);
  const ratio = vm.ratioTrend.metricsById[vm.ratioTrend.defaultMetricId];
  const content: Content[] = [
    paragraph("EQUIVERSE / FINANCIAL INTELLIGENCE", "eyebrow"),
    title(vm.company.name),
    paragraph(`${vm.company.industry} | ${vm.company.currency} | ${vm.period.display}`, "caption"),
    paragraph(`Generated ${generatedAt.toISOString().slice(0, 10)} (UTC) | Executive financial report`, "caption"),
    { text: `${vm.score.displayValue} / 100`, style: "score" },
    paragraph(`${vm.score.classification} | ${vm.score.trend} | ${vm.coverage.displayValue} analytical coverage`, "lead"),
    paragraph(`Previous: ${vm.score.previousDisplayValue} | Movement: ${vm.score.changeDisplay}`),
    paragraph(`Strongest: ${vm.score.strongestDimension} | Weakest: ${vm.score.weakestDimension}`),
    subtitle(vm.diagnosis.headline), paragraph(vm.diagnosis.summary),
    paragraph(vm.diagnosis.driverContext),
    subtitle("Executive indicators"),
    table(["Indicator", current, prior, "Movement / assessment"], vm.kpis.map(k => [k.label, amount(k.currentValue.display, 110), amount(k.previousValue?.display ?? "Unavailable", 95), `${k.movementDisplay}\n${k.direction}`]), [115, 110, 95, "*"]),
    paragraph(vm.diagnosis.coverageContext, "caption"),

    title("Principal strengths & risks", true),
    paragraph("Deterministic signals from the same analysis used in the dashboard. Evidence retains its reported units.", "caption"),
    subtitle("Strengths"), ...insights(vm.principalStrengths, "No principal strength was generated."),
    subtitle("Risks"), ...insights(vm.principalRisks, "No principal risk was generated."),

    title("Financial dimensions", true),
    paragraph(`${current} current (teal) / ${prior} prior (grey). Scale: 0-100. Missing observations are not plotted or joined.`, "caption"),
    chart(radarSvg(vm.dimensionRadar)),
    table(["Dimension", current, prior, "Classification", "Coverage"], vm.dimensions.map((d, i) => [d.label, d.displayScore, vm.dimensionRadar.previous?.displayValues[i] ?? "Unavailable", d.status, d.coverageDisplay]), [115, 65, 65, 110, "*"]),
    ...vm.dimensions.map(d => paragraph(`${d.label}: strongest metric - ${d.strongestMetricLabel}; weakest metric - ${d.weakestMetricLabel}.`, "evidence")),
    paragraph(vm.diagnosis.strongestArea), paragraph(vm.diagnosis.primaryPressure),

    title("Three-year performance", true), subtitle("Financial Health Score"),
    paragraph(vm.healthTrend.summary), chart(trendSvg(vm.healthTrend.points, "score")),
    table(["Reporting year", "Score", "Classification"], vm.healthTrend.points.map(p => [String(p.year), p.displayValue, p.classification]), [150, 100, "*"]),
    ...(ratio ? [subtitle(ratio.label), paragraph(`${ratio.summary} Report selection: default analytical ratio; unit: ${ratio.unit}.`, "caption"), chart(trendSvg(ratio.points, ratio.unit)), paragraph(ratio.points.map(p => `${p.year}: ${p.displayValue}${p.unavailableReason ? ` (${p.unavailableReason})` : ""}`).join(" | "), "evidence")] : [paragraph("Ratio trend unavailable.")]),

    title("Profitability & working capital", true),
    subtitle(`${vm.profitabilityWaterfall.status === "partial" ? "Partial p" : "P"}rofitability waterfall`),
    paragraph(vm.profitabilityWaterfall.summary),
    ...(vm.profitabilityWaterfall.status !== "unavailable" ? [chart(waterfallSvg(vm.profitabilityWaterfall), 145), table(["Step", `Movement / subtotal (${vm.company.currency})`], vm.profitabilityWaterfall.steps.map((s, i) => [`${i + 1}. ${s.label}`, s.value.display]), [310, "*"])] : []),
    paragraph(vm.profitabilityWaterfall.reconciliationNote, "caption"),
    subtitle(vm.workingCapital.equation), paragraph(vm.workingCapital.explanation),
    table(["Working capital", current, prior, "Change / direction"], vm.workingCapital.metrics.map(m => [m.label, m.currentValue.display, m.previousValue.display, `${m.change.display}\n${m.direction}`]), [150, 85, 85, "*"]),

    title("Score contribution & context", true),
    paragraph("Score contribution by dimension", "lead"),
    paragraph("Weighted score points already calculated by the analysis engine. This is a contribution chart, not a financial-statement reconciliation.", "caption"),
    ...(vm.score.total === null ? [paragraph("Score contribution chart unavailable because the total score is unavailable.")] : [chart(contributionSvg(vm.scoreContribution))]),
    paragraph(`Total Financial Health Score: ${vm.scoreContribution.totalDisplay}`, "lead"),
    subtitle("Executive context"), paragraph(vm.executiveSummary.overallCondition),
    paragraph(`Key strength: ${vm.executiveSummary.keyImprovement}`),
    paragraph(`Primary concern: ${vm.executiveSummary.primaryConcern}`),
    subtitle("Coverage & interpretation"),
    paragraph(`${vm.coverage.displayValue} coverage. ${vm.coverage.validMetricCount} of ${vm.coverage.configuredMetricCount} configured metrics available; ${vm.coverage.unavailableMetricCount} unavailable.`),
    paragraph("Unavailable observations remain unavailable. Missing evidence is not represented as zero. Coverage describes input availability, not audit assurance or statistical confidence."),
    ...vm.kpis.map(k => paragraph(`${k.label}: ${k.interpretation}`, "evidence")),
    subtitle("Educational assessment"), paragraph(vm.diagnosis.disclaimer),
    paragraph("This document is a presentation of the current dashboard analysis snapshot. No financial calculations are performed by the report generator. Display rounding matches the application; internal analytical values remain unchanged.", "caption"),
  ];
  vm.ratioTable.groups.forEach((group, index) => {
    if (index === 0 || index === 2 || index === 4) content.push(title("Detailed financial ratios", true));
    content.push(subtitle(group.label));
    content.push(table(["Ratio / unit", current, prior, "Change / direction"], group.rows.map(r => [
      { stack: [{ text: r.label, bold: true }, { text: r.unit, color: reportColors.muted, fontSize: 8 }] },
      amount(r.currentValue.display, 92), amount(r.previousValue.display, 92), `${r.change.display}\n${r.direction}`,
    ]), [170, 92, 92, "*"], true));
    for (const row of group.rows) content.push(paragraph(`${row.label}: ${row.formula}. ${row.interpretation}${row.unavailableReason ? ` Unavailable: ${row.unavailableReason}.` : ""}`, "definition"));
  });
  return {
    pageSize: "A4", pageMargins: [48, 56, 48, 52],
    info: { title: `${vm.company.name} - Financial report`, author: "EQUIVERSE", subject: `${vm.period.display} financial analysis`, creationDate: generatedAt },
    defaultStyle: { font: "Roboto", fontSize: 9.5, lineHeight: 1.12, color: reportColors.ink },
    styles: {
      title: { fontSize: 25, bold: true, margin: [0, 0, 0, 13] },
      subtitle: { fontSize: 13, bold: true, margin: [0, 12, 0, 7] },
      score: { fontSize: 38, bold: true, color: reportColors.current, margin: [0, 14, 0, 4] },
      lead: { fontSize: 12, bold: true, margin: [0, 0, 0, 9] },
      body: { margin: [0, 0, 0, 8] },
      caption: { fontSize: 9, color: reportColors.muted, margin: [0, 0, 0, 8] },
      eyebrow: { fontSize: 9, bold: true, color: reportColors.current, margin: [0, 0, 0, 12] },
      evidence: { fontSize: 9, margin: [0, 0, 0, 5] },
      definition: { fontSize: 8.5, lineHeight: 1.05, color: reportColors.muted, margin: [0, 0, 0, 3] },
    },
    header: { text: `EQUIVERSE    /    FINANCIAL REPORT    /    FY ${current}`, fontSize: 8, color: reportColors.muted, margin: [48, 24, 48, 0] },
    footer: (page, pages) => ({ columns: [{ text: `${vm.company.name.length <= 100 ? vm.company.name : "Company identified on page 1"} | FY ${current}`, width: "*" }, { text: `Page ${page} of ${pages}`, alignment: "right", width: 80 }], margin: [48, 17, 48, 0], fontSize: 8, color: reportColors.muted }),
    pageBreakBefore: (node, following) => Boolean(node.headlineLevel && following.length === 0),
    content,
  };
}
