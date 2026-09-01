import { canonicalFieldMappings } from "@/features/annual-report-ingestion/lib/canonical-field-mapping";
import type { AnnualReportReviewDraft } from "@/features/annual-report-ingestion/review-types";
import type { FinancialInputFormValues } from "@/features/financial-input/types";

type PeriodSectionKey = "incomeStatement" | "balanceSheet" | "cashFlow" | "workingCapital";

const sectionToPeriodKey = {
  income_statement: "incomeStatement",
  balance_sheet: "balanceSheet",
  cash_flow: "cashFlow",
  working_capital: "workingCapital",
} as const satisfies Record<string, PeriodSectionKey>;

export type ReviewFieldByFormPath = Record<string, AnnualReportReviewDraft["fields"][number] & { candidate: AnnualReportReviewDraft["candidates"][number] | null }>;

export function applyAnnualReportReviewDraft(current: FinancialInputFormValues, draft: AnnualReportReviewDraft) {
  const values = structuredClone(current);
  const fieldByFormPath: ReviewFieldByFormPath = {};

  draft.periodSlots.forEach((slot) => {
    values.periods[slot.slotIndex].year = slot.fiscalPeriod?.year === undefined ? "" : String(slot.fiscalPeriod.year);
  });
  for (const field of draft.fields) {
    const mapping = canonicalFieldMappings.find((item) => item.key === field.canonicalFieldKey);
    if (!mapping) continue;
    const candidate = field.currentCandidateId ? draft.candidates.find((item) => item.id === field.currentCandidateId) ?? null : null;
    const section = sectionToPeriodKey[mapping.statementSource];
    const path = `periods.${field.periodSlotIndex}.${section}.${field.canonicalFieldKey}`;
    fieldByFormPath[path] = { ...field, candidate };
    if (field.formValue !== null) {
      (values.periods[field.periodSlotIndex][section] as Record<string, string>)[field.canonicalFieldKey] = field.formValue;
    }
  }

  return { values, fieldByFormPath };
}
