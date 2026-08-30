export type EvidencedValue = { id: string; value: number };

export function deriveTotalDebt(components: Array<EvidencedValue & { includedInTotalDebt: boolean }>) {
  const included = components.filter((component) => component.includedInTotalDebt && Number.isFinite(component.value));
  if (included.length === 0) return { status: "unresolved" as const };
  return {
    status: "derived" as const,
    value: included.reduce((sum, component) => sum + component.value, 0),
    sourceCandidateIds: included.map((component) => component.id),
  };
}

export function deriveAverageBalance(opening: EvidencedValue | null, closing: EvidencedValue | null) {
  if (!opening || !closing || !Number.isFinite(opening.value) || !Number.isFinite(closing.value)) return { status: "unresolved" as const };
  return {
    status: "derived" as const,
    value: (opening.value + closing.value) / 2,
    sourceCandidateIds: [opening.id, closing.id],
  };
}
