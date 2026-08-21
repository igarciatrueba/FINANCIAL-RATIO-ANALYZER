import { z } from "zod";

import type { FinancialAnalysisResult } from "@/domain";

export const ANALYSIS_RESULT_SCHEMA_VERSION = 1;

const metricResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("available"), value: z.number().finite() }),
  z.object({
    status: z.literal("unavailable"),
    reason: z.enum(["missing-input", "zero-denominator", "non-meaningful-denominator", "insufficient-history", "invalid-financial-relationship"]),
    affectedDenominator: z.string().optional(),
  }),
]);

const periodSchema = z.object({
  year: z.number().int(),
  ratios: z.record(z.string(), metricResultSchema),
  dupont: z.object({
    year: z.number().int(),
    roe: metricResultSchema,
    netProfitMargin: metricResultSchema,
    assetTurnover: metricResultSchema,
    financialLeverage: metricResultSchema,
    reconciliationStatus: z.enum(["reconciled", "approximate", "unavailable"]),
  }),
}).passthrough();

const analysisResultSchema = z.object({
  company: z.object({ id: z.string().min(1), name: z.string().min(1), industry: z.string().min(1), currency: z.enum(["EUR", "USD", "GBP"]) }),
  periods: z.array(periodSchema).length(3),
  currentPeriod: periodSchema,
  previousPeriod: periodSchema.optional(),
  score: z.object({ total: z.number().finite().nullable(), classification: z.string() }).passthrough(),
  insights: z.array(z.object({ id: z.string(), ruleId: z.string(), title: z.string(), evidence: z.array(z.unknown()) }).passthrough()),
  coverage: z.object({ coveragePercentage: z.number().finite() }).passthrough(),
  scoreHistory: z.array(z.object({ year: z.number().int(), score: z.object({ total: z.number().finite().nullable(), classification: z.string() }).passthrough() })),
  principalInsights: z.object({ strengths: z.array(z.unknown()), risks: z.array(z.unknown()) }),
});

const analysisSnapshotSchema = z.object({
  schemaVersion: z.literal(ANALYSIS_RESULT_SCHEMA_VERSION),
  result: analysisResultSchema,
});

export type AnalysisSnapshot = {
  schemaVersion: typeof ANALYSIS_RESULT_SCHEMA_VERSION;
  result: FinancialAnalysisResult;
};

export function createAnalysisSnapshot(result: FinancialAnalysisResult): AnalysisSnapshot {
  return { schemaVersion: ANALYSIS_RESULT_SCHEMA_VERSION, result };
}

export function parseAnalysisSnapshot(value: unknown): FinancialAnalysisResult | null {
  const parsed = analysisSnapshotSchema.safeParse(value);
  // The runtime boundary verifies all top-level analytical structures and metric variants before this domain type is restored.
  return parsed.success ? parsed.data.result as unknown as FinancialAnalysisResult : null;
}
