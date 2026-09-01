import { describe, expect, it } from "vitest";

import { evaluateAnnualReportCorpusEntry, materializeGroundTruth } from "@/features/annual-report-ingestion/lib/corpus-validation";
import { annualReportCorpus } from "@/test/fixtures/annual-report-corpus";

describe("annual-report corpus validation", () => {
  it("keeps independently transcribed evidence for every canonical slot in every approved report", () => {
    expect(annualReportCorpus).toHaveLength(4);
    for (const entry of annualReportCorpus) {
      const values = materializeGroundTruth(entry.groundTruth);
      expect(values).toHaveLength(54);
      for (const value of values.filter((item) => item.classification === "PRESENT_DIRECT")) {
        expect(value.sourcePage).toBeGreaterThan(0);
        expect(value.sourceLabel).not.toBe("");
        expect(value.fiscalPeriod.label).not.toBe("");
      }
      for (const value of values.filter((item) => item.classification === "PRESENT_DERIVABLE")) {
        expect(value.components.length).toBeGreaterThan(0);
        expect(value.rule).not.toBe("");
      }
    }
    expect(materializeGroundTruth(annualReportCorpus.find((entry) => entry.company === "Diageo")!.groundTruth)
      .filter((value) => value.classification === "PRESENT_DIRECT" || value.classification === "PRESENT_DERIVABLE"))
      .toHaveLength(36);
  });

  it("materializes all canonical slots with an explicit unavailable default", () => {
    const groundTruth = materializeGroundTruth({
      defaultClassification: "NOT_PRESENT",
      values: [{
        canonicalFieldKey: "revenue",
        periodSlotIndex: 2,
        classification: "PRESENT_DIRECT",
        canonicalValue: "100",
        fiscalPeriod: { label: "2024", year: 2024 },
        currency: "USD",
        scale: "millions",
        sourcePage: 12,
        sourceStatement: "income_statement",
        sourceLabel: "Revenue",
      }, {
        canonicalFieldKey: "interestExpense",
        periodSlotIndex: 2,
        classification: "AMBIGUOUS",
        reason: "The report only presents net finance income.",
      }],
    });

    expect(groundTruth).toHaveLength(54);
    expect(groundTruth.find((value) => value.key === "revenue:2")?.classification).toBe("PRESENT_DIRECT");
    expect(groundTruth.find((value) => value.key === "interestExpense:2")?.classification).toBe("AMBIGUOUS");
    expect(groundTruth.find((value) => value.key === "cash:0")?.classification).toBe("NOT_PRESENT");
  });

  it("separates present-but-missed values from genuinely unavailable and unsupported auto-filled values", () => {
    const result = evaluateAnnualReportCorpusEntry({
      groundTruth: {
        defaultClassification: "NOT_PRESENT",
        values: [{
          canonicalFieldKey: "revenue",
          periodSlotIndex: 2,
          classification: "PRESENT_DIRECT",
          canonicalValue: "100",
          fiscalPeriod: { label: "2024", year: 2024 },
          currency: "USD",
          scale: "millions",
          sourcePage: 12,
          sourceStatement: "income_statement",
          sourceLabel: "Revenue",
        }, {
          canonicalFieldKey: "ebit",
          periodSlotIndex: 2,
          classification: "PRESENT_DIRECT",
          canonicalValue: "30",
          fiscalPeriod: { label: "2024", year: 2024 },
          currency: "USD",
          scale: "millions",
          sourcePage: 12,
          sourceStatement: "income_statement",
          sourceLabel: "Operating income",
        }, {
          canonicalFieldKey: "interestExpense",
          periodSlotIndex: 2,
          classification: "AMBIGUOUS",
          reason: "The report only presents net finance income.",
        }],
      },
      draftFields: [{ canonicalFieldKey: "revenue", periodSlotIndex: 2, formValue: "100", candidateReference: "revenue:2", reviewState: "UNREVIEWED" }, {
        canonicalFieldKey: "cash", periodSlotIndex: 2, formValue: "20", candidateReference: "cash:2", reviewState: "UNREVIEWED" }, {
        canonicalFieldKey: "ebit", periodSlotIndex: 2, formValue: null, candidateReference: null, reviewState: "NEEDS_REVIEW" }, {
        canonicalFieldKey: "interestExpense", periodSlotIndex: 2, formValue: null, candidateReference: null, reviewState: "NEEDS_REVIEW" }],
      candidates: [],
    });

    expect(result).toMatchObject({
      canonicalValuesPresent: 2,
      autoFilled: 2,
      correct: 1,
      needsReview: 0,
      presentButMissed: 1,
      notPresent: 51,
      ambiguous: 1,
      incorrect: 0,
      unsupported: 1,
      precision: 0.5,
      recall: 0.5,
    });
  });

  it("counts a matching supported suggestion as resolved without treating it as an auto-fill", () => {
    const result = evaluateAnnualReportCorpusEntry({
      groundTruth: {
        defaultClassification: "NOT_PRESENT",
        values: [{
          canonicalFieldKey: "netIncome",
          periodSlotIndex: 2,
          classification: "PRESENT_DIRECT",
          canonicalValue: "42",
          fiscalPeriod: { label: "2024", year: 2024 },
          currency: "EUR",
          scale: "millions",
          sourcePage: 8,
          sourceStatement: "income_statement",
          sourceLabel: "Net income",
        }],
      },
      draftFields: [{ canonicalFieldKey: "netIncome", periodSlotIndex: 2, formValue: null, candidateReference: "netIncome:2", reviewState: "NEEDS_REVIEW" }],
      candidates: [{ reference: "netIncome:2", normalizedValue: "42", selectionStatus: "available" }],
    });

    expect(result.needsReview).toBe(1);
    expect(result.correctlyResolved).toBe(1);
    expect(result.presentButMissed).toBe(0);
    expect(result.recall).toBe(1);
  });
});
