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

function candidateRank(candidate: RawFinancialCandidate) {
  const scope = candidate.statementScope === "consolidated" ? 3 : candidate.statementScope === "unknown" ? 2 : 1;
  const source = candidate.sourceRank === "primary_statement" ? 3 : candidate.sourceRank === "official_table" ? 2 : 1;
  return scope * 10 + source;
}

export function selectMappedCandidates(candidates: readonly RawFinancialCandidate[]): MappedFinancialCandidate[] {
  const mapped = candidates.flatMap((candidate) => {
    const mapping = findCanonicalFieldMapping(candidate.sourceLabel);
    const normalized = normalizeFinancialValue(candidate.rawValue, candidate.scale);
    if (!mapping || mapping.statementSource !== candidate.statementType || !normalized.success || mapping.extraction === "derived") return [];
    return [{
      ...candidate,
      canonicalFieldKey: mapping.key,
      normalizedValue: normalized.value,
      confidence: candidate.statementScope !== "parent" && candidate.sourceRank === "primary_statement" ? "high" as const : "medium" as const,
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
    const highestRank = Math.max(...group.map(candidateRank));
    const preferred = group.filter((candidate) => candidateRank(candidate) === highestRank);
    const values = new Set(preferred.map((candidate) => candidate.normalizedValue));
    if (values.size === 1) return [preferred[0]];
    const seed = preferred[0];
    return [{ ...seed, normalizedValue: null, confidence: "low", status: "conflict" }];
  });
}
