import { describe, expect, it } from "vitest";

import { resolvePeriodSlots } from "@/features/annual-report-ingestion/lib/extraction-periods";

describe("annual report period resolution", () => {
  it("leaves an empty canonical slot when a source report contains only two annual periods", () => {
    const slots = resolvePeriodSlots([
      { label: "FY2025", year: 2025, sourceColumnIndex: 0 },
      { label: "FY2024", year: 2024, sourceColumnIndex: 1 },
    ]);

    expect(slots).toEqual([
      { slotIndex: 0, fiscalPeriod: null, resolution: "manual_input_required" },
      { slotIndex: 1, fiscalPeriod: { label: "FY2024", year: 2024 }, resolution: "resolved" },
      { slotIndex: 2, fiscalPeriod: { label: "FY2025", year: 2025 }, resolution: "resolved" },
    ]);
  });

  it("preserves fiscal year-end labels while sorting source columns chronologically", () => {
    const slots = resolvePeriodSlots([
      { label: "52 weeks ended 29 June 2024", endDate: "2024-06-29", sourceColumnIndex: 0 },
      { label: "52 weeks ended 1 July 2023", endDate: "2023-07-01", sourceColumnIndex: 1 },
      { label: "53 weeks ended 2 July 2022", endDate: "2022-07-02", sourceColumnIndex: 2 },
    ]);

    expect(slots.map((slot) => slot.fiscalPeriod?.label)).toEqual([
      "53 weeks ended 2 July 2022",
      "52 weeks ended 1 July 2023",
      "52 weeks ended 29 June 2024",
    ]);
  });

  it("does not assign a synthetic period when duplicate source years conflict", () => {
    const slots = resolvePeriodSlots([
      { label: "FY2024", year: 2024, sourceColumnIndex: 0 },
      { label: "FY2024 restated", year: 2024, sourceColumnIndex: 1 },
      { label: "FY2023", year: 2023, sourceColumnIndex: 2 },
    ]);

    expect(slots).toEqual([
      { slotIndex: 0, fiscalPeriod: null, resolution: "manual_input_required" },
      { slotIndex: 1, fiscalPeriod: null, resolution: "manual_input_required" },
      { slotIndex: 2, fiscalPeriod: { label: "FY2023", year: 2023 }, resolution: "resolved" },
    ]);
  });
});
