import { findCanonicalFieldMapping } from "@/features/annual-report-ingestion/lib/canonical-field-mapping";
import { normalizeFinancialValue } from "@/features/annual-report-ingestion/lib/normalize-financial-value";
import type { RawFinancialCandidate } from "@/features/annual-report-ingestion/lib/extract-row-candidates";

export type MappedFinancialCandidate = RawFinancialCandidate & {
  canonicalFieldKey: string;
  normalizedValue: number | null;
  confidence: "high" | "medium" | "low";
  status: "available" | "conflict" | "unresolved";
};

function groupKey(candidate: MappedFinancialCandidate) {
  return `${candidate.canonicalFieldKey}|${candidate.fiscalPeriod.label}`;
}

export function selectMappedCandidates(candidates: readonly RawFinancialCandidate[]): MappedFinancialCandidate[] {
  const mapped = candidates.flatMap((candidate) => {
    const mapping = findCanonicalFieldMapping(candidate.sourceLabel);
    const normalized = normalizeFinancialValue(candidate.rawValue, candidate.scale);
    if (!mapping || !normalized.success || mapping.extraction === "derived") return [];
    return [{
      ...candidate,
      canonicalFieldKey: mapping.key,
      normalizedValue: normalized.value,
      confidence: candidate.statementScope === "consolidated" && candidate.sourceRank === "primary_statement" ? "high" as const : "medium" as const,
      status: "available" as const,
    }];
  });

  const grouped = new Map<string, MappedFinancialCandidate[]>();
  for (const candidate of mapped) {
    const group = grouped.get(groupKey(candidate)) ?? [];
    group.push(candidate);
    grouped.set(groupKey(candidate), group);
  }

  return [...grouped.values()].flatMap((group) => {
    const values = new Set(group.map((candidate) => candidate.normalizedValue));
    if (values.size === 1) return [group[0]];
    const seed = group[0];
    return [{ ...seed, normalizedValue: null, confidence: "low", status: "conflict" }];
  });
}
