export type SourceScale = "units" | "thousands" | "millions" | "billions" | "unknown";

const scaleMultipliers: Record<Exclude<SourceScale, "unknown">, number> = {
  units: 1,
  thousands: 1_000,
  millions: 1_000_000,
  billions: 1_000_000_000,
};

export function normalizeFinancialValue(rawValue: string, scale: SourceScale): { success: true; value: number } | { success: false; reason: string } {
  const trimmed = rawValue.trim();
  if (!trimmed || /^(?:-|--|—|–|n\/?a)$/i.test(trimmed) || scale === "unknown") {
    return { success: false, reason: "missing-or-ambiguous" };
  }

  if (trimmed.includes(",") && trimmed.includes(".")) return { success: false, reason: "ambiguous-separator" };
  const negative = /^\(.*\)$/.test(trimmed) || /-$/.test(trimmed);
  const unsigned = trimmed.replace(/^\(/, "").replace(/\)$/, "").replace(/-$/, "").replace(/^\+/, "");
  if (!/^-?[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?$|^-?[0-9]+(?:\.[0-9]+)?$/.test(unsigned)) {
    return { success: false, reason: "invalid-number" };
  }

  const parsed = Number(unsigned.replaceAll(",", ""));
  const value = (negative ? -Math.abs(parsed) : parsed) * scaleMultipliers[scale];
  return Number.isFinite(value) ? { success: true, value } : { success: false, reason: "non-finite" };
}
