import type { DetectedFiscalPeriod, ExtractionPeriodSlot, FiscalPeriodIdentity } from "@/features/annual-report-ingestion/types";

function periodSortValue(period: DetectedFiscalPeriod) {
  if (period.endDate) {
    const time = Date.parse(period.endDate);
    if (!Number.isNaN(time)) return time;
  }

  if (typeof period.year === "number") return Date.UTC(period.year, 11, 31);
  return Number.POSITIVE_INFINITY;
}

function toFiscalPeriod(period: DetectedFiscalPeriod): FiscalPeriodIdentity {
  return {
    label: period.label,
    ...(period.year === undefined ? {} : { year: period.year }),
    ...(period.endDate === undefined ? {} : { endDate: period.endDate }),
  };
}

function periodIdentity(period: DetectedFiscalPeriod) {
  return period.endDate ? `end:${period.endDate}` : period.year === undefined ? `label:${period.label}` : `year:${period.year}`;
}

function emptySlot(slotIndex: 0 | 1 | 2): ExtractionPeriodSlot {
  return { slotIndex, fiscalPeriod: null, resolution: "manual_input_required" };
}

export function resolvePeriodSlots(periods: readonly DetectedFiscalPeriod[]): [ExtractionPeriodSlot, ExtractionPeriodSlot, ExtractionPeriodSlot] {
  const identityCounts = new Map<string, number>();
  for (const period of periods) {
    const identity = periodIdentity(period);
    identityCounts.set(identity, (identityCounts.get(identity) ?? 0) + 1);
  }

  const resolved = periods
    .filter((period) => identityCounts.get(periodIdentity(period)) === 1)
    .sort((left, right) => periodSortValue(left) - periodSortValue(right) || left.sourceColumnIndex - right.sourceColumnIndex)
    .slice(-3);

  const slots: [ExtractionPeriodSlot, ExtractionPeriodSlot, ExtractionPeriodSlot] = [emptySlot(0), emptySlot(1), emptySlot(2)];
  const start = 3 - resolved.length;

  resolved.forEach((period, index) => {
    const slotIndex = (start + index) as 0 | 1 | 2;
    slots[slotIndex] = { slotIndex, fiscalPeriod: toFiscalPeriod(period), resolution: "resolved" };
  });

  return slots;
}
